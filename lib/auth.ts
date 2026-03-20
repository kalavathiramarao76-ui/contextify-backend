import { NextRequest } from 'next/server';
import { getDB } from './db';

export interface SessionUser {
  userId: string;
  email: string;
  tier: string;
}

export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  let token: string | null = null;

  const cookie = request.cookies.get('ctx_session');
  if (cookie?.value) {
    token = cookie.value;
  } else {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  try {
    const sql = getDB();
    const rows = (await sql`
      SELECT s.user_id, u.email, u.tier
      FROM contextify_sessions s
      JOIN contextify_users u ON u.id = s.user_id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
    `) as Record<string, unknown>[];

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      userId: row.user_id as string,
      email: row.email as string,
      tier: row.tier as string,
    };
  } catch {
    return null;
  }
}
