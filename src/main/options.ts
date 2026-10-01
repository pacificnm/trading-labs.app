import type { OptionContract, OptionsChain } from '../shared/options'
import { nyDate, nyToEpoch } from '../shared/nytime'

const SOURCE = 'Cboe delayed quotes'
const URL_BASE = 'https://cdn.cboe.com/api/global/delayed_quotes/options'
const MAX_DTE = 400

// Cboe lists index options under an underscore prefix.
const INDEX: Record<string, string> = { '^GSPC': '_SPX', '^SPX': '_SPX', '^NDX': '_NDX', '^RUT': '_RUT', '^VIX': '_VIX', '^DJI': '_DJX' }
export const cboeSymbol = (s: string) => INDEX[s.toUpperCase()] ?? s.toUpperCase()

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** OCC-style contract name: ROOT + YYMMDD + C/P + strike x 1000 (8 digits). */
export function parseContractName(name: string): { exp: string; type: 'C' | 'P'; strike: number } | null {
  if (name.length < 16) return null
  const tail = name.slice(-15)
  const m = /^(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/.exec(tail)
  return m ? { exp: `20${m[1]}-${m[2]}-${m[3]}`, type: m[4] as 'C' | 'P', strike: Number(m[5]) / 1000 } : null
}

/** Turns Cboe's raw JSON into a compact chain: nearby expirations only, bad IVs dropped. */
export function parseCboe(raw: unknown, symbol: string, nowSec = Math.floor(Date.now() / 1000)): OptionsChain {
  const d = (raw as { data?: Record<string, unknown> })?.data
  const list = d?.['options']
  if (!d || !Array.isArray(list)) throw new Error('Unexpected response from the options feed.')
  const price = num(d['current_price'])
  if (price == null) throw new Error('The options feed had no underlying price.')
  // calendar days from today (New York date) to the expiration date, so Sep 30 -> Oct 16 is 16
  const today = Date.parse(`${nyDate(nowSec)}T00:00:00Z`)
  const dteOf = (exp: string) => Math.max(0, Math.round((Date.parse(`${exp}T00:00:00Z`) - today) / 86400000))
  const contracts: OptionContract[] = []
  const expSet = new Set<string>()
  for (const o of list as Record<string, unknown>[]) {
    const p = parseContractName(String(o['option'] ?? ''))
    if (!p) continue
    if (dteOf(p.exp) > MAX_DTE || nyToEpoch(`${p.exp} 16:00:00`) < nowSec - 3600) continue // far-dated, or already expired
    const bid = num(o['bid']) ?? 0, ask = num(o['ask']) ?? 0, oi = num(o['open_interest']) ?? 0, volume = num(o['volume']) ?? 0
    if (bid === 0 && ask === 0 && oi === 0 && volume === 0) continue
    const ivRaw = num(o['iv'])
    const iv = ivRaw != null && ivRaw > 0 && ivRaw < 5 && (bid > 0 || ask > 0) ? ivRaw : null // deep ITM / expiring quotes report nonsense
    const last = num(o['last_trade_price'])
    contracts.push({ ...p, bid, ask, last: last && last > 0 ? last : null, volume, oi, iv, delta: num(o['delta']), gamma: num(o['gamma']), theta: num(o['theta']), vega: num(o['vega']), theo: num(o['theo']), change: num(o['change']) })
    expSet.add(p.exp)
  }
  if (contracts.length === 0) throw new Error(`No listed options found for ${symbol}.`)
  const iv30 = num(d['iv30'])
  return {
    symbol, price, change: num(d['price_change']), changePct: num(d['price_change_percent']), iv30: iv30 != null ? iv30 / 100 : null,
    fetchedAt: nowSec, expirations: [...expSet].sort().map((date) => ({ date, dte: dteOf(date) })), contracts, source: SOURCE
  }
}

/**
 * Fetches and caches option chains. The feed is delayed about 15 minutes, so a minute of caching costs nothing;
 * identical concurrent requests share one download (chains run from 2 to 13 MB).
 */
export function createOptionsClient(fetchImpl: typeof fetch = fetch, clock: () => number = () => Date.now()) {
  const cache = new Map<string, { at: number; chain: OptionsChain }>()
  const inflight = new Map<string, Promise<OptionsChain>>()
  return async function chain(symbolIn: string, opts: { force?: boolean; ttlMs?: number } = {}): Promise<OptionsChain> {
    const symbol = cboeSymbol(symbolIn.trim())
    if (!/^[A-Z0-9_.-]{1,12}$/.test(symbol)) throw new Error(`“${symbolIn}” is not a valid symbol.`)
    const hit = cache.get(symbol)
    if (hit && !opts.force && clock() - hit.at < (opts.ttlMs ?? 60_000)) return hit.chain
    let p = inflight.get(symbol)
    if (!p) {
      p = (async () => {
        let res: Response
        try { res = await fetchImpl(`${URL_BASE}/${symbol}.json`, { headers: { 'User-Agent': 'Mozilla/5.0 TradingLab', Accept: 'application/json' } }) }
        catch (e) { throw new Error(`Could not reach the options feed: ${(e as Error).message}`) }
        if (res.status === 403 || res.status === 404) throw new Error(`No listed options found for ${symbolIn.toUpperCase()}. It may not be optionable, or is not a US symbol.`)
        if (!res.ok) throw new Error(`The options feed returned HTTP ${res.status}.`)
        const parsed = parseCboe(await res.json(), symbolIn.toUpperCase(), Math.floor(clock() / 1000))
        cache.set(symbol, { at: clock(), chain: parsed })
        return parsed
      })().finally(() => inflight.delete(symbol))
      inflight.set(symbol, p)
    }
    try { return await p }
    catch (e) { if (hit) return hit.chain; throw e } // feed hiccup: keep showing the last good chain
  }
}
export type OptionsClient = ReturnType<typeof createOptionsClient>
