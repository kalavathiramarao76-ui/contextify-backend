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
    return NextResponse.json({ user: null }, { status: 200, headers: corsHeaders() });
  }

  try {
    const sql = getDB();
    const users = (await sql`
      SELECT id, email, full_name, tier, analyses_count
      FROM contextify_users
      WHERE id = ${session.userId}
    `) as Record<string, unknown>[];

    if (users.length === 0) {
      return NextResponse.json({ user: null }, { status: 200, headers: corsHeaders() });
    }

    const user = users[0];
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          tier: user.tier,
          analysesCount: user.analyses_count,
        },
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}
