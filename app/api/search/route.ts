import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/articles';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit("search:" + ip, 30, 60000)) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ articles: [], total: 0 });
  }

  const articles = searchArticles(q, 20);
  return NextResponse.json({ articles, total: articles.length });
}
