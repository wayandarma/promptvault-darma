import 'dotenv/config';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || './db/prompts.db';
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS prompts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    act         TEXT NOT NULL UNIQUE,
    prompt      TEXT NOT NULL,
    category    TEXT DEFAULT 'Uncategorized',
    tags        TEXT DEFAULT '',
    source      TEXT DEFAULT 'prompts.chat',
    is_favorite INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
    act, prompt,
    content='prompts',
    content_rowid='id'
  );

  CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
    INSERT INTO prompts_fts(rowid, act, prompt)
      VALUES (new.id, new.act, new.prompt);
  END;

  CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
    INSERT INTO prompts_fts(prompts_fts, rowid, act, prompt)
      VALUES ('delete', old.id, old.act, old.prompt);
    INSERT INTO prompts_fts(rowid, act, prompt)
      VALUES (new.id, new.act, new.prompt);
  END;
`);

export default db;
