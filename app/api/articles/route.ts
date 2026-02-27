import { NextRequest, NextResponse } from 'next/server';
import { getArticles, countArticles, markArticleTweeted } from '@/lib/articles';

const API_KEY = process.env.WEBSITE_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit    = Math.min(parseInt(searchParams.get('limit')  || '20'), 100);
  const offset   = parseInt(searchParams.get('offset') || '0');
  const category = searchParams.get('category') || undefined;

  const articles = getArticles({ limit, offset, category });
  const total    = countArticles(category);

  return NextResponse.json({ articles, total, limit, offset });
}

export async function PATCH(req: NextRequest) {
  if (req.headers.get('x-api-key') !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  markArticleTweeted(slug);
  return NextResponse.json({ ok: true });
}
