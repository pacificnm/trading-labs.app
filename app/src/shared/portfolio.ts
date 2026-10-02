// Portfolio planning: split an investment amount by target percentages, say how many shares that buys, and value what you hold.
// Pure TypeScript (no Electron/React), shared by the Portfolio screen, the database module and Claude's read-only tool.
// Nothing here trades. It is arithmetic on prices the caller supplies.

export type Kind = 'stock' | 'etf' | 'fund'
export const KINDS: { id: Kind; label: string }[] = [{ id: 'stock', label: 'Stock' }, { id: 'etf', label: 'ETF' }, { id: 'fund', label: 'Mutual fund' }]
export const SYMBOL_RE = /^[A-Z0-9.^=-]{1,15}$/
/** US mutual fund tickers are five letters ending in X (VFIAX, FXAIX). A good first guess, and the user can change it. */
export const guessKind = (symbol: string): Kind => (/^[A-Z]{4}X$/.test(symbol.toUpperCase()) ? 'fund' : 'stock')

/** 'new': the amount is new money to invest now. 'total': the amount is the size you want the whole portfolio to reach. */
export type Mode = 'new' | 'total'

export interface PfItem {
  id: number
  symbol: string
  name: string
  kind: Kind
  /** target share of the portfolio, 0-100 */
  targetPct: number
  /** what the user holds now (0 for a planned position) */
  shares: number
  /** total money paid for those shares */
  cost: number
  /** price the user typed, used only when no live price exists */
  manualPrice: number | null
  /** set on the fly for a linked portfolio: this holding cannot be bought here (mutual funds are not tradable in the paper account) */
  noBuy?: boolean
}
export interface Pf {
  id: number
  name: string
  amount: number
  mode: Mode
  /** allow fractional shares of stocks and ETFs (mutual funds always allow them) */
  fractional: boolean
  /** spend what is left after rounding down on extra whole shares, most underweight first */
  leftover: boolean
  /** the paper account this portfolio follows, or null when the user types everything by hand */
  accountId: number | null
  items: PfItem[]
}
export type PfResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

export type Prices = Record<string, number | null | undefined>

/** The price used for a holding: the live one, else the one the user typed. */
export function priceOf(it: Pick<PfItem, 'symbol' | 'manualPrice'>, live: Prices): number | null {
  const p = live[it.symbol]
  if (p != null && Number.isFinite(p) && p > 0) return p
  return it.manualPrice != null && it.manualPrice > 0 ? it.manualPrice : null
}

const r2 = (n: number) => Math.round(n * 100) / 100
const r3 = (n: number) => Math.round(n * 1000) / 1000
/** Smallest amount you can buy: a whole share, or a thousandth of a share for funds and when fractions are allowed. */
export const stepFor = (it: Pick<PfItem, 'kind'>, p: Pick<Pf, 'fractional'>): number => (it.kind === 'fund' || p.fractional ? 0.001 : 1)
const floorTo = (n: number, step: number) => r3(Math.floor(n / step + 1e-9) * step)

export interface PlanRow {
  id: number
  symbol: string
  targetPct: number
  price: number | null
  currentValue: number
  /** money the plan puts into this holding (can be 0 when it is already at or over target) */
  dollars: number
  shares: number
  /** shares added by the "use leftover cash" pass, already included in `shares` */
  extra: number
  cost: number
  /** total mode only: shares you hold beyond the target, for information (the app never sells) */
  overShares: number
  overValue: number
}
export interface Plan {
  rows: PlanRow[]
  /** sum of the target percentages */
  pctTotal: number
  /** cash this plan can spend */
  budget: number
  spent: number
  leftover: number
  /** symbols with no price, which the plan cannot buy */
  missingPrice: string[]
  holdingsValue: number
}

