import getDb from './db';
import crypto from 'crypto';
import { CATEGORY_IMAGES } from './categories';
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
  video_url: string | null;
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
  untweetedOnly?: boolean;
} = {}): Article[] {
  const db = getDb();
  const { limit = 20, offset = 0, category, untweetedOnly } = opts;

  if (untweetedOnly) {
    // Only articles from last 2 hours that haven't been tweeted yet
    const base = `SELECT * FROM articles
      WHERE tweeted_at IS NULL
        AND published_at > datetime('now', '-2 hours')
      ORDER BY published_at ASC LIMIT ? OFFSET ?`;
    if (category && category !== 'all') {
      return db.prepare(
        `SELECT * FROM articles
          WHERE tweeted_at IS NULL
            AND published_at > datetime('now', '-2 hours')
            AND category = ?
          ORDER BY published_at ASC LIMIT ? OFFSET ?`
      ).all(category, limit, offset) as Article[];
    }
    return db.prepare(base).all(limit, offset) as Article[];
  }

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
       category, image_url, video_url, source, source_url, content_hash,
       tweet_ar, tweet_en, speaker_name, speaker_title, published_at)
    VALUES
      (@slug, @title_ar, @title_en, @body_ar, @body_en, @excerpt_ar, @excerpt_en,
       @category, @image_url, @video_url, @source, @source_url, @content_hash,
       @tweet_ar, @tweet_en, @speaker_name, @speaker_title, @published_at)
  `).run(data);

  return db.prepare(`SELECT * FROM articles WHERE slug = ?`).get(data.slug) as Article;
}

/** Server-side only: pick the least-used curated image from the category pool. */
export function getLeastUsedCuratedImage(category: string, source: string): string {
  const pool = CATEGORY_IMAGES[category];
  if (!pool || pool.length === 0) {
    return source === 'bot' ? '/qatar-breaking-news.png' : '/qatar-standard-logo.png';
  }
  if (pool.length === 1) return pool[0];
  try {
    const db = getDb();
    const counts = pool.map(img => {
      const row = db.prepare('SELECT COUNT(*) as n FROM articles WHERE image_url = ?').get(img) as { n: number };
      return { img, n: row?.n ?? 0 };
    });
    counts.sort((a, b) => a.n - b.n);
    return counts[0].img;
  } catch {
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export function markArticleTweeted(slug: string): void {
  const db = getDb();
  db.prepare(`UPDATE articles SET tweeted_at = datetime('now') WHERE slug = ?`).run(slug);
}

export function updateArticleImage(slug: string, imageUrl: string): void {
  const db = getDb();
  db.prepare(`UPDATE articles SET image_url = ? WHERE slug = ?`).run(imageUrl, slug);
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


export function searchArticles(query: string, limit = 20): Article[] {
  const db = getDb();
  const like = '%' + query + '%';
  return db.prepare(`
    SELECT * FROM articles
    WHERE title_en LIKE ? OR title_ar LIKE ? OR body_en LIKE ? OR body_ar LIKE ?
    ORDER BY published_at DESC LIMIT ?
  `).all(like, like, like, like, limit) as Article[];
}

export function incrementViewCount(slug: string): void {
  const db = getDb();
  db.prepare('UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = ?').run(slug);
}

export function getMostRead(limit = 5): Article[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM articles
    WHERE published_at > datetime('now', '-7 days')
    ORDER BY view_count DESC
    LIMIT ?
  `).all(limit) as Article[];
}

export function getBreakingArticle(): Article | null {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM articles
    WHERE (UPPER(title_en) LIKE '%BREAKING%' OR UPPER(title_ar) LIKE '%عاجل%')
      AND published_at > datetime('now', '-2 hours')
    ORDER BY published_at DESC LIMIT 1
  `).get() as Article | null;
}
