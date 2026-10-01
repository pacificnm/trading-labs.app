import type { DatabaseSync } from 'node:sqlite'
import type { Bar } from '../shared/fmp'
import { isMarketOpen, sessionCloseAfter } from '../shared/nytime'
import { buyingPowerFor, type AccountType } from '../shared/accounts'
import { nextBar, type FillGrain } from '../shared/fmpCaps'
import {
  analyze, exitSide, isBuy, opensPosition, SIDE_LABEL,
  type AccountView, type FillRow, type OrderRow, type OrderSpec, type PositionView, type TradeResult, type TradeSnapshot
} from '../shared/trade'

export interface Market {
  quote(symbol: string): Promise<number | null>
  /** bars of the current grain from `fromEpoch` until now, ascending */
  bars(symbol: string, fromEpoch: number): Promise<Bar[]>
  /** the bar size the plan can supply for filling orders (null = no intraday bars at all). Defaults to 1-minute. */
  grain?(): FillGrain | null
}

const ONE_MINUTE: FillGrain = { interval: '1min', seconds: 60, offset: 0, label: '1-minute' }
export interface EngineEvent { text: string }

const ACTIVE = "('pending','working')"

/**
 * Paper-trading engine. Orders fill against real intraday bars (1-minute when the plan has them, otherwise the finest it does): a stop or limit is filled if the bar's
 * range touched it (at the trigger price, or at the open if the bar gapped through). When a stop and a
 * target are both touched in the same bar, the stop is assumed to have been hit first.
 * Not modelled: partial fills, commissions/slippage, extended hours, market holidays.
 */