export function planPortfolio(p: Pf, live: Prices): Plan {
  const priced = p.items.map((it) => ({ it, price: priceOf(it, live) }))
  const pctTotal = r2(p.items.reduce((s, it) => s + (it.targetPct || 0), 0))
  const curVal = (it: PfItem, price: number | null) => (price != null ? it.shares * price : 0)
  const holdingsValue = r2(priced.reduce((s, x) => s + curVal(x.it, x.price), 0))
  const amount = Math.max(0, p.amount || 0)
  const budget = p.mode === 'total' ? Math.max(0, r2(amount - holdingsValue)) : amount

  // money wanted per item
  let want: number[]
  if (p.mode === 'new') want = priced.map((x) => (amount * (x.it.targetPct || 0)) / 100)
  else {
    // top up whatever is under target; if that needs more than the cash available, share the cash in proportion to the shortfalls
    const need = priced.map((x) => (x.it.noBuy ? 0 : Math.max(0, (amount * (x.it.targetPct || 0)) / 100 - curVal(x.it, x.price))))
    const sum = need.reduce((a, b) => a + b, 0)
    const scale = sum > 0 ? Math.min(1, budget / sum) : 0
    want = need.map((n) => n * scale)
  }
  // holdings that cannot be bought here still count toward the portfolio, but the plan never spends on them
  want = want.map((w, i) => (priced[i].it.noBuy ? 0 : w))

  const rows: PlanRow[] = priced.map((x, i) => {
    const step = stepFor(x.it, p)
    const shares = x.price != null && want[i] > 0 ? floorTo(want[i] / x.price, step) : 0
    const cv = curVal(x.it, x.price)
    const tv = (amount * (x.it.targetPct || 0)) / 100
    const over = p.mode === 'total' && x.price != null ? Math.max(0, cv - tv) : 0
    return {
      id: x.it.id, symbol: x.it.symbol, targetPct: x.it.targetPct || 0, price: x.price, currentValue: r2(cv), dollars: r2(want[i]),
      shares, extra: 0, cost: x.price != null ? r2(shares * x.price) : 0, overShares: x.price != null && over > 0 ? r3(over / x.price) : 0, overValue: r2(over)
    }
  })

  let spent = rows.reduce((s, r) => s + r.cost, 0)
  if (p.leftover) {
    // buy one more step of whichever holding is furthest below its wanted amount, while the cash lasts
    for (let guard = 0; guard < 100000; guard++) {
      const room = budget - spent
      let best = -1, bestGap = 0
      rows.forEach((r, i) => {
        if (r.price == null || priced[i].it.noBuy) return
        const step = stepFor(priced[i].it, p)
        if (step < 1) return // fractional holdings are already exact; only whole-share holdings leave real cash behind
        if (r.price * step > room + 1e-9) return
        const gap = want[i] - r.cost
        if (gap > bestGap + 1e-9) { bestGap = gap; best = i }
      })
      if (best < 0) break
      const r = rows[best]
      const step = stepFor(priced[best].it, p)
      r.shares = r3(r.shares + step)
      r.extra = r3(r.extra + step)
      r.cost = r2(r.shares * r.price!)
      spent = rows.reduce((s, x) => s + x.cost, 0)
    }
  }
  spent = r2(rows.reduce((s, r) => s + r.cost, 0))
  return { rows, pctTotal, budget: r2(budget), spent, leftover: r2(budget - spent), missingPrice: priced.filter((x) => x.price == null).map((x) => x.it.symbol), holdingsValue }
}

export interface HoldingRow {
  id: number
  symbol: string
  shares: number
  cost: number
  avgCost: number | null
  price: number | null
  value: number | null
  gain: number | null
  gainPct: number | null
  /** share of the priced total, 0-100 */
  weight: number | null
  targetPct: number
  /** actual weight minus target, in percentage points */
  drift: number | null
}
export interface Holdings {
  rows: HoldingRow[]
  totalValue: number
  totalCost: number
  gain: number
  gainPct: number | null
  /** holdings with shares but no price: left out of the totals */
  missingPrice: string[]
}

