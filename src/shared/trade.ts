// Order model and pre-trade analysis shared by the engine (main) and the order ticket (renderer).
export type Side = 'buy' | 'sell' | 'sell_short' | 'buy_to_cover'
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
export type Tif = 'day' | 'gtc'
/** single order, bracket = "1st triggers OCO" (entry, then profit target + stop), oco = two exit orders, one cancels the other */
export type Strategy = 'single' | 'bracket' | 'oco'

export interface StopLeg { type: 'stop' | 'stop_limit' | 'trailing_stop'; stop?: number; limit?: number; trailAmount?: number; trailUnit?: '$' | '%' }

export interface OrderSpec {
  symbol: string
  side: Side
  qty: number
  type: OrderType
  limit?: number
  stop?: number
  trailAmount?: number
  trailUnit?: '$' | '%'
  tif: Tif
  strategy: Strategy
  /** bracket: profit-target limit price */
  target?: number
  /** bracket / oco: the protective stop leg */
  protect?: StopLeg
  source?: 'user' | 'claude'
  note?: string
}

export type OrderStatus = 'pending' | 'working' | 'filled' | 'cancelled' | 'rejected' | 'expired'
export type OrderRole = 'single' | 'entry' | 'target' | 'stop' | 'oco_a' | 'oco_b'

export interface OrderRow {
  id: number
  account_id: number
  group_id: string
  parent_id: number | null
  role: OrderRole
  symbol: string
  side: Side
  qty: number
  type: OrderType
  limit_price: number | null
  stop_price: number | null
  trail_amount: number | null
  trail_unit: '$' | '%' | null
  extreme: number | null
  triggered: number
  tif: Tif
  status: OrderStatus
  reason: string | null
  created_at: number
  start_at: number
  expires_at: number | null
  checked_to: number
  filled_at: number | null
  fill_price: number | null
  source: 'user' | 'claude'
  note: string | null
}

export interface FillRow { id: number; account_id: number; order_id: number; symbol: string; side: Side; qty: number; price: number; time: number; realized_pl: number }
export interface PositionView { symbol: string; qty: number; avg: number; mark: number | null; marketValue: number | null; unrealized: number | null; unrealizedPct: number | null }
export interface AccountView {
  /** which paper account this is, and the real-world account it mirrors */
  id: number; name: string; broker: string; url: string; type: 'cash' | 'margin'
  cash: number; startingCash: number; equity: number
  /** what is free to open new positions: already net of the cost of working orders */
  buyingPower: number
  /** cost of working orders that open positions, already taken out of buyingPower */
  reserved: number
  realizedPl: number; unrealizedPl: number; totalReturnPct: number
}
/** `fillBars` is the bar size working orders are filled against: 1-minute when the data plan allows, otherwise coarser; null when the plan has no intraday bars. */
export interface TradeSnapshot { account: AccountView; positions: PositionView[]; orders: OrderRow[]; fills: FillRow[]; at: number; fillBars: { label: string; seconds: number } | null }

export type TradeResult<T = object> = ({ ok: true } & T) | { ok: false; errors: string[] }

export const SIDE_LABEL: Record<Side, string> = { buy: 'Buy', sell: 'Sell', sell_short: 'Sell short', buy_to_cover: 'Buy to cover' }
export const TYPE_LABEL: Record<OrderType, string> = { market: 'Market', limit: 'Limit', stop: 'Stop', stop_limit: 'Stop limit', trailing_stop: 'Trailing stop' }
export const isBuy = (s: Side) => s === 'buy' || s === 'buy_to_cover'
export const opensPosition = (s: Side) => s === 'buy' || s === 'sell_short'
/** the side that closes a position opened with `s` */
export const exitSide = (s: Side): Side => (s === 'buy' ? 'sell' : s === 'sell_short' ? 'buy_to_cover' : s)

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const px = (n: number) => n.toFixed(2)

export interface AnalysisCtx {
  last: number | null
  /** signed shares currently held in this symbol (negative = short) */
  positionQty: number
  buyingPower: number
  /** notional already committed to other working orders that open positions (leave 0 when `buyingPower` is already net of them) */
  reserved: number
  /** false for cash accounts */
  canShort?: boolean
}
export interface Analysis {
  errors: string[]
  warnings: string[]
  entry: number | null
  notional: number | null
  stopPrice: number | null
  targetPrice: number | null
  risk: number | null
  reward: number | null
  rr: number | null
}

const pos = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

