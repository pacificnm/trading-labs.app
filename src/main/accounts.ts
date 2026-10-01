import type { DatabaseSync } from 'node:sqlite'
import { checkAccountInput, type AccountInfo, type AccountInput, type AccountType, type Transfer } from '../shared/accounts'

interface Row { id: number; name: string; type: AccountType; broker: string; url: string; cash: number; starting_cash: number; created_at: number }
const info = (r: Row): AccountInfo => ({ id: r.id, name: r.name, type: r.type === 'cash' ? 'cash' : 'margin', broker: r.broker, url: r.url, cash: r.cash, startingCash: r.starting_cash, createdAt: r.created_at })

/** CRUD for paper accounts and the "active" one. Trading data (orders, fills, positions) is scoped to an account id in the engine. */
export function createAccounts(db: DatabaseSync, clock: () => number = () => Math.floor(Date.now() / 1000)) {
  const rows = () => db.prepare('SELECT * FROM accounts ORDER BY id').all() as unknown as Row[]
  const row = (id: number) => db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as unknown as Row | undefined
  const list = (): AccountInfo[] => rows().map(info)
  const must = (id: number): Row => row(id) ?? (() => { throw new Error('Account not found.') })()
  const money = (n: unknown, what: string): number => { if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1e12) throw new Error(`${what} must be a number of 0 or more.`); return Math.round(n * 100) / 100 }
  const clean = (i: Partial<AccountInput>) => { const e = checkAccountInput(i); if (e) throw new Error(e); return { name: i.name?.trim(), broker: i.broker?.trim(), url: i.url?.trim(), type: i.type } }

  function activeId(): number {
    const v = db.prepare("SELECT value FROM settings WHERE key = 'activeAccount'").get() as { value: string } | undefined
    const id = v ? Number(JSON.parse(v.value)) : NaN
    return row(id) ? id : rows()[0].id
  }
  function setActive(id: number): void {
    must(id)
    db.prepare("INSERT INTO settings (key, value) VALUES ('activeAccount', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(id))
  }

  function create(input: AccountInput, balance: number): AccountInfo {
    const c = clean(input)
    if (!c.name) throw new Error('Give the account a name.')
    const cash = money(balance, 'The starting balance')
    const r = db.prepare('INSERT INTO accounts (name, type, broker, url, cash, starting_cash, created_at) VALUES (?,?,?,?,?,?,?)').run(c.name, c.type ?? 'margin', c.broker ?? '', c.url ?? '', cash, cash, clock())
    return info(must(Number(r.lastInsertRowid)))
  }

  function update(id: number, patch: Partial<AccountInput>): AccountInfo {
    must(id)
    const c = clean(patch)
    if (c.name !== undefined) db.prepare('UPDATE accounts SET name = ? WHERE id = ?').run(c.name, id)
    if (c.type !== undefined) db.prepare('UPDATE accounts SET type = ? WHERE id = ?').run(c.type, id)
    if (c.broker !== undefined) db.prepare('UPDATE accounts SET broker = ? WHERE id = ?').run(c.broker, id)
    if (c.url !== undefined) db.prepare('UPDATE accounts SET url = ? WHERE id = ?').run(c.url, id)
    return info(must(id))
  }

  /**
   * Sets the cash balance to match the real account. The difference is booked as a deposit or withdrawal (the starting
   * balance moves with it) so total return still measures trading results, not money added or taken out.
   */
  function setBalance(id: number, cash: number, note = ''): AccountInfo {
    const cur = must(id)
    const target = money(cash, 'The balance')
    const delta = Math.round((target - cur.cash) * 100) / 100
    if (delta !== 0) {
      db.exec('BEGIN')
      try {
        db.prepare('UPDATE accounts SET cash = ?, starting_cash = starting_cash + ? WHERE id = ?').run(target, delta, id)
        db.prepare('INSERT INTO account_transfers (account_id, time, amount, note) VALUES (?,?,?,?)').run(id, clock(), delta, note.slice(0, 120))
        db.exec('COMMIT')
      } catch (e) { db.exec('ROLLBACK'); throw e }
    }
    return info(must(id))
  }

  function remove(id: number): void {
    must(id)
    if (rows().length <= 1) throw new Error('You need at least one account.')
    db.exec('BEGIN')
    try {
      for (const t of ['orders', 'fills', 'positions', 'account_transfers']) db.prepare(`DELETE FROM ${t} WHERE account_id = ?`).run(id)
      db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
      db.exec('COMMIT')
    } catch (e) { db.exec('ROLLBACK'); throw e }
  }

  const transfers = (id: number, limit = 8): Transfer[] => db.prepare('SELECT id, time, amount, note FROM account_transfers WHERE account_id = ? ORDER BY id DESC LIMIT ?').all(id, limit) as unknown as Transfer[]

  return { list, get: (id: number) => info(must(id)), activeId, setActive, create, update, setBalance, remove, transfers }
}
export type Accounts = ReturnType<typeof createAccounts>
