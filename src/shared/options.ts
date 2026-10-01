// Options chain model and the analytics shown on the Option Stats screen (pure, so screen and Claude share them).
export interface OptionContract {
  exp: string // YYYY-MM-DD
  type: 'C' | 'P'
  strike: number
  bid: number
  ask: number
  last: number | null
  volume: number
  oi: number
  /** implied volatility as a fraction (0.31 = 31%); null when the feed value is unusable */
  iv: number | null
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
  theo: number | null
  change: number | null
}
export interface OptionsChain {
  symbol: string
  price: number
  change: number | null
  changePct: number | null
  /** 30-day implied volatility (fraction), from the feed */
  iv30: number | null
  /** when the feed was refreshed (UTC seconds) */
  fetchedAt: number
  expirations: { date: string; dte: number }[]
  contracts: OptionContract[]
  source: string
}

export const mid = (c: OptionContract) => (c.bid > 0 && c.ask > 0 ? (c.bid + c.ask) / 2 : c.last ?? c.theo ?? 0)

export function contractsFor(chain: OptionsChain, exp: string): OptionContract[] {
  return chain.contracts.filter((c) => c.exp === exp)
}

/** The strike closest to the underlying price among a set of contracts. */
export function atmStrike(cs: OptionContract[], price: number): number | null {
  let best: number | null = null
  for (const c of cs) if (best == null || Math.abs(c.strike - price) < Math.abs(best - price)) best = c.strike
  return best
}

/** Average IV of the at-the-money call and put. */
export function atmIv(cs: OptionContract[], price: number): number | null {
  const k = atmStrike(cs, price)
  if (k == null) return null
  const ivs = cs.filter((c) => c.strike === k && c.iv != null).map((c) => c.iv!)
  return ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null
}

export function straddle(cs: OptionContract[], price: number): { strike: number; cost: number } | null {
  const k = atmStrike(cs, price)
  if (k == null) return null
  const call = cs.find((c) => c.strike === k && c.type === 'C'), put = cs.find((c) => c.strike === k && c.type === 'P')
  return call && put ? { strike: k, cost: mid(call) + mid(put) } : null
}

/** One-standard-deviation move implied by IV over `dte` days. */
export const expectedMove = (price: number, iv: number, dte: number) => price * iv * Math.sqrt(Math.max(dte, 0.5) / 365)

export interface Activity { callVolume: number; putVolume: number; callOi: number; putOi: number; pcVolume: number | null; pcOi: number | null }
export function activity(cs: OptionContract[]): Activity {
  let callVolume = 0, putVolume = 0, callOi = 0, putOi = 0
  for (const c of cs) { if (c.type === 'C') { callVolume += c.volume; callOi += c.oi } else { putVolume += c.volume; putOi += c.oi } }
  return { callVolume, putVolume, callOi, putOi, pcVolume: callVolume ? putVolume / callVolume : null, pcOi: callOi ? putOi / callOi : null }
}

/** The strike at which option holders would collectively lose the most (writers pay the least). */
export function maxPain(cs: OptionContract[]): number | null {
  const strikes = [...new Set(cs.map((c) => c.strike))].sort((a, b) => a - b)
  if (strikes.length === 0) return null
  let best = strikes[0], bestPain = Infinity
  for (const k of strikes) {
    let pain = 0
    for (const c of cs) pain += c.oi * (c.type === 'C' ? Math.max(0, k - c.strike) : Math.max(0, c.strike - k))
    if (pain < bestPain) { bestPain = pain; best = k }
  }
  return best
}

export function termStructure(chain: OptionsChain): { date: string; dte: number; iv: number }[] {
  return chain.expirations.flatMap((e) => {
    const iv = atmIv(contractsFor(chain, e.date), chain.price)
    return iv != null ? [{ date: e.date, dte: e.dte, iv }] : []
  })
}

export interface StrikeRow { strike: number; call?: OptionContract; put?: OptionContract }
/** Strikes for one expiration, `n` each side of the money (or all when n is null). */
export function strikeRows(cs: OptionContract[], price: number, n: number | null): StrikeRow[] {
  const map = new Map<number, StrikeRow>()
  for (const c of cs) { const r = map.get(c.strike) ?? { strike: c.strike }; if (c.type === 'C') r.call = c; else r.put = c; map.set(c.strike, r) }
  const rows = [...map.values()].sort((a, b) => a.strike - b.strike)
  if (n == null) return rows
  const atm = atmStrike(cs, price)
  const i = rows.findIndex((r) => r.strike === atm)
  return i < 0 ? rows : rows.slice(Math.max(0, i - n), i + n + 1)
}

/** Annualised 30-day realised volatility from closing prices (oldest first). */
export function historicalVol(closes: number[], days = 30): number | null {
  const c = closes.slice(-(days + 1))
  if (c.length < 10) return null
  const r = c.slice(1).map((x, i) => Math.log(x / c[i]))
  const m = r.reduce((a, b) => a + b, 0) / r.length
  const v = r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)
  return Math.sqrt(v) * Math.sqrt(252)
}

/** e.g. "Sep 30 335 C" */
export function contractLabel(c: OptionContract): string {
  const d = new Date(c.exp + 'T00:00:00Z')
  return `${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()} ${c.strike} ${c.type}`
}
