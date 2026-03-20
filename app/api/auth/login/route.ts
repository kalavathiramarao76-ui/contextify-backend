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
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders() });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400, headers: corsHeaders() });
  }

  try {
    const sql = getDB();

    // Find user by email
    const users = await sql`
      SELECT id, email, password_hash, full_name, tier, analyses_count
      FROM contextify_users
      WHERE email = ${email.toLowerCase()}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401, headers: corsHeaders() });
    }

    const user = users[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401, headers: corsHeaders() });
    }

    // Create session token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
        analysesCount: user.analyses_count,
      },
      token,
    };

    const response = NextResponse.json(responseBody, { status: 200, headers: corsHeaders() });
    response.cookies.set('ctx_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}
