import type { DatabaseSync } from 'node:sqlite'
import { SYMBOL_RE, type WatchList, type WlResult } from '../shared/watchlists'

const DEFAULTS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'SPY']

export function createWatchlists(db: DatabaseSync, clock: () => number = () => Math.floor(Date.now() / 1000)) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS watchlist_items (
      list_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      PRIMARY KEY (list_id, symbol)
    );
  `)
  // First run with lists: carry over the single legacy watchlist (or start with a few popular symbols).
  if ((db.prepare('SELECT COUNT(*) AS n FROM watchlists').get() as { n: number }).n === 0) {
    const id = Number(db.prepare('INSERT INTO watchlists (name, created_at) VALUES (?, ?)').run('Watchlist', clock()).lastInsertRowid)
    const legacy = (() => { try { return (db.prepare('SELECT symbol FROM watchlist ORDER BY added_at, rowid').all() as { symbol: string }[]).map((r) => r.symbol) } catch { return [] } })()
    for (const s of legacy.length ? legacy : DEFAULTS) db.prepare('INSERT OR IGNORE INTO watchlist_items (list_id, symbol, added_at) VALUES (?,?,?)').run(id, s, clock())
  }
  // the old single list has been carried over (or there was none); nothing reads it again
  db.exec('DROP TABLE IF EXISTS watchlist')

  const exists = (id: number) => !!db.prepare('SELECT 1 AS x FROM watchlists WHERE id = ?').get(id)
  const cleanName = (n: unknown) => String(n ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
  const nameTaken = (name: string, exceptId?: number) => !!db.prepare('SELECT 1 AS x FROM watchlists WHERE name = ? AND id != ?').get(name, exceptId ?? -1)

  function lists(): WatchList[] {
    const items = db.prepare('SELECT list_id, symbol FROM watchlist_items ORDER BY added_at, rowid').all() as { list_id: number; symbol: string }[]
    return (db.prepare('SELECT id, name FROM watchlists ORDER BY id').all() as { id: number; name: string }[]).map((l) => ({
      id: l.id, name: l.name, symbols: items.filter((i) => i.list_id === l.id).map((i) => i.symbol)
    }))
  }

  function create(nameIn: string): WlResult<{ id: number }> {
    const name = cleanName(nameIn)
    if (!name) return { ok: false, error: 'Give the list a name.' }
    if (nameTaken(name)) return { ok: false, error: `You already have a list called “${name}”.` }
    return { ok: true, id: Number(db.prepare('INSERT INTO watchlists (name, created_at) VALUES (?, ?)').run(name, clock()).lastInsertRowid) }
  }

  function rename(id: number, nameIn: string): WlResult {
    const name = cleanName(nameIn)
    if (!exists(id)) return { ok: false, error: 'That list no longer exists.' }
    if (!name) return { ok: false, error: 'Give the list a name.' }
    if (nameTaken(name, id)) return { ok: false, error: `You already have a list called “${name}”.` }
    db.prepare('UPDATE watchlists SET name = ? WHERE id = ?').run(name, id)
    return { ok: true }
  }

  function remove(id: number): WlResult {
    if (!exists(id)) return { ok: false, error: 'That list no longer exists.' }
    if ((db.prepare('SELECT COUNT(*) AS n FROM watchlists').get() as { n: number }).n <= 1) return { ok: false, error: 'You need at least one watchlist.' }
    db.prepare('DELETE FROM watchlist_items WHERE list_id = ?').run(id) // explicit, in case foreign keys are off
    db.prepare('DELETE FROM watchlists WHERE id = ?').run(id)
    return { ok: true }
  }

  function add(id: number, symbolIn: string): WlResult<{ symbol: string; added: boolean }> {
    const symbol = String(symbolIn ?? '').trim().toUpperCase()
    if (!exists(id)) return { ok: false, error: 'That list no longer exists.' }
    if (!SYMBOL_RE.test(symbol)) return { ok: false, error: `“${symbolIn}” is not a valid symbol.` }
    const r = db.prepare('INSERT OR IGNORE INTO watchlist_items (list_id, symbol, added_at) VALUES (?,?,?)').run(id, symbol, clock())
    return { ok: true, symbol, added: Number(r.changes) > 0 }
  }

  function removeSymbol(id: number, symbol: string): WlResult {
    db.prepare('DELETE FROM watchlist_items WHERE list_id = ? AND symbol = ?').run(id, String(symbol).trim().toUpperCase())
    return { ok: true }
  }

  return { lists, create, rename, remove, add, removeSymbol }
}
export type Watchlists = ReturnType<typeof createWatchlists>
