import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_PATH || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'articles.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT    UNIQUE NOT NULL,
      title_ar      TEXT    NOT NULL,
      title_en      TEXT,
      body_ar       TEXT    NOT NULL,
      body_en       TEXT,
      excerpt_ar    TEXT,
      excerpt_en    TEXT,
      category      TEXT    DEFAULT 'general',
      image_url     TEXT,
      source        TEXT    DEFAULT 'manual',
      source_url    TEXT,
      content_hash  TEXT,
      tweet_ar      TEXT,
      tweet_en      TEXT,
      speaker_name  TEXT,
      speaker_title TEXT,
      published_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_articles_category     ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_slug         ON articles(slug);
  `);


  // Full-text search virtual table
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
        title_en, title_ar, body_en, body_ar,
        content=articles, content_rowid=id
      );
    `);
    // Rebuild FTS index if empty
    const ftsCount = (db.prepare('SELECT COUNT(*) as n FROM articles_fts').get() as { n: number }).n;
    const artCount = (db.prepare('SELECT COUNT(*) as n FROM articles').get() as { n: number }).n;
    if (ftsCount === 0 && artCount > 0) {
      db.exec("INSERT INTO articles_fts(articles_fts) VALUES('rebuild')");
    }
  } catch {}

  // Migrate existing tables — add new columns if missing
  const cols = (db.prepare(`PRAGMA table_info(articles)`).all() as Array<{ name: string }>).map(c => c.name);
  if (!cols.includes('source_url'))   db.exec(`ALTER TABLE articles ADD COLUMN source_url TEXT`);
  if (!cols.includes('content_hash')) db.exec(`ALTER TABLE articles ADD COLUMN content_hash TEXT`);
  if (!cols.includes('tweeted_at'))   db.exec(`ALTER TABLE articles ADD COLUMN tweeted_at DATETIME NULL`);
  if (!cols.includes('video_url'))    db.exec(`ALTER TABLE articles ADD COLUMN video_url TEXT NULL`);
  if (!cols.includes('view_count'))   db.exec(`ALTER TABLE articles ADD COLUMN view_count INTEGER DEFAULT 0`);

  // Unique index for deduplication — ignore if already exists
  try { db.exec(`CREATE UNIQUE INDEX idx_articles_content_hash ON articles(content_hash) WHERE content_hash IS NOT NULL`); } catch {}
  try { db.exec(`CREATE INDEX idx_articles_source_url ON articles(source_url) WHERE source_url IS NOT NULL`); } catch {}

  return db;
}

export default getDb;
