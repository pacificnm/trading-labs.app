import type { OrderSpec, TradeResult } from '../shared/trade'
import type { Pf } from '../shared/portfolio'

export interface OrderDeps {
  portfolio: (id: number) => Pf | null
  activeAccountId: () => number
  place: (spec: OrderSpec) => Promise<TradeResult<{ orderIds: number[]; filledNow: boolean; events: { text: string }[] }>>
}
export interface OrderOutcome { symbol: string; qty: number; ok: boolean; filledNow?: boolean; error?: string }
export type OrderResult = { ok: true; outcomes: OrderOutcome[]; events: { text: string }[] } | { ok: false; error: string }

/**
 * Sends paper market orders for a linked portfolio's buy or sell plan. It exists for two buttons the user clicks (after a confirmation), and no
 * Claude tool calls it. The checks are made here, not in the screen: the portfolio must follow the account that is active (orders always go to the
 * active account), every symbol must be in the portfolio, mutual funds are refused because the paper account cannot trade them, and sizes must be
 * whole shares. A sell is only ever a plain `sell` of shares the account holds (the engine refuses anything else), never a short sale.
 */
export async function placePortfolioOrders(deps: OrderDeps, portfolioId: number, side: 'buy' | 'sell', orders: { symbol: string; qty: number }[]): Promise<OrderResult> {
  if (side !== 'buy' && side !== 'sell') return { ok: false, error: 'An order is either a buy or a sell.' }
  const p = deps.portfolio(portfolioId)
  if (!p) return { ok: false, error: 'That portfolio no longer exists.' }
  if (p.accountId == null) return { ok: false, error: 'This portfolio is not linked to a paper account.' }
  if (deps.activeAccountId() !== p.accountId) return { ok: false, error: 'This portfolio follows a different paper account from the active one. Make that account active first, so the orders go where you expect.' }
  const todo = orders.filter((b) => b.qty > 0)
  if (todo.length === 0) return { ok: false, error: `There is nothing to ${side}.` }
  const seen = new Set<string>()
  for (const b of todo) {
    const sym = String(b.symbol ?? '').trim().toUpperCase()
    const item = p.items.find((i) => i.symbol === sym)
    if (!item) return { ok: false, error: `${sym || 'A symbol'} is not in this portfolio.` }
    if (item.kind === 'fund') return { ok: false, error: `${sym} is a mutual fund, and the paper account cannot trade mutual funds.` }
    if (!Number.isInteger(b.qty) || b.qty > 1_000_000) return { ok: false, error: `${sym}: the paper account trades whole shares.` }
    if (seen.has(sym)) return { ok: false, error: `${sym} appears twice in the request.` }
    seen.add(sym)
  }
  const outcomes: OrderOutcome[] = []
  const events: { text: string }[] = []
  for (const b of todo) {
    const symbol = b.symbol.trim().toUpperCase()
    const r = await deps.place({ symbol, side, qty: b.qty, type: 'market', tif: 'day', strategy: 'single', source: 'user', note: `Portfolio ${side === 'buy' ? 'plan' : 'sale'}: ${p.name}` })
    if (r.ok) events.push(...r.events)
    outcomes.push(r.ok ? { symbol, qty: b.qty, ok: true, filledNow: r.filledNow } : { symbol, qty: b.qty, ok: false, error: r.errors.join(' ') })
  }
  return { ok: true, outcomes, events }
}
