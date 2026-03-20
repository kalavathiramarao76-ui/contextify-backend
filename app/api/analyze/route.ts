import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDB } from '@/lib/db';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are Contextify AI — the world's most advanced text decoder. Analyze the given text and return a JSON object with these fields:
- summary: plain English explanation (2-4 sentences, like explaining to a friend)
- riskLevel: one of 'safe', 'caution', 'warning', 'danger'
- manipulationScore: 0-100 (0=completely honest, 100=extremely manipulative)
- flags: array of { text: 'quoted phrase from input', reason: 'why this is flagged', severity: 'safe/caution/warning/danger', type: 'manipulation/legal_risk/hidden_cost/gaslighting/pressure_tactic/misleading/unclear' }
- keyPoints: array of 3-5 key takeaways
- hiddenMeanings: array of things the text implies but doesn't explicitly say
- toneAnalysis: string describing the tone (e.g. 'passive-aggressive', 'professional', 'manipulative', 'friendly')
- suggestedResponse: a confident, clear response the user could send back (or null if not applicable)

Be thorough. Flag every manipulation tactic: gaslighting, DARVO, love bombing, guilt tripping, pressure tactics, false urgency, emotional blackmail. For contracts: flag hidden costs, auto-renewal, liability shifts, non-compete clauses. For medical bills: flag overbilling, upcoding, duplicate charges.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation outside the JSON object.`;

// Simple in-memory rate limiter: 20 req/min per IP (for unauthenticated users)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 20;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  // Try to get authenticated session
  const session = await getSession(req);

  // For unauthenticated requests, apply IP-based rate limiting
  if (!session) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 20 requests per minute. Sign in for higher limits.' },
        { status: 429, headers: corsHeaders() }
      );
    }
  }

  let body: { text?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const { text, type } = body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required field: text' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing API key' },
      { status: 500, headers: corsHeaders() }
    );
  }

  const userMessage = type
    ? `Text type: ${type}\n\nText to analyze:\n${text}`
    : `Text to analyze:\n${text}`;

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Groq API', details: String(err) },
      { status: 502, headers: corsHeaders() }
    );
  }

  if (!groqRes.ok) {
    const errorText = await groqRes.text();
    return NextResponse.json(
      { error: 'Groq API error', details: errorText },
      { status: groqRes.status, headers: corsHeaders() }
    );
  }

  const groqData = await groqRes.json();
  const rawContent: string = groqData.choices?.[0]?.message?.content ?? '';

  let analysis: unknown;
  try {
    // Strip possible markdown code fences
    const cleaned = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    analysis = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response', raw: rawContent },
      { status: 500, headers: corsHeaders() }
    );
  }

  // If user is logged in, save analysis to DB and increment count
  let savedAnalysisId: string | null = null;
  if (session) {
    try {
      const sql = getDB();
      const inputType = type || 'message';

      const inserted = await sql`
        INSERT INTO contextify_analyses (user_id, input_text, input_type, result)
        VALUES (${session.userId}, ${text.trim()}, ${inputType}, ${JSON.stringify(analysis)})
        RETURNING id
      `;

      savedAnalysisId = inserted[0]?.id ?? null;

      // Increment analyses_count
      await sql`
        UPDATE contextify_users
        SET analyses_count = analyses_count + 1
        WHERE id = ${session.userId}
      `;
    } catch (err) {
      // Don't fail the request if saving fails — still return analysis
      console.error('Failed to save analysis:', err);
    }
  }

  const responsePayload = {
    ...(analysis as object),
    ...(savedAnalysisId ? { analysisId: savedAnalysisId, saved: true } : { saved: false }),
  };

  return NextResponse.json(responsePayload, { status: 200, headers: corsHeaders() });
}
