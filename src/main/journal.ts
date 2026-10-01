import type { DatabaseSync } from 'node:sqlite'
import type { FillRow } from '../shared/trade'
import { isBuy, opensPosition } from '../shared/trade'
import type { JournalComment, JournalEditable, JournalEntry, JournalFilter, JournalItem, JournalTrade } from '../shared/journal'

type Row = Record<string, unknown>
const json = <T>(v: unknown, dflt: T): T => { try { return v ? (JSON.parse(String(v)) as T) : dflt } catch { return dflt } }
const str = (v: unknown, max: number) => String(v ?? '').slice(0, max)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

function toEntry(r: Row): JournalEntry {
  return {
    id: r.id as number, created_at: r.created_at as number, updated_at: r.updated_at as number,
    kind: r.kind as JournalEntry['kind'], status: r.status as JournalEntry['status'], source: r.source as JournalEntry['source'],
    symbol: (r.symbol as string) ?? null, direction: (r.direction as JournalEntry['direction']) ?? null,
    title: r.title as string, body: r.body as string, setup: r.setup as string, tags: json<string[]>(r.tags, []),
    plan_entry: (r.plan_entry as number) ?? null, plan_stop: (r.plan_stop as number) ?? null, plan_target: (r.plan_target as number) ?? null, plan_qty: (r.plan_qty as number) ?? null,
    emotions: json<string[]>(r.emotions, []), followed_plan: (r.followed_plan as JournalEntry['followed_plan']) ?? null,
    review: r.review as string, lesson: r.lesson as string, order_ids: json<number[]>(r.order_ids, []), comments: json<JournalComment[]>(r.comments, []),
    has_image: !!r.has_image
  }
}

const COLS = "id, created_at, updated_at, kind, status, source, symbol, direction, title, body, setup, tags, plan_entry, plan_stop, plan_target, plan_qty, emotions, followed_plan, review, lesson, order_ids, comments, image IS NOT NULL AS has_image"

