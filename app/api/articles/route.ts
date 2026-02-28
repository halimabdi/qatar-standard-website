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

async function checkImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)' },
    });
    if (res.ok) return true;
    // Some servers block HEAD — fallback to GET range request
    if (res.status === 405 || res.status === 403) {
      const res2 = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QatarStandard/1.0)', Range: 'bytes=0-0' },
      });
      return res2.ok || res2.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest) {
  if (req.headers.get('x-api-key') !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { slug, image_url } = body;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  if (image_url !== undefined) {
    // Verify image is reachable before saving
    if (image_url && !(await checkImageReachable(image_url))) {
      return NextResponse.json({ error: 'image_url returned 404 or is unreachable' }, { status: 422 });
    }
    updateArticleImage(slug, image_url);
  } else {
    markArticleTweeted(slug);
  }
  return NextResponse.json({ ok: true });
}
