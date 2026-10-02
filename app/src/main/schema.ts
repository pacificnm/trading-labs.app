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
      account_id INTEGER NOT NULL DEFAULT 1,
      symbol TEXT NOT NULL,
      qty INTEGER NOT NULL,
      avg_price REAL NOT NULL,
      PRIMARY KEY (account_id, symbol)
    );
  `)
}

const hasColumn = (db: DatabaseSync, table: string, col: string) => (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === col)

/**
 * Several paper accounts. Runs after initTradingSchema and is safe to repeat: it creates the accounts table, moves the old
 * single `account` row in as account 1, and adds account_id to orders, fills and positions (existing rows belong to account 1).
 */
export function initAccountSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'margin',
      broker TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      cash REAL NOT NULL,
      starting_cash REAL NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS account_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      time INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );
  `)
  // The single-row `account` table of older versions becomes account 1. Copy and drop happen together, so a failure leaves the old table intact.
  const hasLegacy = !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'account'").get()
  db.exec('BEGIN')
  try {
    if ((db.prepare('SELECT COUNT(*) AS n FROM accounts').get() as { n: number }).n === 0) {
      const legacy = hasLegacy ? (db.prepare('SELECT cash, starting_cash FROM account WHERE id = 1').get() as { cash: number; starting_cash: number } | undefined) : undefined
      db.prepare("INSERT INTO accounts (id, name, cash, starting_cash, created_at) VALUES (1, 'Paper account', ?, ?, ?)").run(legacy?.cash ?? 100000, legacy?.starting_cash ?? 100000, Math.floor(Date.now() / 1000))
    }
    if (hasLegacy) db.exec('DROP TABLE account')
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
  if (!hasColumn(db, 'accounts', 'type')) db.exec("ALTER TABLE accounts ADD COLUMN type TEXT NOT NULL DEFAULT 'margin'")
  if (!hasColumn(db, 'orders', 'account_id')) db.exec('ALTER TABLE orders ADD COLUMN account_id INTEGER NOT NULL DEFAULT 1')
  if (!hasColumn(db, 'fills', 'account_id')) db.exec('ALTER TABLE fills ADD COLUMN account_id INTEGER NOT NULL DEFAULT 1')
  if (!hasColumn(db, 'positions', 'account_id')) {
    db.exec(`
      ALTER TABLE positions RENAME TO positions_old;
      CREATE TABLE positions (
        account_id INTEGER NOT NULL DEFAULT 1,
        symbol TEXT NOT NULL,
        qty INTEGER NOT NULL,
        avg_price REAL NOT NULL,
        PRIMARY KEY (account_id, symbol)
      );
      INSERT INTO positions (account_id, symbol, qty, avg_price) SELECT 1, symbol, qty, avg_price FROM positions_old;
      DROP TABLE positions_old;
    `)
  }
  db.exec('CREATE INDEX IF NOT EXISTS orders_account ON orders(account_id); CREATE INDEX IF NOT EXISTS fills_account ON fills(account_id);')
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

/**
 * Drops tables that earlier versions created and nothing uses any more. `account` is retired inside initAccountSchema and
 * `watchlist` by createWatchlists (each right after its data has been moved). The old `trades` log was never read, so it is
 * only dropped when it is empty; one with rows in it is left alone rather than deleting a user's data.
 */
export function retireLegacyTables(db: DatabaseSync): void {
  const exists = !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'trades'").get()
  if (exists && (db.prepare('SELECT COUNT(*) AS n FROM trades').get() as { n: number }).n === 0) db.exec('DROP TABLE trades')
}

