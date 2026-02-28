import { NextRequest, NextResponse } from 'next/server';
import { getArticles, countArticles, markArticleTweeted, updateArticleImage } from '@/lib/articles';

const API_KEY = process.env.WEBSITE_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit         = Math.min(parseInt(searchParams.get('limit')  || '20'), 100);
  const offset        = parseInt(searchParams.get('offset') || '0');
  const category      = searchParams.get('category') || undefined;
  const untweetedOnly = searchParams.get('untweeted') === 'true';

  const articles = getArticles({ limit, offset, category, untweetedOnly });
  const total    = untweetedOnly ? articles.length : countArticles(category);

  return NextResponse.json({ articles, total, limit, offset });
}

export async function PATCH(req: NextRequest) {
  if (req.headers.get('x-api-key') !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { slug, image_url } = body;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  if (image_url !== undefined) {
    updateArticleImage(slug, image_url);
  } else {
    markArticleTweeted(slug);
  }
  return NextResponse.json({ ok: true });
}
