import getDb from './db';
import crypto from 'crypto';
export { getDefaultImage, CATEGORY_IMAGES } from './categories';

export interface Article {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string | null;
  body_ar: string;
  body_en: string | null;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  category: string;
  image_url: string | null;
  source: string;
  source_url: string | null;
  content_hash: string | null;
  tweet_ar: string | null;
  tweet_en: string | null;
  speaker_name: string | null;
  speaker_title: string | null;
  published_at: string;
  created_at: string;
}


export function makeContentHash(title: string, source_url?: string | null): string {
  const input = (source_url || title).toLowerCase().trim();
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export function getArticles(opts: {
  limit?: number;
  offset?: number;
  category?: string;
} = {}): Article[] {
  const db = getDb();
  const { limit = 20, offset = 0, category } = opts;

  if (category && category !== 'all') {
    return db.prepare(
      `SELECT * FROM articles WHERE category = ? ORDER BY published_at DESC LIMIT ? OFFSET ?`
    ).all(category, limit, offset) as Article[];
  }

  return db.prepare(
    `SELECT * FROM articles ORDER BY published_at DESC LIMIT ? OFFSET ?`
  ).all(limit, offset) as Article[];
}

export function getArticleBySlug(slug: string): Article | null {
  const db = getDb();
  return db.prepare(`SELECT * FROM articles WHERE slug = ?`).get(slug) as Article | null;
}

export function getLatestArticle(): Article | null {
  const db = getDb();
  // Prefer Qatar/Gulf/diplomacy/economy stories for the hero slot.
  // Fall back to overall latest only if nothing in preferred categories within last 48h.
  const preferred = db.prepare(`
    SELECT * FROM articles
    WHERE category IN ('gulf','diplomacy','economy','politics','africa','media','general')
      AND image_url IS NOT NULL
      AND image_url NOT LIKE '/curated/%'
      AND image_url NOT LIKE '/qatar%'
      AND published_at > datetime('now', '-48 hours')
    ORDER BY published_at DESC LIMIT 1
  `).get() as Article | null;
  if (preferred) return preferred;
  return db.prepare(`SELECT * FROM articles ORDER BY published_at DESC LIMIT 1`).get() as Article | null;
}

export function getArticleBySourceUrl(sourceUrl: string): Article | null {
  const db = getDb();
  return db.prepare(`SELECT id, slug FROM articles WHERE source_url = ? LIMIT 1`).get(sourceUrl) as Article | null;
}

export function getArticleByContentHash(hash: string): Article | null {
  const db = getDb();
  return db.prepare(`SELECT id, slug FROM articles WHERE content_hash = ? LIMIT 1`).get(hash) as Article | null;
}

export function createArticle(data: Omit<Article, 'id' | 'created_at'>): Article {
  const db = getDb();

  db.prepare(`
    INSERT OR IGNORE INTO articles
      (slug, title_ar, title_en, body_ar, body_en, excerpt_ar, excerpt_en,
       category, image_url, source, source_url, content_hash,
       tweet_ar, tweet_en, speaker_name, speaker_title, published_at)
    VALUES
      (@slug, @title_ar, @title_en, @body_ar, @body_en, @excerpt_ar, @excerpt_en,
       @category, @image_url, @source, @source_url, @content_hash,
       @tweet_ar, @tweet_en, @speaker_name, @speaker_title, @published_at)
  `).run(data);

  return db.prepare(`SELECT * FROM articles WHERE slug = ?`).get(data.slug) as Article;
}

export function countArticles(category?: string): number {
  const db = getDb();
  if (category && category !== 'all') {
    return (db.prepare(`SELECT COUNT(*) as n FROM articles WHERE category = ?`).get(category) as { n: number }).n;
  }
  return (db.prepare(`SELECT COUNT(*) as n FROM articles`).get() as { n: number }).n;
}

export const CATEGORIES: Record<string, string> = {
  general:    'عام',
  diplomacy:  'دبلوماسية',
  palestine:  'فلسطين',
  economy:    'اقتصاد',
  politics:   'سياسة',
  gulf:       'خليج',
  media:      'إعلام',
  africa:     'أفريقيا',
  turkey:     'تركيا',
};