export function summarizeHoldings(items: PfItem[], live: Prices): Holdings {
  const priced = items.map((it) => ({ it, price: priceOf(it, live) }))
  const totalValue = r2(priced.reduce((s, x) => s + (x.price != null ? x.it.shares * x.price : 0), 0))
  // cost of holdings that have a price, so the gain compares like with like
  const totalCost = r2(priced.reduce((s, x) => s + (x.price != null ? x.it.cost : 0), 0))
  const rows: HoldingRow[] = priced.map(({ it, price }) => {
    const value = price != null ? r2(it.shares * price) : null
    const gain = value != null ? r2(value - it.cost) : null
    const weight = value != null && totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : value != null ? 0 : null
    return {
      id: it.id, symbol: it.symbol, shares: it.shares, cost: it.cost, avgCost: it.shares > 0 && it.cost > 0 ? r2(it.cost / it.shares) : null,
      price, value, gain, gainPct: gain != null && it.cost > 0 ? Math.round((gain / it.cost) * 10000) / 100 : null,
      weight, targetPct: it.targetPct || 0, drift: weight != null ? Math.round((weight - (it.targetPct || 0)) * 100) / 100 : null
    }
  })
  const gain = r2(totalValue - totalCost)
  return {
    rows, totalValue, totalCost, gain, gainPct: totalCost > 0 ? Math.round((gain / totalCost) * 10000) / 100 : null,
    missingPrice: priced.filter((x) => x.it.shares > 0 && x.price == null).map((x) => x.it.symbol)
  }
}

/** Equal weights that add up to exactly 100 (the last item takes the rounding). */
export function equalWeights(n: number): number[] {
  if (n <= 0) return []
  const each = Math.floor((10000 / n)) / 100
  const out = Array.from({ length: n }, () => each)
  out[n - 1] = r2(100 - each * (n - 1))
  return out
}
/** The same proportions scaled so they add up to 100. All zeros stay zero. */
export function normalizeWeights(w: number[]): number[] {
  const sum = w.reduce((a, b) => a + b, 0)
  if (sum <= 0) return w.map(() => 0)
  const out = w.map((x) => Math.floor((x / sum) * 10000) / 100)
  out[out.length - 1] = r2(out[out.length - 1] + (100 - out.reduce((a, b) => a + b, 0)))
  return out
}

/** What the paper account says about itself, as the Portfolio screen needs it. */
export interface AccountLink {
  id: number
  name: string
  cash: number
  /** free to open positions: already net of working orders that reserve money */
  buyingPower: number
  /** long and short positions; shorts are ignored here */
  positions: { symbol: string; qty: number; avg: number }[]
  /** shares of market buy orders that have been sent but not filled yet, by symbol */
  pendingBuys: Record<string, number>
  /** shares of market sell orders that have been sent but not filled yet, by symbol */
  pendingSells?: Record<string, number>
}

export interface Effective {
  pf: Pf
  /** cash the plan may spend: the account's cash and buying power, less what unfilled market buys are about to use */
  availableCash: number
  /** short positions the account holds in this portfolio's symbols (not counted) */
  shorts: string[]
  /** shares from unfilled market buys that are counted as already held */
  pending: Record<string, number>
  /** shares in unfilled market sells that are counted as already gone */
  pendingSold: Record<string, number>
  /** shares that can still be sold from here: the account's position less sells already waiting; funds are 0 */
  sellable: Record<string, number>
}

/**
 * The portfolio the way a linked one is planned and valued. Stocks and ETFs take their shares and cost from the account's positions (plus orders
 * already sent but not filled, so the plan never buys the same shares twice); mutual funds cannot trade in the paper account, so they keep the
 * numbers the user typed and are never bought here. The amount is holdings plus available cash in "total size" mode, which tops up whatever is
 * under target using only the cash on hand. An unlinked portfolio is returned unchanged.
 */
export function effectivePortfolio(p: Pf, link: AccountLink | null, live: Prices): Effective {
  if (!link || p.accountId == null) return { pf: p, availableCash: 0, shorts: [], pending: {}, pendingSold: {}, sellable: Object.fromEntries(p.items.map((i) => [i.symbol, i.shares])) }
  const pending: Record<string, number> = {}
  const pendingSold: Record<string, number> = {}
  const sellable: Record<string, number> = {}
  const shorts: string[] = []
  let pendingCost = 0
  const items = p.items.map((it): PfItem => {
    if (it.kind === 'fund') { sellable[it.symbol] = 0; return { ...it, noBuy: true } }
    const pos = link.positions.find((x) => x.symbol === it.symbol)
    if (pos && pos.qty < 0) shorts.push(it.symbol)
    const qty = Math.max(0, pos?.qty ?? 0)
    const pend = Math.max(0, link.pendingBuys[it.symbol] ?? 0)
    const sold = Math.min(qty, Math.max(0, link.pendingSells?.[it.symbol] ?? 0))
    const price = priceOf(it, live)
    if (pend > 0) { pending[it.symbol] = pend; if (price != null) pendingCost += pend * price }
    if (sold > 0) pendingSold[it.symbol] = sold
    sellable[it.symbol] = qty - sold
    const kept = qty - sold
    return { ...it, shares: kept + pend, cost: r2(kept * (pos?.avg ?? 0) + (price != null ? pend * price : 0)), noBuy: false }
  })
  const availableCash = Math.max(0, r2(Math.min(link.cash, link.buyingPower) - pendingCost))
  const holdings = items.reduce((s, it) => { const pr = priceOf(it, live); return s + (pr != null ? it.shares * pr : 0) }, 0)
  return { pf: { ...p, items, mode: 'total', fractional: false, amount: r2(holdings + availableCash) }, availableCash, shorts, pending, pendingSold, sellable }
}

