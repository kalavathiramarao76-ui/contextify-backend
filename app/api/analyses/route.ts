import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const sql = getDB();
    const analyses = (await sql`
      SELECT id, input_text, input_type, result, is_favorite, created_at
      FROM contextify_analyses
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as Record<string, unknown>[];

    const totalRows = (await sql`
      SELECT COUNT(*) as count FROM contextify_analyses WHERE user_id = ${session.userId}
    `) as Record<string, unknown>[];

    return NextResponse.json(
      {
        analyses: analyses.map((a) => ({
          id: a.id,
          inputText: a.input_text,
          inputType: a.input_type,
          result: a.result,
          isFavorite: a.is_favorite,
          createdAt: a.created_at,
        })),
        total: parseInt(String(totalRows[0].count), 10),
        limit,
        offset,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Analyses list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}
