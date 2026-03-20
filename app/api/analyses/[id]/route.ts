import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDB } from '@/lib/db';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  const { id } = params;

  try {
    const sql = getDB();
    const rows = (await sql`
      SELECT id, input_text, input_type, result, is_favorite, created_at
      FROM contextify_analyses
      WHERE id = ${id} AND user_id = ${session.userId}
    `) as Record<string, unknown>[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404, headers: corsHeaders() });
    }

    const a = rows[0];
    return NextResponse.json(
      {
        id: a.id,
        inputText: a.input_text,
        inputType: a.input_type,
        result: a.result,
        isFavorite: a.is_favorite,
        createdAt: a.created_at,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Analysis GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  const { id } = params;

  try {
    const sql = getDB();
    const result = (await sql`
      DELETE FROM contextify_analyses
      WHERE id = ${id} AND user_id = ${session.userId}
      RETURNING id
    `) as Record<string, unknown>[];

    if (result.length === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error('Analysis DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  const { id } = params;

  try {
    const sql = getDB();

    // Toggle is_favorite
    const result = (await sql`
      UPDATE contextify_analyses
      SET is_favorite = NOT is_favorite
      WHERE id = ${id} AND user_id = ${session.userId}
      RETURNING id, is_favorite
    `) as Record<string, unknown>[];

    if (result.length === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json(
      { ok: true, isFavorite: result[0].is_favorite },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Analysis PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}