// ---------------------------------------------------------------------------------------------------------------- selling

/** proportional: the same share of every holding. overweight: trim what is above its target first, then the rest proportionally. */
export type SellMethod = 'proportional' | 'overweight'
export interface SellRow {
  id: number
  symbol: string
  price: number | null
  /** shares that can be sold from here */
  sellable: number
  shares: number
  proceeds: number
  /** what the shares sold cost you (average cost times shares), null when no cost is known */
  basis: number | null
  /** estimated profit or loss on the shares sold, null when no cost is known */
  gain: number | null
  /** shares left in the holding after the sale */
  left: number
  /** the holding's gain or loss per share right now, in percent of its average cost */
  gainPctNow: number | null
  /** share of the remaining holdings' value after the sale, 0-100 */
  weightAfter: number | null
  /** why nothing is sold from this holding, when that is not obvious */
  skip?: string
}
export interface SellPlan {
  rows: SellRow[]
  percent: number
  /** value of the holdings the percentage applies to: everything that can be sold from here */
  baseValue: number
  /** the money the percentage asks for */
  target: number
  proceeds: number
  /** estimated profit on the shares sold, over the holdings that have a known cost */
  gain: number
  /** proceeds as a share of baseValue (selling whole shares leaves it a little under `percent`) */
  actualPct: number
  missingPrice: string[]
  /** things to tell the user (a shortfall, or why) */
  notes: string[]
}

/**
 * How many shares to sell to raise `percent` of the value of what can be sold, taking profits. Shares are whole (or thousandths where fractions are
 * allowed), never beyond what is sellable, and the total never goes over the percentage asked for, so the result is a little under it.
 * `sellable` overrides the shares that can be sold (a linked portfolio passes the account's free shares); without it every share is sellable.
 */
