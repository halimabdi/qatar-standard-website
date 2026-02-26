import { NextRequest, NextResponse } from 'next/server';
import { getArticles, countArticles } from '@/lib/articles';

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
