import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "qs-admin-session";

function getPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is required");
  return pw;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit("auth:" + ip, 5, 60000)) {
    return NextResponse.json({ error: "too many attempts" }, { status: 429 });
  }
  const password = getPassword();
  const { password: submitted } = await req.json().catch(() => ({} as any));
  if (submitted !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, Buffer.from(password).toString("base64"), {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export function isAuthenticated(req: NextRequest): boolean {
  const session = req.cookies.get("qs-admin-session")?.value;
  return session === Buffer.from(getPassword()).toString("base64");
}