export function planSell(p: Pf, live: Prices, o: { percent: number; method: SellMethod; onlyProfit: boolean; sellable?: Record<string, number> }): SellPlan {
  const pct = Math.min(100, Math.max(0, Number.isFinite(o.percent) ? o.percent : 0))
  const priced = p.items.map((it) => ({ it, price: priceOf(it, live) }))
  const canSell = (x: { it: PfItem; price: number | null }) => {
    if (x.price == null || x.it.noBuy) return 0
    return Math.max(0, Math.min(x.it.shares, o.sellable ? o.sellable[x.it.symbol] ?? 0 : x.it.shares))
  }
  const avg = (it: PfItem) => (it.shares > 0 && it.cost > 0 ? it.cost / it.shares : null)
  const sellN = priced.map(canSell)
  const sellValue = priced.map((x, i) => (x.price != null ? sellN[i] * x.price : 0))
  const baseValue = r2(sellValue.reduce((a, b) => a + b, 0))
  const target = r2((baseValue * pct) / 100)
  const totalValue = priced.reduce((s, x) => s + (x.price != null ? x.it.shares * x.price : 0), 0)

  const why: (string | undefined)[] = priced.map((x, i) => {
    if (x.it.shares <= 0) return undefined
    if (x.price == null) return 'no price'
    if (x.it.noBuy) return "can't sell here"
    if (sellN[i] <= 0) return 'nothing free to sell'
    if (o.onlyProfit) { const a = avg(x.it); if (a == null) return 'cost unknown'; if (x.price <= a) return 'not in profit' }
    return undefined
  })
  const cand = priced.map((_, i) => sellN[i] > 0 && why[i] === undefined)
  const candValue = sellValue.map((v, i) => (cand[i] ? v : 0))
  const candTotal = candValue.reduce((a, b) => a + b, 0)

  // dollars to take from each candidate
  let dollars = candValue.map(() => 0)
  if (target > 0 && candTotal > 0) {
    if (o.method === 'proportional') {
      const f = Math.min(1, target / candTotal)
      dollars = candValue.map((v) => v * f)
    } else {
      const excess = priced.map((x, i) => (cand[i] && x.price != null ? Math.min(candValue[i], Math.max(0, x.it.shares * x.price - ((x.it.targetPct || 0) / 100) * totalValue)) : 0))
      const ex = excess.reduce((a, b) => a + b, 0)
      if (ex >= target) dollars = excess.map((e) => (ex > 0 ? (e * target) / ex : 0))
      else {
        const room = candValue.map((v, i) => v - excess[i])
        const rt = room.reduce((a, b) => a + b, 0)
        const rest = Math.min(target - ex, rt)
        dollars = excess.map((e, i) => e + (rt > 0 ? (room[i] * rest) / rt : 0))
      }
    }
  }

  // whole shares (or thousandths): round each holding down, then add one more step to the holdings with the largest remainders while the total stays at or under the target
  const steps = priced.map((x) => stepFor(x.it, p))
  const qty = priced.map((x, i) => (x.price != null && cand[i] && dollars[i] > 0 ? Math.max(0, Math.min(r3(Math.floor(dollars[i] / x.price / steps[i] + 1e-9) * steps[i]), sellN[i])) : 0))
  let raised = qty.reduce((s, q, i) => s + (priced[i].price != null ? q * priced[i].price! : 0), 0)
  for (let guard = 0; guard < 10000; guard++) {
    let best = -1, bestGap = 0
    priced.forEach((x, i) => {
      if (x.price == null || !cand[i]) return
      const gap = dollars[i] - qty[i] * x.price
      if (gap > bestGap + 1e-9 && qty[i] + steps[i] <= sellN[i] + 1e-9 && raised + x.price * steps[i] <= target + 1e-9) { bestGap = gap; best = i }
    })
    if (best < 0) break
    qty[best] = r3(qty[best] + steps[best])
    raised += priced[best].price! * steps[best]
  }

  const rows: SellRow[] = priced.map((x, i) => {
    const price = x.price
    const sh = qty[i]
    const a = avg(x.it)
    const proceeds = price != null ? r2(sh * price) : 0
    return {
      id: x.it.id, symbol: x.it.symbol, price, sellable: r3(sellN[i]), shares: sh, proceeds,
      basis: a != null ? r2(sh * a) : null, gain: a != null && price != null ? r2(sh * (price - a)) : null,
      left: r3(x.it.shares - sh), gainPctNow: a != null && price != null ? Math.round(((price - a) / a) * 10000) / 100 : null, weightAfter: null, skip: why[i]
    }
  })
  const proceeds = r2(rows.reduce((s, r) => s + r.proceeds, 0))
  const remaining = totalValue - proceeds
  rows.forEach((r, i) => { r.weightAfter = r.price != null && remaining > 0 ? Math.round(((r.left * r.price) / remaining) * 10000) / 100 : r.price != null ? 0 : null })
  const notes: string[] = []
  if (pct > 0 && baseValue === 0) notes.push('There is nothing to sell: no holdings with shares and a price that can be sold from here.')
  else if (pct > 0 && target > 0 && candTotal + 1e-9 < target) notes.push(`Only ${money0(candTotal)} of the ${money0(target)} asked for can be raised from the holdings that qualify${o.onlyProfit ? ' (only those in profit are included)' : ''}.`)
  else if (pct > 0 && target > 0 && proceeds === 0) notes.push('At this size no holding rounds to even one share. Raise the percentage.')
  return {
    rows, percent: pct, baseValue, target, proceeds, gain: r2(rows.reduce((s, r) => s + (r.gain ?? 0), 0)),
    actualPct: baseValue > 0 ? Math.round((proceeds / baseValue) * 10000) / 100 : 0, missingPrice: priced.filter((x) => x.it.shares > 0 && x.price == null).map((x) => x.it.symbol), notes
  }
}
const money0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
