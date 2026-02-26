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
      tweet_ar      TEXT,
      tweet_en      TEXT,
      speaker_name  TEXT,
      speaker_title TEXT,
      published_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_articles_category    ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_slug        ON articles(slug);
  `);

  return db;
}

export default getDb;
