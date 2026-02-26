import getDb from './db';

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
  tweet_ar: string | null;
  tweet_en: string | null;
  speaker_name: string | null;
  speaker_title: string | null;
  published_at: string;
  created_at: string;
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
  return db.prepare(`SELECT * FROM articles ORDER BY published_at DESC LIMIT 1`).get() as Article | null;
}

export function createArticle(data: Omit<Article, 'id' | 'created_at'>): Article {
  const db = getDb();

  db.prepare(`
    INSERT OR IGNORE INTO articles
      (slug, title_ar, title_en, body_ar, body_en, excerpt_ar, excerpt_en,
       category, image_url, source, tweet_ar, tweet_en,
       speaker_name, speaker_title, published_at)
    VALUES
      (@slug, @title_ar, @title_en, @body_ar, @body_en, @excerpt_ar, @excerpt_en,
       @category, @image_url, @source, @tweet_ar, @tweet_en,
       @speaker_name, @speaker_title, @published_at)
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
  turkey:     'تركيا',
};