function trailDistance(amount: number | undefined, unit: '$' | '%' | undefined, ref: number): number | null {
  if (!pos(amount)) return null
  return unit === '%' ? (ref * amount) / 100 : amount
}

/** Validates an order and estimates cost and risk. `errors` block submission, `warnings` don't. */
export function analyze(spec: OrderSpec, ctx: AnalysisCtx): Analysis {
  const errors: string[] = [], warnings: string[] = []
  const { side, type } = spec
  const buy = isBuy(side)

  if (!spec.symbol) errors.push('Symbol is required.')
  if (!Number.isInteger(spec.qty) || spec.qty < 1) errors.push('Quantity must be a whole number of shares, 1 or more.')
  if ((type === 'limit' || type === 'stop_limit') && !pos(spec.limit)) errors.push('Enter a limit price.')
  if ((type === 'stop' || type === 'stop_limit') && !pos(spec.stop)) errors.push('Enter a stop price.')
  if (type === 'trailing_stop' && !pos(spec.trailAmount)) errors.push('Enter a trailing amount.')
  if (spec.strategy === 'single' && type !== 'market' && type !== 'limit' && type !== 'stop' && type !== 'stop_limit' && type !== 'trailing_stop') errors.push('Unknown order type.')

  const last = ctx.last
  let entry: number | null = null
  if (type === 'limit' || type === 'stop_limit') entry = pos(spec.limit) ? spec.limit : null
  else if (type === 'stop') entry = pos(spec.stop) ? spec.stop : null
  else entry = last
  if (entry == null && last != null) entry = last

  // position rules (stocks: a plain Sell needs shares, shorting is explicit)
  const held = ctx.positionQty
  if (side === 'sell' && held < spec.qty) errors.push(held > 0 ? `You hold ${held} shares; you can sell at most ${held}.` : 'You hold no shares to sell. To bet on a decline use "Sell short".')
  if (side === 'buy_to_cover' && -held < spec.qty) errors.push(held < 0 ? `You are short ${-held} shares; you can cover at most ${-held}.` : 'You have no short position to cover.')
  if (side === 'buy' && held < 0) errors.push('You are short this symbol. Use "Buy to cover" to close it first.')
  if (side === 'sell_short' && ctx.canShort === false) errors.push('This is a cash account, which cannot sell short. Use a margin account to short.')
  if (side === 'sell_short' && held > 0) errors.push('You hold shares of this symbol. Sell them first before shorting.')

  // sanity checks against the current price
  if (last != null) {
    if (type === 'limit' && pos(spec.limit)) {
      if (buy && spec.limit > last) warnings.push(`Buy limit ${px(spec.limit)} is above the last price ${px(last)}, so it will fill immediately at the market.`)
      if (!buy && spec.limit < last) warnings.push(`Sell limit ${px(spec.limit)} is below the last price ${px(last)}, so it will fill immediately at the market.`)
    }
    if ((type === 'stop' || type === 'stop_limit') && pos(spec.stop)) {
      if (buy && spec.stop < last) warnings.push(`Buy stop ${px(spec.stop)} is below the last price ${px(last)}, so it will trigger immediately.`)
      if (!buy && spec.stop > last) warnings.push(`Sell stop ${px(spec.stop)} is above the last price ${px(last)}, so it will trigger immediately.`)
    }
  }
  if (type === 'stop_limit' && pos(spec.stop) && pos(spec.limit) && (buy ? spec.limit < spec.stop : spec.limit > spec.stop)) {
    warnings.push(`Limit ${px(spec.limit)} is ${buy ? 'below' : 'above'} the stop ${px(spec.stop)}: the order may trigger but not fill.`)
  }

  // exit legs
  let stopPrice: number | null = null, targetPrice: number | null = null
  const exit = exitSide(side)
  const long = exit === 'sell'
  if (spec.strategy === 'bracket' || spec.strategy === 'oco') {
    if (spec.strategy === 'bracket' && !opensPosition(side)) errors.push('A bracket needs an entry that opens a position (Buy or Sell short).')
    if (spec.strategy === 'oco' && opensPosition(side)) errors.push('OCO is for exit orders. Choose Sell or Buy to cover, or use a bracket for a new entry.')
    const p = spec.protect
    if (!p) errors.push('Add a protective stop leg.')
    else {
      if (p.type !== 'trailing_stop' && !pos(p.stop)) errors.push('Enter the stop price for the stop leg.')
      if (p.type === 'stop_limit' && !pos(p.limit)) errors.push('Enter the limit price for the stop-limit leg.')
      if (p.type === 'trailing_stop' && !pos(p.trailAmount)) errors.push('Enter the trailing amount for the stop leg.')
      if (p.type === 'trailing_stop' && entry != null) {
        const d = trailDistance(p.trailAmount, p.trailUnit, entry)
        if (d != null) stopPrice = long ? entry - d : entry + d
      } else if (pos(p.stop)) stopPrice = p.stop
    }
    if (spec.strategy === 'bracket') {
      if (!pos(spec.target)) errors.push('Enter a profit target price.')
      else targetPrice = spec.target
    }
    const ref = spec.strategy === 'bracket' ? entry : last
    if (ref != null) {
      if (targetPrice != null && (long ? targetPrice <= ref : targetPrice >= ref)) errors.push(`For a ${long ? 'long' : 'short'} trade the profit target must be ${long ? 'above' : 'below'} the entry (${px(ref)}).`)
      if (stopPrice != null && (long ? stopPrice >= ref : stopPrice <= ref) && spec.strategy === 'bracket') errors.push(`For a ${long ? 'long' : 'short'} trade the stop must be ${long ? 'below' : 'above'} the entry (${px(ref)}).`)
      if (spec.strategy === 'oco' && stopPrice != null && (long ? stopPrice >= ref : stopPrice <= ref)) warnings.push(`The stop ${px(stopPrice)} is on the wrong side of the last price ${px(ref)}; it will trigger immediately.`)
    }
  }

  const notional = entry != null && Number.isInteger(spec.qty) && spec.qty > 0 ? entry * spec.qty : null
  if (opensPosition(side) && notional != null) {
    const room = ctx.buyingPower - ctx.reserved
    if (notional > room) errors.push(`This order needs ${money(notional)} but only ${money(Math.max(0, room))} of buying power is free.`)
  }

  let risk: number | null = null, reward: number | null = null, rr: number | null = null
  if (spec.strategy === 'bracket' && entry != null && stopPrice != null && Number.isInteger(spec.qty) && spec.qty > 0) {
    risk = Math.abs(entry - stopPrice) * spec.qty
    if (targetPrice != null) { reward = Math.abs(targetPrice - entry) * spec.qty; rr = risk > 0 ? reward / risk : null }
    if (rr != null && rr < 1) warnings.push(`Reward is smaller than risk (1 : ${rr.toFixed(2)}). You would need to win more than ${Math.round(100 / (1 + rr))}% of the time to break even.`)
  }
  if (last == null) warnings.push('No live price is available for this symbol, so estimates are missing.')

  return { errors, warnings, entry, notional, stopPrice, targetPrice, risk, reward, rr }
}

