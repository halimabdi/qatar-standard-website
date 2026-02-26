import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'QatarStandard2024!';
const SESSION_COOKIE = 'qs-admin-session';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, Buffer.from(ADMIN_PASSWORD).toString('base64'), {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export function isAuthenticated(req: NextRequest): boolean {
  const session = req.cookies.get('qs-admin-session')?.value;
  return session === Buffer.from(ADMIN_PASSWORD).toString('base64');
}
