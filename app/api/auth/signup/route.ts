import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '@/lib/db';

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
  let body: { email?: string; password?: string; fullName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders() });
  }

  const { email, password, fullName } = body;

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: corsHeaders() });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400, headers: corsHeaders() });
  }

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400, headers: corsHeaders() });
  }

  try {
    const sql = getDB();

    const existing = (await sql`
      SELECT id FROM contextify_users WHERE email = ${email.toLowerCase()}
    `) as Record<string, unknown>[];

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409, headers: corsHeaders() });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const users = (await sql`
      INSERT INTO contextify_users (email, password_hash, full_name, tier, analyses_count)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${fullName.trim()}, 'free', 0)
      RETURNING id, email, full_name, tier, analyses_count, created_at
    `) as Record<string, unknown>[];

    const user = users[0];

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO contextify_sessions (token, user_id, expires_at)
      VALUES (${token}, ${user.id}, ${expiresAt.toISOString()})
    `;

    const responseBody = {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        tier: user.tier,
      },
      token,
    };

    const response = NextResponse.json(responseBody, { status: 201, headers: corsHeaders() });
    response.cookies.set('ctx_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}