export function createJournal(db: DatabaseSync, clock: () => number = () => Math.floor(Date.now() / 1000)) {
  const all = (sql: string, ...a: (string | number | null)[]) => db.prepare(sql).all(...a) as Row[]
  const get1 = (sql: string, ...a: (string | number | null)[]) => db.prepare(sql).get(...a) as Row | undefined

  /**
   * What became of the trade: starts at the first fill of the linked orders, then follows every fill in that
   * symbol until the position is flat again. So exits made by any route (stop, target, manual close) count.
   */
  function tradeInfo(e: JournalEntry): JournalTrade {
    const none: JournalTrade = { state: 'none', qty: null, entryPrice: null, exitPrice: null, realizedPl: null, plannedRisk: null, rMultiple: null, openedAt: null, closedAt: null }
    if (e.order_ids.length === 0) return none
    const marks = e.order_ids.map(() => '?').join(',')
    const first = get1(`SELECT * FROM fills WHERE order_id IN (${marks}) ORDER BY time, id LIMIT 1`, ...e.order_ids) as unknown as FillRow | undefined
    if (!first) {
      const active = get1(`SELECT 1 AS x FROM orders WHERE id IN (${marks}) AND status IN ('working','pending')`, ...e.order_ids)
      return { ...none, state: active ? 'working' : 'cancelled' }
    }
    const fills = all('SELECT * FROM fills WHERE symbol = ? AND (time > ? OR (time = ? AND id >= ?)) ORDER BY time, id', first.symbol, first.time, first.time, first.id) as unknown as FillRow[]
    let pos = 0, realized = 0, openQty = 0, openCost = 0, closeQty = 0, closeCost = 0, closedAt: number | null = null
    for (const f of fills) {
      pos += isBuy(f.side) ? f.qty : -f.qty
      realized += f.realized_pl
      if (opensPosition(f.side)) { openQty += f.qty; openCost += f.qty * f.price } else { closeQty += f.qty; closeCost += f.qty * f.price }
      if (pos === 0) { closedAt = f.time; break }
    }
    const entryPrice = openQty ? openCost / openQty : null
    const ref = e.plan_entry ?? entryPrice
    const plannedRisk = ref != null && e.plan_stop != null ? Math.abs(ref - e.plan_stop) * openQty : null
    const closed = pos === 0
    return {
      state: closed ? 'closed' : 'open', qty: openQty, entryPrice, exitPrice: closeQty ? closeCost / closeQty : null,
      realizedPl: realized, plannedRisk, rMultiple: closed && plannedRisk ? realized / plannedRisk : null, openedAt: first.time, closedAt
    }
  }

  const withTrade = (r: Row): JournalItem => { const e = toEntry(r); return { ...e, trade: tradeInfo(e) } }

  function list(f: JournalFilter = {}): JournalItem[] {
    const where: string[] = [], args: (string | number)[] = []
    if (f.status) { where.push('status = ?'); args.push(f.status) }
    if (f.symbol) { where.push('symbol = ?'); args.push(f.symbol.toUpperCase()) }
    if (f.source) { where.push('source = ?'); args.push(f.source) }
    if (f.q?.trim()) { where.push("(title LIKE ? OR body LIKE ? OR setup LIKE ? OR tags LIKE ? OR symbol LIKE ? OR review LIKE ? OR lesson LIKE ?)"); const q = `%${f.q.trim()}%`; args.push(q, q, q, q, q, q, q) }
    const limit = Math.max(1, Math.min(500, f.limit ?? 200))
    return all(`SELECT ${COLS} FROM journal_entries ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC, id DESC LIMIT ${limit}`, ...args).map(withTrade)
  }
  const get = (id: number): JournalItem | null => { const r = get1(`SELECT ${COLS} FROM journal_entries WHERE id = ?`, id); return r ? withTrade(r) : null }
  const image = (id: number): string | null => (get1('SELECT image FROM journal_entries WHERE id = ?', id)?.image as string | undefined) ?? null

  function cleanTags(v: unknown): string[] {
    return Array.isArray(v) ? [...new Set(v.map((t) => String(t).trim().replace(/^#/, '').slice(0, 30)).filter(Boolean))].slice(0, 12) : []
  }

  function create(input: JournalEditable & { source?: 'user' | 'claude' }): JournalItem {
    const now = clock()
    const symbol = input.symbol ? String(input.symbol).trim().toUpperCase() : null
    const title = str(input.title, 160).trim() || (symbol ? `${symbol} ${input.kind === 'note' ? 'note' : 'trade idea'}` : 'Untitled entry')
    const r = db.prepare(
      `INSERT INTO journal_entries (created_at, updated_at, kind, status, source, symbol, direction, title, body, setup, tags, plan_entry, plan_stop, plan_target, plan_qty, emotions, followed_plan, review, lesson, order_ids, image)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      now, now, input.kind === 'note' ? 'note' : 'trade', input.status ?? 'idea', input.source === 'claude' ? 'claude' : 'user', symbol,
      input.direction === 'long' || input.direction === 'short' ? input.direction : null, title, str(input.body, 20000), str(input.setup, 80),
      JSON.stringify(cleanTags(input.tags)), num(input.plan_entry), num(input.plan_stop), num(input.plan_target), num(input.plan_qty),
      JSON.stringify(cleanTags(input.emotions)), input.followed_plan ?? null, str(input.review, 20000), str(input.lesson, 5000),
      JSON.stringify(Array.isArray(input.order_ids) ? input.order_ids.filter((n) => Number.isInteger(n)) : []), input.image ?? null
    )
    return get(Number(r.lastInsertRowid))!
  }

  function update(id: number, p: JournalEditable): JournalItem | null {
    if (!get1('SELECT 1 AS x FROM journal_entries WHERE id = ?', id)) return null
    const set: string[] = ['updated_at = ?'], args: (string | number | null)[] = [clock()]
    const put = (col: string, v: string | number | null) => { set.push(`${col} = ?`); args.push(v) }
    if (p.kind !== undefined) put('kind', p.kind === 'note' ? 'note' : 'trade')
    if (p.status !== undefined && ['idea', 'taken', 'skipped'].includes(p.status)) put('status', p.status)
    if (p.symbol !== undefined) put('symbol', p.symbol ? String(p.symbol).trim().toUpperCase() : null)
    if (p.direction !== undefined) put('direction', p.direction === 'long' || p.direction === 'short' ? p.direction : null)
    if (p.title !== undefined) put('title', str(p.title, 160).trim() || 'Untitled entry')
    if (p.body !== undefined) put('body', str(p.body, 20000))
    if (p.setup !== undefined) put('setup', str(p.setup, 80))
    if (p.tags !== undefined) put('tags', JSON.stringify(cleanTags(p.tags)))
    for (const k of ['plan_entry', 'plan_stop', 'plan_target', 'plan_qty'] as const) if (p[k] !== undefined) put(k, num(p[k]))
    if (p.emotions !== undefined) put('emotions', JSON.stringify(cleanTags(p.emotions)))
    if (p.followed_plan !== undefined) put('followed_plan', ['yes', 'partly', 'no'].includes(p.followed_plan as string) ? (p.followed_plan as string) : null)
    if (p.review !== undefined) put('review', str(p.review, 20000))
    if (p.lesson !== undefined) put('lesson', str(p.lesson, 5000))
    if (p.order_ids !== undefined) put('order_ids', JSON.stringify(p.order_ids.filter((n) => Number.isInteger(n))))
    if (p.image !== undefined) put('image', p.image)
    db.prepare(`UPDATE journal_entries SET ${set.join(', ')} WHERE id = ?`).run(...args, id)
    return get(id)
  }

  function comment(id: number, c: { by: 'user' | 'claude'; text: string }): JournalItem | null {
    const r = get1('SELECT comments FROM journal_entries WHERE id = ?', id)
    if (!r) return null
    const list = json<JournalComment[]>(r.comments, [])
    list.push({ by: c.by, at: clock(), text: str(c.text, 8000) })
    db.prepare('UPDATE journal_entries SET comments = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(list), clock(), id)
    return get(id)
  }

  const remove = (id: number) => { db.prepare('DELETE FROM journal_entries WHERE id = ?').run(id) }
  return { list, get, image, create, update, comment, remove }
}
export type Journal = ReturnType<typeof createJournal>
