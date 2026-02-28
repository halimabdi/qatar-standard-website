import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/admin/auth/route';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — list articles with pagination + search
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit  = parseInt(searchParams.get('limit')  || '50');
  const q      = searchParams.get('q') || '';

  const db = getDb();
  let rows, total;
  if (q) {
    const like = `%${q}%`;
    rows  = db.prepare('SELECT id, slug, title_en, title_ar, source, published_at FROM articles WHERE title_en LIKE ? OR title_ar LIKE ? OR slug LIKE ? ORDER BY published_at DESC LIMIT ? OFFSET ?').all(like, like, like, limit, offset);
    total = (db.prepare('SELECT COUNT(*) as n FROM articles WHERE title_en LIKE ? OR title_ar LIKE ? OR slug LIKE ?').get(like, like, like) as { n: number }).n;
  } else {
    rows  = db.prepare('SELECT id, slug, title_en, title_ar, source, published_at FROM articles ORDER BY published_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    total = (db.prepare('SELECT COUNT(*) as n FROM articles').get() as { n: number }).n;
  }
  return NextResponse.json({ articles: rows, total });
}

// DELETE — remove article by slug
export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { slug } = await req.json().catch(() => ({} as Record<string, string>));
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const db = getDb();
  const result = db.prepare('DELETE FROM articles WHERE slug = ?').run(slug);
  if (result.changes === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ success: true, deleted: slug });
}
