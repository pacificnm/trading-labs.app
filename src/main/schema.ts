import type { DatabaseSync } from 'node:sqlite'

export function initTradingSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      parent_id INTEGER,
      role TEXT NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      qty INTEGER NOT NULL,
      type TEXT NOT NULL,
      limit_price REAL,
      stop_price REAL,
      trail_amount REAL,
      trail_unit TEXT,
      extreme REAL,
      triggered INTEGER NOT NULL DEFAULT 0,
      tif TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL,
      start_at INTEGER NOT NULL,
      expires_at INTEGER,
      checked_to INTEGER NOT NULL DEFAULT 0,
      filled_at INTEGER,
      fill_price REAL,
      source TEXT NOT NULL DEFAULT 'user',
      note TEXT
    );
    CREATE INDEX IF NOT EXISTS orders_status ON orders(status);
    CREATE TABLE IF NOT EXISTS fills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      time INTEGER NOT NULL,
      realized_pl REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS positions (
      symbol TEXT PRIMARY KEY,
      qty INTEGER NOT NULL,
      avg_price REAL NOT NULL
    );
  `)
}

export function initJournalSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      kind TEXT NOT NULL DEFAULT 'trade',
      status TEXT NOT NULL DEFAULT 'idea',
      source TEXT NOT NULL DEFAULT 'user',
      symbol TEXT,
      direction TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      setup TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      plan_entry REAL, plan_stop REAL, plan_target REAL, plan_qty INTEGER,
      emotions TEXT NOT NULL DEFAULT '[]',
      followed_plan TEXT,
      review TEXT NOT NULL DEFAULT '',
      lesson TEXT NOT NULL DEFAULT '',
      order_ids TEXT NOT NULL DEFAULT '[]',
      comments TEXT NOT NULL DEFAULT '[]',
      image TEXT
    );
    CREATE INDEX IF NOT EXISTS journal_symbol ON journal_entries(symbol);
  `)
}

export function initStrategySchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS strategy_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'My strategies',
      level TEXT NOT NULL DEFAULT 'beginner',
      minutes INTEGER NOT NULL DEFAULT 10,
      summary TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      body TEXT NOT NULL DEFAULT '',
      quiz TEXT NOT NULL DEFAULT '[]',
      chart_setup TEXT,
      source TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS strategy_progress (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'new',
      note TEXT NOT NULL DEFAULT '',
      quiz_score INTEGER,
      updated_at INTEGER NOT NULL
    );
  `)
}