export function createEngine(db: DatabaseSync, market: Market, clock: () => number = () => Math.floor(Date.now() / 1000), activeAccount: () => number = () => 1) {
  const one = <T>(sql: string, ...a: (string | number | null)[]) => db.prepare(sql).get(...a) as T | undefined
  const all = <T>(sql: string, ...a: (string | number | null)[]) => db.prepare(sql).all(...a) as T[]
  const run = (sql: string, ...a: (string | number | null)[]) => db.prepare(sql).run(...a)
  const tx = <T>(fn: () => T): T => {
    db.exec('BEGIN')
    try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { db.exec('ROLLBACK'); throw e }
  }
  const grain = (): FillGrain | null => (market.grain ? market.grain() : ONE_MINUTE)
  const nextBarTime = (t: number) => nextBar(t, grain() ?? ONE_MINUTE)

  // ---------------------------------------------------------------- account
  // Every trading row belongs to an account. New orders go to the active account; working orders in all accounts keep filling.
  const account = (id: number) => one<{ id: number; name: string; type: AccountType; broker: string; url: string; cash: number; starting_cash: number }>('SELECT id, name, type, broker, url, cash, starting_cash FROM accounts WHERE id = ?', id)!
  const positionQty = (accountId: number, symbol: string) => one<{ qty: number }>('SELECT qty FROM positions WHERE account_id = ? AND symbol = ?', accountId, symbol)?.qty ?? 0

  async function values(accountId: number = activeAccount()): Promise<{ cash: number; startingCash: number; equity: number; buyingPower: number; positions: PositionView[]; realized: number; unrealized: number }> {
    const acc = account(accountId)
    const rows = all<{ symbol: string; qty: number; avg_price: number }>('SELECT symbol, qty, avg_price FROM positions WHERE account_id = ? ORDER BY symbol', accountId)
    const marks = await Promise.all(rows.map((r) => market.quote(r.symbol).catch(() => null)))
    let mv = 0, gross = 0, unreal = 0
    const positions: PositionView[] = rows.map((r, i) => {
      const mark = marks[i]
      const m = mark ?? r.avg_price
      mv += r.qty * m
      gross += Math.abs(r.qty * m)
      const u = mark == null ? null : (mark - r.avg_price) * r.qty
      if (u != null) unreal += u
      return { symbol: r.symbol, qty: r.qty, avg: r.avg_price, mark, marketValue: mark == null ? null : r.qty * mark, unrealized: u, unrealizedPct: u == null ? null : (u / Math.abs(r.avg_price * r.qty)) * 100 }
    })
    const equity = acc.cash + mv
    const realized = one<{ s: number | null }>('SELECT SUM(realized_pl) AS s FROM fills WHERE account_id = ?', accountId)?.s ?? 0
    return { cash: acc.cash, startingCash: acc.starting_cash, equity, buyingPower: buyingPowerFor(acc.type, equity, acc.cash, gross), positions, realized, unrealized: unreal }
  }

  const reserved = (accountId: number) =>
    all<OrderRow>(`SELECT * FROM orders WHERE status = 'working' AND account_id = ?`, accountId)
      .filter((o) => opensPosition(o.side))
      .reduce((s, o) => s + o.qty * (o.limit_price ?? o.stop_price ?? 0), 0)

  async function snapshot(): Promise<TradeSnapshot> {
    const id = activeAccount()
    const v = await values(id)
    const acc = account(id)
    const held = reserved(id)
    const orders = all<OrderRow>(`SELECT * FROM orders WHERE status IN ${ACTIVE} AND account_id = ? ORDER BY id DESC`, id)
    const recent = all<OrderRow>(`SELECT * FROM orders WHERE status NOT IN ${ACTIVE} AND account_id = ? ORDER BY id DESC LIMIT 80`, id)
    const fills = all<FillRow>('SELECT * FROM fills WHERE account_id = ? ORDER BY id DESC LIMIT 80', id)
    const account_: AccountView = {
      id, name: acc.name, broker: acc.broker, url: acc.url, type: acc.type === 'cash' ? 'cash' : 'margin',
      cash: v.cash, startingCash: v.startingCash, equity: v.equity, buyingPower: Math.max(0, v.buyingPower - held), reserved: held,
      realizedPl: v.realized, unrealizedPl: v.unrealized, totalReturnPct: v.startingCash ? ((v.equity - v.startingCash) / v.startingCash) * 100 : 0
    }
    const g = grain()
    return { account: account_, positions: v.positions, orders: [...orders, ...recent], fills, at: clock(), fillBars: g ? { label: g.label, seconds: g.seconds } : null }
  }

  // ---------------------------------------------------------------- placing
  type NewOrder = Pick<OrderRow, 'role' | 'side' | 'type' | 'tif' | 'status'> & Partial<Pick<OrderRow, 'limit_price' | 'stop_price' | 'trail_amount' | 'trail_unit' | 'parent_id' | 'extreme' | 'expires_at'>>
  function insert(accountId: number, group: string, spec: OrderSpec, o: NewOrder, now: number): number {
    const r = run(
      `INSERT INTO orders (account_id, group_id, parent_id, role, symbol, side, qty, type, limit_price, stop_price, trail_amount, trail_unit, extreme, tif, status, created_at, start_at, expires_at, source, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      accountId, group, o.parent_id ?? null, o.role, spec.symbol, o.side, spec.qty, o.type, o.limit_price ?? null, o.stop_price ?? null,
      o.trail_amount ?? null, o.trail_unit ?? null, o.extreme ?? null, o.tif, o.status, now, nextBarTime(now), o.expires_at ?? null, spec.source ?? 'user', spec.note ?? null
    )
    return Number(r.lastInsertRowid)
  }

  async function place(specIn: OrderSpec): Promise<TradeResult<{ orderIds: number[]; filledNow: boolean; events: EngineEvent[] }>> {
    const spec: OrderSpec = { ...specIn, symbol: specIn.symbol.trim().toUpperCase() }
    const last = await market.quote(spec.symbol).catch(() => null)
    if (last == null) return { ok: false, errors: [`No live price for ${spec.symbol}. Check the symbol and your market-data connection.`] }
    const accountId = activeAccount()
    const v = await values(accountId)
    const a = analyze(spec, { last, positionQty: positionQty(accountId, spec.symbol), buyingPower: v.buyingPower, reserved: reserved(accountId), canShort: account(accountId).type !== 'cash' })
    if (a.errors.length) return { ok: false, errors: a.errors }

    if (!grain() && (spec.type !== 'market' || spec.strategy !== 'single'))
      return { ok: false, errors: ['Your market-data plan has no intraday bars, so only plain market orders can be filled. Limit, stop, bracket and OCO orders need intraday data.'] }
    if (!grain() && !isMarketOpen(clock())) return { ok: false, errors: ['The market is closed and your plan has no intraday bars, so a market order cannot be filled until the market opens.'] }
    const now = clock()
    const group = crypto.randomUUID()
    const expires = spec.tif === 'day' ? sessionCloseAfter(now) : null
    const ids: number[] = []
    tx(() => {
      const mainStatus = 'working' as const
      const mainId = insert(accountId, group, spec, {
        role: spec.strategy === 'bracket' ? 'entry' : spec.strategy === 'oco' ? 'oco_a' : 'single',
        side: spec.side, type: spec.type, tif: spec.tif, status: mainStatus,
        limit_price: spec.limit ?? null, stop_price: spec.stop ?? null, trail_amount: spec.trailAmount ?? null, trail_unit: spec.trailUnit ?? null,
        extreme: spec.type === 'trailing_stop' ? last : null, expires_at: expires
      }, now)
      ids.push(mainId)
      const p = spec.protect
      if (spec.strategy === 'bracket') {
        const exit = exitSide(spec.side)
        ids.push(insert(accountId, group, spec, { role: 'target', parent_id: mainId, side: exit, type: 'limit', tif: 'gtc', status: 'pending', limit_price: spec.target ?? null }, now))
        if (p) ids.push(insert(accountId, group, spec, { role: 'stop', parent_id: mainId, side: exit, type: p.type, tif: 'gtc', status: 'pending', stop_price: p.stop ?? null, limit_price: p.limit ?? null, trail_amount: p.trailAmount ?? null, trail_unit: p.trailUnit ?? null }, now))
      } else if (spec.strategy === 'oco' && p) {
        ids.push(insert(accountId, group, spec, { role: 'oco_b', side: spec.side, type: p.type, tif: spec.tif, status: 'working', stop_price: p.stop ?? null, limit_price: p.limit ?? null, trail_amount: p.trailAmount ?? null, trail_unit: p.trailUnit ?? null, extreme: p.type === 'trailing_stop' ? last : null, expires_at: expires }, now))
      }
    })
    const events = await process(spec.symbol)
    const filledNow = events.some((e) => e.text.includes('filled'))
    return { ok: true, orderIds: ids, filledNow, events }
  }

  // ---------------------------------------------------------------- filling
  function cancelRow(id: number, reason: string, status: 'cancelled' | 'rejected' | 'expired' = 'cancelled') {
    run(`UPDATE orders SET status = ?, reason = ? WHERE id = ? AND status IN ${ACTIVE}`, status, reason, id)
    for (const c of all<OrderRow>(`SELECT * FROM orders WHERE parent_id = ? AND status IN ${ACTIVE}`, id)) cancelRow(c.id, `Parent order ${status}`, 'cancelled')
  }

  function fill(o: OrderRow, price: number, time: number, events: EngineEvent[]): boolean {
    const buy = isBuy(o.side)
    const pos = one<{ qty: number; avg_price: number }>('SELECT qty, avg_price FROM positions WHERE account_id = ? AND symbol = ?', o.account_id, o.symbol)
    const held = pos?.qty ?? 0
    // exits must match a real position (a leftover stop after the position was closed elsewhere)
    if (o.side === 'sell' && held < o.qty) { cancelRow(o.id, 'No shares to sell', 'rejected'); events.push({ text: `${o.symbol}: ${SIDE_LABEL[o.side]} ${o.qty} rejected (no position).` }); return false }
    if (o.side === 'buy_to_cover' && -held < o.qty) { cancelRow(o.id, 'No short position to cover', 'rejected'); events.push({ text: `${o.symbol}: ${SIDE_LABEL[o.side]} ${o.qty} rejected (no short position).` }); return false }
    let realized = 0
    tx(() => {
      const signed = buy ? o.qty : -o.qty
      const newQty = held + signed
      if (opensPosition(o.side)) {
        const avg = ((Math.abs(held) * (pos?.avg_price ?? 0)) + o.qty * price) / Math.abs(newQty)
        run('INSERT INTO positions (account_id, symbol, qty, avg_price) VALUES (?,?,?,?) ON CONFLICT(account_id, symbol) DO UPDATE SET qty = excluded.qty, avg_price = excluded.avg_price', o.account_id, o.symbol, newQty, avg)
      } else {
        realized = (buy ? (pos!.avg_price - price) : (price - pos!.avg_price)) * o.qty
        if (newQty === 0) run('DELETE FROM positions WHERE account_id = ? AND symbol = ?', o.account_id, o.symbol)
        else run('UPDATE positions SET qty = ? WHERE account_id = ? AND symbol = ?', newQty, o.account_id, o.symbol)
      }
      run('UPDATE accounts SET cash = cash + ? WHERE id = ?', buy ? -o.qty * price : o.qty * price, o.account_id)
      run('INSERT INTO fills (account_id, order_id, symbol, side, qty, price, time, realized_pl) VALUES (?,?,?,?,?,?,?,?)', o.account_id, o.id, o.symbol, o.side, o.qty, price, time, realized)
      run(`UPDATE orders SET status = 'filled', filled_at = ?, fill_price = ? WHERE id = ?`, time, price, o.id)
      const exits = ['target', 'stop', 'oco_a', 'oco_b']
      if (exits.includes(o.role)) for (const s of all<OrderRow>(`SELECT * FROM orders WHERE group_id = ? AND id != ? AND status IN ${ACTIVE}`, o.group_id, o.id)) if (exits.includes(s.role)) cancelRow(s.id, 'Other leg of the OCO filled')
      if (o.role === 'entry') {
        run(`UPDATE orders SET status = 'working', start_at = ?, extreme = CASE WHEN type = 'trailing_stop' THEN ? ELSE extreme END WHERE parent_id = ? AND status = 'pending'`, nextBarTime(time + 1), price, o.id)
      }
    })
    events.push({ text: `${o.symbol}: ${SIDE_LABEL[o.side]} ${o.qty} filled @ ${price.toFixed(2)}${opensPosition(o.side) ? '' : ` (P/L ${realized >= 0 ? '+' : '-'}$${Math.abs(realized).toFixed(2)})`}` })
    return true
  }

  interface St { extreme: number | null; triggered: boolean }
  /** Price at which `o` fills inside `bar`, or null. May advance trailing/trigger state. */
  function tryBar(o: OrderRow, bar: Bar, st: St, closed: boolean): number | null {
    const buy = isBuy(o.side)
    const stopHit = (s: number) => (buy ? (bar.high >= s ? Math.max(s, bar.open) : null) : (bar.low <= s ? Math.min(s, bar.open) : null))
    const limitFill = (l: number) => (buy ? (bar.low <= l ? Math.min(l, bar.open) : null) : (bar.high >= l ? Math.max(l, bar.open) : null))
    switch (o.type) {
      case 'market': return bar.open
      case 'limit': return limitFill(o.limit_price!)
      case 'stop': return stopHit(o.stop_price!)
      case 'stop_limit': {
        if (!st.triggered) {
          const t = stopHit(o.stop_price!)
          if (t == null) return null
          st.triggered = true
          const l = o.limit_price!
          if (buy ? t <= l : t >= l) return t
          return (buy ? bar.low <= l : bar.high >= l) ? l : null
        }
        return limitFill(o.limit_price!)
      }
      case 'trailing_stop': {
        if (st.extreme == null) st.extreme = bar.open
        const dist = o.trail_unit === '%' ? (st.extreme * o.trail_amount!) / 100 : o.trail_amount!
        const trigger = buy ? st.extreme + dist : st.extreme - dist
        const hit = stopHit(trigger)
        if (hit != null) return hit
        if (closed) st.extreme = buy ? Math.min(st.extreme, bar.low) : Math.max(st.extreme, bar.high)
        return null
      }
    }
  }

  // ---------------------------------------------------------------- processing
  async function process(symbol: string): Promise<EngineEvent[]> {
    const events: EngineEvent[] = []
    const now = clock()
    for (const o of all<OrderRow>(`SELECT * FROM orders WHERE symbol = ? AND status IN ${ACTIVE} AND expires_at IS NOT NULL AND expires_at < ?`, symbol, now)) {
      cancelRow(o.id, 'Day order expired at the close', 'expired')
      events.push({ text: `${o.symbol}: ${SIDE_LABEL[o.side]} ${o.qty} expired.` })
    }
    const working = () => all<OrderRow>(`SELECT * FROM orders WHERE symbol = ? AND status = 'working' ORDER BY id`, symbol)
    if (working().length === 0) return events

    // fresh market orders during the session fill at the live price right away; queued ones (placed while
    // closed, or long ago) fall through to the bars below and fill at the first available open
    if (isMarketOpen(now)) {
      const markets = working().filter((o) => o.type === 'market' && now - o.created_at <= 120)
      if (markets.length) {
        const price = await market.quote(symbol).catch(() => null)
        if (price != null) for (const o of markets) fill(o, price, now, events)
      }
    }

    const live = working()
    if (live.length === 0) return events
    const g = grain()
    if (!g) return events // no intraday bars on this plan: only fresh market orders (above) can fill
    const since = Math.min(...live.map((o) => o.start_at))
    const bars = await market.bars(symbol, since).catch(() => [] as Bar[])
    const state = new Map<number, St>(live.map((o) => [o.id, { extreme: o.extreme, triggered: !!o.triggered }]))
    const checked = new Map<number, number>(live.map((o) => [o.id, o.checked_to]))

    for (const bar of bars) {
      const closed = bar.time + (g?.seconds ?? 60) <= now
      // stops are evaluated before targets, so an ambiguous bar counts as the stop being hit first
      const order = (o: OrderRow) => (o.role === 'target' ? 1 : 0)
      for (const o of working().sort((a, b) => order(a) - order(b))) {
        if (bar.time < o.start_at || bar.time <= (checked.get(o.id) ?? 0)) continue
        const st = state.get(o.id) ?? { extreme: o.extreme, triggered: !!o.triggered }
        state.set(o.id, st)
        const price = tryBar(o, bar, st, closed)
        if (price != null) { if (fill(o, price, bar.time, events)) continue }
        if (closed) checked.set(o.id, bar.time)
      }
    }
    for (const o of working()) {
      const st = state.get(o.id)
      if (st) run('UPDATE orders SET extreme = ?, triggered = ?, checked_to = ? WHERE id = ?', st.extreme, st.triggered ? 1 : 0, checked.get(o.id) ?? o.checked_to, o.id)
    }
    return events
  }

  // ---------------------------------------------------------------- other operations
  function cancel(id: number): TradeResult {
    const o = one<OrderRow>('SELECT * FROM orders WHERE id = ?', id)
    if (!o) return { ok: false, errors: ['Order not found.'] }
    if (o.status !== 'working' && o.status !== 'pending') return { ok: false, errors: [`Order is already ${o.status}.`] }
    cancelRow(id, 'Cancelled by user')
    return { ok: true }
  }

  function modify(id: number, patch: { limit?: number; stop?: number; qty?: number; trailAmount?: number }): TradeResult {
    const o = one<OrderRow>('SELECT * FROM orders WHERE id = ?', id)
    if (!o) return { ok: false, errors: ['Order not found.'] }
    if (o.status !== 'working' && o.status !== 'pending') return { ok: false, errors: [`Order is already ${o.status}.`] }
    const good = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0
    if (patch.limit !== undefined && (!good(patch.limit) || o.limit_price == null)) return { ok: false, errors: ['This order has no limit price to change.'] }
    if (patch.stop !== undefined && (!good(patch.stop) || o.stop_price == null)) return { ok: false, errors: ['This order has no stop price to change.'] }
    if (patch.trailAmount !== undefined && (!good(patch.trailAmount) || o.trail_amount == null)) return { ok: false, errors: ['This order has no trailing amount to change.'] }
    if (patch.qty !== undefined && (!Number.isInteger(patch.qty) || patch.qty < 1)) return { ok: false, errors: ['Quantity must be a whole number, 1 or more.'] }
    tx(() => {
      if (patch.limit !== undefined) run('UPDATE orders SET limit_price = ? WHERE id = ?', patch.limit, id)
      if (patch.stop !== undefined) run('UPDATE orders SET stop_price = ?, triggered = 0 WHERE id = ?', patch.stop, id)
      if (patch.trailAmount !== undefined) run('UPDATE orders SET trail_amount = ? WHERE id = ?', patch.trailAmount, id)
      if (patch.qty !== undefined) run(`UPDATE orders SET qty = ? WHERE (id = ? OR parent_id = ?) AND status IN ${ACTIVE}`, patch.qty, id, id)
    })
    return { ok: true }
  }

  async function closePosition(symbol: string): Promise<TradeResult<{ orderIds: number[] }>> {
    const qty = positionQty(activeAccount(), symbol)
    if (qty === 0) return { ok: false, errors: [`No position in ${symbol}.`] }
    for (const o of all<OrderRow>(`SELECT * FROM orders WHERE symbol = ? AND account_id = ? AND status IN ${ACTIVE}`, symbol, activeAccount())) cancelRow(o.id, 'Position closed')
    const r = await place({ symbol, side: qty > 0 ? 'sell' : 'buy_to_cover', qty: Math.abs(qty), type: 'market', tif: 'day', strategy: 'single', source: 'user', note: 'Close position' })
    return r.ok ? { ok: true, orderIds: r.orderIds } : r
  }

  /** Clears the active account's orders, fills and positions and restarts it from `startingCash`. Other accounts are untouched. */
  function reset(startingCash: number): void {
    const id = activeAccount()
    tx(() => {
      run('DELETE FROM orders WHERE account_id = ?', id); run('DELETE FROM fills WHERE account_id = ?', id); run('DELETE FROM positions WHERE account_id = ?', id)
      run('DELETE FROM account_transfers WHERE account_id = ?', id)
      run('UPDATE accounts SET cash = ?, starting_cash = ? WHERE id = ?', startingCash, startingCash, id)
    })
  }

  async function tick(): Promise<EngineEvent[]> {
    const events: EngineEvent[] = []
    for (const { symbol } of all<{ symbol: string }>(`SELECT DISTINCT symbol FROM orders WHERE status = 'working'`)) events.push(...(await process(symbol).catch(() => [])))
    return events
  }

  return { snapshot, place, cancel, modify, closePosition, reset, tick, process, values, positionQty: (symbol: string) => positionQty(activeAccount(), symbol) }
}
export type Engine = ReturnType<typeof createEngine>
