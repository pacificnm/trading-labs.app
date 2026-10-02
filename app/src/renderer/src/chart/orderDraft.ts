import { SIDE_LABEL, TYPE_LABEL, type OrderSpec, type OrderType, type Side, type Strategy, type StopLeg, type Tif, type OrderRow, type PositionView } from '../../../shared/trade'
import type { OrderLine } from './drawings'

/** Order ticket state. Inputs are strings so half-typed numbers survive re-renders. */
export interface Draft {
  side: Side
  qty: string
  type: OrderType
  limit: string
  stop: string
  trailAmount: string
  trailUnit: '$' | '%'
  tif: Tif
  strategy: Strategy
  target: string
  protectType: StopLeg['type']
  protectStop: string
  protectLimit: string
  protectTrail: string
  protectTrailUnit: '$' | '%'
  source: 'user' | 'claude'
  note?: string
  /** record this trade in the journal when sent */
  journal: boolean
  journalNote: string
  /** an existing journal entry (e.g. Claude's idea) this ticket belongs to */
  journalId?: number
}

export const emptyDraft = (side: Side = 'buy'): Draft => ({
  side, qty: '10', type: 'market', limit: '', stop: '', trailAmount: '', trailUnit: '$', tif: 'day', strategy: 'single',
  target: '', protectType: 'stop', protectStop: '', protectLimit: '', protectTrail: '', protectTrailUnit: '$', source: 'user', journal: true, journalNote: ''
})

const num = (s: string): number | undefined => { const n = parseFloat(s); return Number.isFinite(n) ? n : undefined }
const fixed = (n: number) => String(Math.round(n * 100) / 100)

export function toSpec(d: Draft, symbol: string): OrderSpec {
  const spec: OrderSpec = {
    symbol, side: d.side, qty: parseInt(d.qty, 10) || 0, type: d.type, tif: d.tif, strategy: d.strategy,
    limit: num(d.limit), stop: num(d.stop), trailAmount: num(d.trailAmount), trailUnit: d.trailUnit, source: d.source, note: d.note
  }
  if (d.strategy !== 'single') {
    spec.protect = { type: d.protectType, stop: num(d.protectStop), limit: num(d.protectLimit), trailAmount: num(d.protectTrail), trailUnit: d.protectTrailUnit }
    if (d.strategy === 'bracket') spec.target = num(d.target)
  }
  return spec
}

export function fromSpec(s: OrderSpec): Draft {
  const p = s.protect
  return {
    side: s.side, qty: String(s.qty), type: s.type, limit: s.limit != null ? fixed(s.limit) : '', stop: s.stop != null ? fixed(s.stop) : '',
    trailAmount: s.trailAmount != null ? String(s.trailAmount) : '', trailUnit: s.trailUnit ?? '$', tif: s.tif, strategy: s.strategy,
    target: s.target != null ? fixed(s.target) : '', protectType: p?.type ?? 'stop', protectStop: p?.stop != null ? fixed(p.stop) : '',
    protectLimit: p?.limit != null ? fixed(p.limit) : '', protectTrail: p?.trailAmount != null ? String(p.trailAmount) : '', protectTrailUnit: p?.trailUnit ?? '$',
    source: s.source ?? 'user', note: s.note, journal: true, journalNote: ''
  }
}

const short = (s: Side) => ({ buy: 'BUY', sell: 'SELL', sell_short: 'SHORT', buy_to_cover: 'COVER' })[s]
const TYPE_SHORT: Record<OrderType, string> = { market: 'MKT', limit: 'LMT', stop: 'STP', stop_limit: 'STP LMT', trailing_stop: 'TRAIL' }
const money0 = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`

/** Lines shown on the chart while the ticket is open. */
export function draftLines(d: Draft, symbol: string, last: number | null): OrderLine[] {
  const spec = toSpec(d, symbol)
  const lines: OrderLine[] = []
  const qty = spec.qty || 0
  const entryPrice = spec.type === 'limit' || spec.type === 'stop_limit' ? spec.limit : spec.type === 'stop' ? spec.stop : undefined
  const ep = entryPrice ?? last
  if (ep != null) {
    lines.push({ id: 'draft:entry', price: ep, color: '#2196f3', style: 'draft', draggable: entryPrice != null,
      label: `${short(spec.side)} ${TYPE_SHORT[spec.type]}${entryPrice != null ? ' ' + ep.toFixed(2) : ''} ×${qty}` })
  }
  if (spec.strategy !== 'single' && spec.protect) {
    const p = spec.protect
    const long = spec.side === 'buy' || spec.side === 'sell' // long entry, or an exit of a long position
    const dist = ep != null && p.trailAmount ? (p.trailUnit === '%' ? (ep * p.trailAmount) / 100 : p.trailAmount) : null
    const sp = p.type === 'trailing_stop' ? (ep != null && dist != null ? (long ? ep - dist : ep + dist) : undefined) : p.stop
    if (sp != null) lines.push({ id: 'draft:stop', price: sp, color: '#ef5350', style: 'draft', draggable: p.type !== 'trailing_stop', label: `STOP ${p.type === 'trailing_stop' ? '(trail) ' : ''}${sp.toFixed(2)}` })
  }
  if (spec.strategy === 'bracket' && spec.target != null) lines.push({ id: 'draft:target', price: spec.target, color: '#26a69a', style: 'draft', draggable: true, label: `TARGET ${spec.target.toFixed(2)}` })
  return lines
}

/** Working/pending orders and the open position for `symbol`, shown as chart lines. */
export function tradeLines(symbol: string, orders: OrderRow[], positions: PositionView[]): OrderLine[] {
  const lines: OrderLine[] = []
  const pos = positions.find((p) => p.symbol === symbol)
  if (pos) {
    const pl = pos.unrealized
    lines.push({ id: 'pos:' + symbol, price: pos.avg, color: pl == null ? '#9e9e9e' : pl >= 0 ? '#26a69a' : '#ef5350', style: 'position', draggable: false,
      label: `${pos.qty > 0 ? 'LONG' : 'SHORT'} ${Math.abs(pos.qty)} @ ${pos.avg.toFixed(2)}${pl != null ? '  ' + money0(pl) : ''}` })
  }
  for (const o of orders) {
    if (o.symbol !== symbol || (o.status !== 'working' && o.status !== 'pending')) continue
    const price = o.type === 'limit' ? o.limit_price : o.stop_price
    if (price == null) continue
    lines.push({ id: 'order:' + o.id, price, color: o.role === 'target' ? '#26a69a' : o.role === 'stop' || o.type === 'stop' || o.type === 'stop_limit' ? '#ef5350' : '#2196f3', style: o.status === 'pending' ? 'draft' : 'working', draggable: true,
      label: `${o.status === 'pending' ? 'NEXT ' : ''}${short(o.side)} ${TYPE_SHORT[o.type]} ${price.toFixed(2)} ×${o.qty}` })
  }
  return lines
}
export { SIDE_LABEL, TYPE_LABEL }