const tifLabel = (t: Tif) => t.toUpperCase()
function legText(side: Side, qty: number, symbol: string, type: OrderType, o: { limit?: number; stop?: number; trailAmount?: number; trailUnit?: '$' | '%' }, tif: Tif): string {
  const act = isBuy(side) ? `BUY +${qty}` : `SELL -${qty}`
  const label = side === 'sell_short' ? ' (short)' : side === 'buy_to_cover' ? ' (cover)' : ''
  const price =
    type === 'market' ? 'MKT'
    : type === 'limit' ? `@${px(o.limit ?? 0)} LMT`
    : type === 'stop' ? `STP ${px(o.stop ?? 0)}`
    : type === 'stop_limit' ? `STP ${px(o.stop ?? 0)} LMT ${px(o.limit ?? 0)}`
    : `TRAIL ${o.trailUnit === '%' ? `${o.trailAmount}%` : `$${o.trailAmount}`}`
  return `${act} ${symbol}${label} ${price} ${tifLabel(tif)}`
}

/** Confirmation-style text, one line per leg, like a broker's order confirmation. */
export function describeOrder(spec: OrderSpec): string[] {
  const lines = [legText(spec.side, spec.qty, spec.symbol, spec.type, spec, spec.tif)]
  const exit = exitSide(spec.side)
  if (spec.strategy === 'bracket') lines[0] += '  — triggers OCO:'
  if (spec.strategy === 'oco') lines[0] += '  — OCO with:'
  if (spec.strategy === 'bracket' && spec.target != null) lines.push(`   ${legText(exit, spec.qty, spec.symbol, 'limit', { limit: spec.target }, 'gtc')}`)
  if (spec.strategy !== 'single' && spec.protect) {
    const p = spec.protect
    lines.push(`   ${legText(spec.strategy === 'oco' ? spec.side : exit, spec.qty, spec.symbol, p.type, p, 'gtc')}`)
  }
  return lines
}
