import { NextRequest, NextResponse } from 'next/server';
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
  // Get token from cookie or Authorization header
  let token: string | null = null;

  const cookie = req.cookies.get('ctx_session');
  if (cookie?.value) {
    token = cookie.value;
  } else {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (token) {
    try {
      const sql = getDB();
      await sql`DELETE FROM contextify_sessions WHERE token = ${token}`;
    } catch (err) {
      console.error('Logout DB error:', err);
    }
  }

  const response = NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders() });
  response.cookies.set('ctx_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    expires: new Date(0),
  });

  return response;
}
