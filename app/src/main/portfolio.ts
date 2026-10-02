import type { DatabaseSync } from 'node:sqlite'
import { SYMBOL_RE, guessKind, type Kind, type Mode, type Pf, type PfItem, type PfResult } from '../shared/portfolio'

const KINDS: Kind[] = ['stock', 'etf', 'fund']
const num = (v: unknown): number | null => (v === '' || v === null || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null)

/** Portfolios: planned allocations and what the user holds. Pure bookkeeping, nothing here sends an order. */
export function createPortfolio(db: DatabaseSync, clock: () => number = () => Math.floor(Date.now() / 1000)) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      amount REAL NOT NULL DEFAULT 10000,
      mode TEXT NOT NULL DEFAULT 'new',
      fractional INTEGER NOT NULL DEFAULT 0,
      leftover INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'stock',
      target_pct REAL NOT NULL DEFAULT 0,
      shares REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      manual_price REAL,
      added_at INTEGER NOT NULL,
      UNIQUE (portfolio_id, symbol)
    );
  `)

  // the link to a paper account was added later: an idempotent ALTER keeps databases that already have the table working
  if (!(db.prepare('PRAGMA table_info(portfolios)').all() as { name: string }[]).some((c) => c.name === 'account_id')) db.exec('ALTER TABLE portfolios ADD COLUMN account_id INTEGER')
  const accountExists = (id: number) => { try { return !!db.prepare('SELECT 1 AS x FROM accounts WHERE id = ?').get(id) } catch { return false } }

  const cleanName = (n: unknown) => String(n ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
  const has = (id: number) => !!db.prepare('SELECT 1 AS x FROM portfolios WHERE id = ?').get(id)
  const taken = (name: string, except = -1) => !!db.prepare('SELECT 1 AS x FROM portfolios WHERE name = ? AND id != ?').get(name, except)
  const itemRow = (id: number) => db.prepare('SELECT id, portfolio_id FROM portfolio_items WHERE id = ?').get(id) as { id: number; portfolio_id: number } | undefined

  function list(): Pf[] {
    // an account that was deleted leaves its portfolios unlinked, with the numbers they had typed
    try { db.exec('UPDATE portfolios SET account_id = NULL WHERE account_id IS NOT NULL AND account_id NOT IN (SELECT id FROM accounts)') } catch { /* no accounts table in a bare test database */ }
    const items = db.prepare('SELECT * FROM portfolio_items ORDER BY added_at, id').all() as Record<string, unknown>[]
    return (db.prepare('SELECT * FROM portfolios ORDER BY id').all() as Record<string, unknown>[]).map((p) => ({
      id: Number(p.id), name: String(p.name), amount: Number(p.amount), mode: (p.mode === 'total' ? 'total' : 'new') as Mode, fractional: !!p.fractional, leftover: !!p.leftover, accountId: p.account_id == null ? null : Number(p.account_id),
      items: items.filter((i) => Number(i.portfolio_id) === Number(p.id)).map((i): PfItem => ({
        id: Number(i.id), symbol: String(i.symbol), name: String(i.name), kind: (KINDS.includes(i.kind as Kind) ? i.kind : 'stock') as Kind,
        targetPct: Number(i.target_pct), shares: Number(i.shares), cost: Number(i.cost), manualPrice: i.manual_price == null ? null : Number(i.manual_price)
      }))
    }))
  }

  function create(nameIn: string, amountIn?: number): PfResult<{ id: number }> {
    const name = cleanName(nameIn)
    if (!name) return { ok: false, error: 'Give the portfolio a name.' }
    if (taken(name)) return { ok: false, error: `You already have a portfolio called “${name}”.` }
    const amount = num(amountIn)
    if (amount != null && amount < 0) return { ok: false, error: 'The investment amount cannot be negative.' }
    return { ok: true, id: Number(db.prepare('INSERT INTO portfolios (name, amount, created_at) VALUES (?, ?, ?)').run(name, amount ?? 10000, clock()).lastInsertRowid) }
  }

  function update(id: number, patch: { name?: string; amount?: number; mode?: Mode; fractional?: boolean; leftover?: boolean; accountId?: number | null }): PfResult {
    if (!has(id)) return { ok: false, error: 'That portfolio no longer exists.' }
    if (patch.name !== undefined) {
      const name = cleanName(patch.name)
      if (!name) return { ok: false, error: 'Give the portfolio a name.' }
      if (taken(name, id)) return { ok: false, error: `You already have a portfolio called “${name}”.` }
      db.prepare('UPDATE portfolios SET name = ? WHERE id = ?').run(name, id)
    }
    if (patch.amount !== undefined) {
      const a = num(patch.amount)
      if (a == null || a < 0 || a > 1e12) return { ok: false, error: 'Enter an investment amount of zero or more.' }
      db.prepare('UPDATE portfolios SET amount = ? WHERE id = ?').run(a, id)
    }
    if (patch.mode !== undefined) db.prepare('UPDATE portfolios SET mode = ? WHERE id = ?').run(patch.mode === 'total' ? 'total' : 'new', id)
    if (patch.fractional !== undefined) db.prepare('UPDATE portfolios SET fractional = ? WHERE id = ?').run(patch.fractional ? 1 : 0, id)
    if (patch.leftover !== undefined) db.prepare('UPDATE portfolios SET leftover = ? WHERE id = ?').run(patch.leftover ? 1 : 0, id)
    if (patch.accountId !== undefined) {
      if (patch.accountId !== null && !accountExists(Number(patch.accountId))) return { ok: false, error: 'That paper account no longer exists.' }
      db.prepare('UPDATE portfolios SET account_id = ? WHERE id = ?').run(patch.accountId === null ? null : Number(patch.accountId), id)
    }
    return { ok: true }
  }

  function remove(id: number): PfResult {
    if (!has(id)) return { ok: false, error: 'That portfolio no longer exists.' }
    db.prepare('DELETE FROM portfolio_items WHERE portfolio_id = ?').run(id) // explicit, in case foreign keys are off
    db.prepare('DELETE FROM portfolios WHERE id = ?').run(id)
    return { ok: true }
  }

  function addItem(pid: number, input: { symbol: string; name?: string; kind?: Kind }): PfResult<{ id: number; symbol: string }> {
    const symbol = String(input.symbol ?? '').trim().toUpperCase()
    if (!has(pid)) return { ok: false, error: 'That portfolio no longer exists.' }
    if (!SYMBOL_RE.test(symbol)) return { ok: false, error: `“${input.symbol}” is not a valid symbol.` }
    if (db.prepare('SELECT 1 AS x FROM portfolio_items WHERE portfolio_id = ? AND symbol = ?').get(pid, symbol)) return { ok: false, error: `${symbol} is already in this portfolio.` }
    const kind = KINDS.includes(input.kind as Kind) ? (input.kind as Kind) : guessKind(symbol)
    const id = Number(db.prepare('INSERT INTO portfolio_items (portfolio_id, symbol, name, kind, added_at) VALUES (?,?,?,?,?)').run(pid, symbol, String(input.name ?? '').slice(0, 120), kind, clock()).lastInsertRowid)
    return { ok: true, id, symbol }
  }

  function updateItem(id: number, patch: { targetPct?: number; shares?: number; cost?: number; manualPrice?: number | null; kind?: Kind; name?: string }): PfResult {
    if (!itemRow(id)) return { ok: false, error: 'That holding no longer exists.' }
    if (patch.targetPct !== undefined) {
      const v = num(patch.targetPct)
      if (v == null || v < 0 || v > 100) return { ok: false, error: 'A target percentage must be between 0 and 100.' }
      db.prepare('UPDATE portfolio_items SET target_pct = ? WHERE id = ?').run(Math.round(v * 100) / 100, id)
    }
    if (patch.shares !== undefined) {
      const v = num(patch.shares)
      if (v == null || v < 0 || v > 1e12) return { ok: false, error: 'Shares must be zero or more.' }
      db.prepare('UPDATE portfolio_items SET shares = ? WHERE id = ?').run(Math.round(v * 1e6) / 1e6, id)
    }
    if (patch.cost !== undefined) {
      const v = num(patch.cost)
      if (v == null || v < 0 || v > 1e13) return { ok: false, error: 'Cost must be zero or more.' }
      db.prepare('UPDATE portfolio_items SET cost = ? WHERE id = ?').run(Math.round(v * 100) / 100, id)
    }
    if (patch.manualPrice !== undefined) {
      const v = patch.manualPrice === null ? null : num(patch.manualPrice)
      if (v != null && (v <= 0 || v > 1e9)) return { ok: false, error: 'A price must be more than zero.' }
      db.prepare('UPDATE portfolio_items SET manual_price = ? WHERE id = ?').run(v, id)
    }
    if (patch.kind !== undefined && KINDS.includes(patch.kind)) db.prepare('UPDATE portfolio_items SET kind = ? WHERE id = ?').run(patch.kind, id)
    if (patch.name !== undefined) db.prepare('UPDATE portfolio_items SET name = ? WHERE id = ?').run(String(patch.name).slice(0, 120), id)
    return { ok: true }
  }

  function removeItem(id: number): PfResult {
    if (!itemRow(id)) return { ok: true }
    db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(id)
    return { ok: true }
  }

  /** Sets several target percentages at once ("equal weight", "make it add up to 100"). All or nothing. */
  function setTargets(pid: number, targets: { id: number; pct: number }[]): PfResult {
    if (!has(pid)) return { ok: false, error: 'That portfolio no longer exists.' }
    for (const t of targets) if (!(Number.isFinite(t.pct) && t.pct >= 0 && t.pct <= 100)) return { ok: false, error: 'A target percentage must be between 0 and 100.' }
    for (const t of targets) db.prepare('UPDATE portfolio_items SET target_pct = ? WHERE id = ? AND portfolio_id = ?').run(Math.round(t.pct * 100) / 100, t.id, pid)
    return { ok: true }
  }

  /** "I bought these": adds the shares and what they cost to what the user holds. Records only; it places no order. */
  function recordBuys(pid: number, buys: { id: number; shares: number; price: number }[]): PfResult<{ recorded: number }> {
    if (!has(pid)) return { ok: false, error: 'That portfolio no longer exists.' }
    const todo = buys.filter((b) => b.shares > 0)
    for (const b of todo) {
      if (!(Number.isFinite(b.shares) && Number.isFinite(b.price) && b.price > 0)) return { ok: false, error: 'Every purchase needs a share count and a price.' }
      const row = db.prepare('SELECT portfolio_id FROM portfolio_items WHERE id = ?').get(b.id) as { portfolio_id: number } | undefined
      if (!row || row.portfolio_id !== pid) return { ok: false, error: 'One of those holdings no longer exists.' }
    }
    const up = db.prepare('UPDATE portfolio_items SET shares = ROUND(shares + ?, 6), cost = ROUND(cost + ?, 2) WHERE id = ?')
    for (const b of todo) up.run(b.shares, b.shares * b.price, b.id)
    return { ok: true, recorded: todo.length }
  }

  const get = (id: number) => list().find((p) => p.id === id) ?? null

  /** "I sold these": takes the shares out of the holdings and lowers the recorded cost in proportion. Records only; it places no order. */
  function recordSells(pid: number, sells: { id: number; shares: number }[]): PfResult<{ recorded: number }> {
    if (!has(pid)) return { ok: false, error: 'That portfolio no longer exists.' }
    const todo = sells.filter((s) => s.shares > 0)
    const rows = new Map<number, { shares: number; cost: number }>()
    for (const s of todo) {
      if (!Number.isFinite(s.shares)) return { ok: false, error: 'Every sale needs a share count.' }
      const row = db.prepare('SELECT portfolio_id, shares, cost FROM portfolio_items WHERE id = ?').get(s.id) as { portfolio_id: number; shares: number; cost: number } | undefined
      if (!row || row.portfolio_id !== pid) return { ok: false, error: 'One of those holdings no longer exists.' }
      if (s.shares > row.shares + 1e-9) return { ok: false, error: 'You cannot sell more shares than you hold.' }
      rows.set(s.id, { shares: row.shares, cost: row.cost })
    }
    const up = db.prepare('UPDATE portfolio_items SET shares = ?, cost = ? WHERE id = ?')
    for (const s of todo) {
      const r = rows.get(s.id)!
      const left = Math.max(0, Math.round((r.shares - s.shares) * 1e6) / 1e6)
      up.run(left, left === 0 || r.shares === 0 ? 0 : Math.round(r.cost * (left / r.shares) * 100) / 100, s.id)
    }
    return { ok: true, recorded: todo.length }
  }

  return { list, get, create, recordSells, update, remove, addItem, updateItem, removeItem, setTargets, recordBuys }
}
export type PortfolioStore = ReturnType<typeof createPortfolio>
