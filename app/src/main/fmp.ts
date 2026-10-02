import { BrowserWindow, ipcMain } from 'electron'
import type { Secrets } from './secrets'
import { nyToEpoch, nyDate, nyParts } from '../shared/nytime'
import { normalizeTrade } from '../shared/congress'
import { normalizeScreenerRow } from '../shared/screener'
import type { DatabaseSync } from 'node:sqlite'
import { ResponseCache, createRequester, newCtx, type Ctx } from './fmpCache'
import { fillGrain, type CapId, type FillGrain, type FmpCaps } from '../shared/fmpCaps'
import { readCaps as loadCaps, saveCaps } from './capsStore'

// FMP doesn't say which time zone news timestamps use. Read them as New York time first; if that puts a
// brand-new article in the future they must be UTC, and the reading sticks for the rest of the session.
let newsIsUtc = false
function parseNewsTimes(dates: string[]): number[] {
  const asUtc = (d: string) => Date.parse(d.replace(' ', 'T') + 'Z') / 1000
  const asNy = (d: string) => nyToEpoch(d)
  const now = Date.now() / 1000
  if (!newsIsUtc && dates.some((d) => asNy(d) > now + 300)) newsIsUtc = true
  return dates.map((d) => (newsIsUtc ? asUtc(d) : asNy(d)))
}
import type { FmpScreener, FmpScreenerOptions, ScreenerQuery, ScreenerRow, CongressTrade, FmpCongress, FmpMarket, NewsArticle, Bar, FmpAnalyst, FmpFundamentals, FmpInterval, FmpOverview, FmpResult, FmpSearchHit, FmpTestRow, Rec } from '../shared/fmp'

// FMP_BASE_URL points the app at a stand-in server for screenshots and tests (see CLAUDE.md)
const BASE = process.env['FMP_BASE_URL'] ?? 'https://financialmodelingprep.com/stable'
const KEY_NAME = 'fmp_key'

class FmpError extends Error {
  constructor(message: string, public kind: Extract<FmpResult<never>, { ok: false }>['kind']) { super(message) }
}

const CHUNK_DAYS: Record<string, number> = { '1min': 5, '5min': 30, '15min': 90, '30min': 180, '1hour': 365, '4hour': 730 }
const day = (d: Date) => d.toISOString().slice(0, 10)

export function registerFmp(secrets: Secrets, db: DatabaseSync | null = null) {
  const store = new ResponseCache(db)
  let noteRefusal: () => void = () => undefined
  const key = () => secrets.get(KEY_NAME) ?? process.env['FMP_API_KEY'] ?? null

  // One network call. Caching, merging of identical requests and stale-on-error live in createRequester.
  async function fetchJson(path: string, params: Record<string, string | number>): Promise<unknown> {
    const k = key()
    if (!k) throw new FmpError('No FMP API key. Add one in File → Settings.', 'nokey')
    const qs = new URLSearchParams(Object.entries(params).map(([a, b]) => [a, String(b)]))
    let res: Response
    try { res = await fetch(`${BASE}/${path}?${qs}&apikey=${encodeURIComponent(k)}`) }
    catch (e) { throw new FmpError(`Network error: ${(e as Error).message}`, 'network') }
    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text }
    const apiMsg = typeof body === 'object' && body && !Array.isArray(body) ? String((body as Rec)['Error Message'] ?? (body as Rec)['message'] ?? '') : typeof body === 'string' ? body.slice(0, 200) : ''
    if (res.status === 401 || /invalid api key/i.test(apiMsg)) throw new FmpError('FMP rejected the API key.', 'auth')
    if (res.status === 402 || res.status === 403 || /not available under your current subscription|upgrade/i.test(apiMsg)) { noteRefusal(); throw new FmpError(apiMsg || 'Not included in your FMP plan.', 'plan') }
    if (res.status === 429) throw new FmpError('FMP rate limit reached. Try again shortly.', 'rate')
    if (!res.ok) throw new FmpError(apiMsg || `FMP returned HTTP ${res.status}`, 'other')
    if (apiMsg && !Array.isArray(body)) throw new FmpError(apiMsg, 'other')
    return body
  }
  const request = createRequester(store, fetchJson, (e) => e instanceof FmpError && (e.kind === 'network' || e.kind === 'rate' || e.kind === 'other'))

  /** `ttl` overrides the per-endpoint lifetime (see fmpCache.ttlFor); `ctx` collects the data's age and can force a refresh. */
  const rows = async (path: string, params: Record<string, string | number>, ttl?: number, ctx?: Ctx): Promise<Rec[]> => {
    const v = await request(path, params, { ttl, ctx })
    return Array.isArray(v) ? (v as Rec[]) : []
  }
  const first = async (path: string, params: Record<string, string | number>, ttl?: number, ctx?: Ctx): Promise<Rec | null> => (await rows(path, params, ttl, ctx))[0] ?? null
  // a section failing (e.g. not in plan) shouldn't blank the whole screen
  const soft = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn() } catch (e) { if (e instanceof FmpError && (e.kind === 'auth' || e.kind === 'nokey' || e.kind === 'network')) throw e; return fallback }
  }
  const asOfSec = (ctx: Ctx) => (Number.isFinite(ctx.asOf) ? Math.floor(ctx.asOf / 1000) : Math.floor(Date.now() / 1000))

  const num = (v: unknown) => Number(v)
  async function bars(symbol: string, interval: FmpInterval, from: string, to: string, ttl?: number): Promise<Bar[]> {
    const intraday = interval !== '1day'
    const windows: [string, string][] = []
    if (!intraday) windows.push([from, to])
    else {
      const step = CHUNK_DAYS[interval] * 86400000
      for (let s = new Date(from).getTime(); s <= new Date(to).getTime(); s += step + 86400000) windows.push([day(new Date(s)), day(new Date(Math.min(s + step, new Date(to).getTime())))])
    }
    const all: Bar[] = []
    for (let i = 0; i < windows.length; i += 4) {
      const part = await Promise.all(windows.slice(i, i + 4).map(([f, t]) =>
        rows(intraday ? `historical-chart/${interval}` : 'historical-price-eod/full', { symbol, from: f, to: t }, ttl)))
      for (const list of part) for (const r of list) {
        const d = String(r['date'] ?? '')
        const time = intraday ? nyToEpoch(d) : Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 1000
        const bar = { time, open: num(r['open']), high: num(r['high']), low: num(r['low']), close: num(r['close']), volume: num(r['volume'] ?? 0) }
        if (Number.isFinite(time) && Number.isFinite(bar.close)) all.push(bar)
      }
    }
    all.sort((a, b) => a.time - b.time)
    return all.filter((b, i) => i === 0 || b.time !== all[i - 1].time)
  }

  const wrap = <A extends unknown[], T>(channel: string, fn: (...a: A) => Promise<T>) =>
    ipcMain.handle(channel, async (_e, ...args: A): Promise<FmpResult<T>> => {
      try { return { ok: true, data: await fn(...args) } }
      catch (e) {
        if (e instanceof FmpError) return { ok: false, error: e.message, kind: e.kind }
        return { ok: false, error: (e as Error).message, kind: 'other' }
      }
    })

  ipcMain.handle('fmp:key:status', () => secrets.status(KEY_NAME, 'FMP_API_KEY'))
  ipcMain.handle('fmp:key:set', (_e, k: string) => { store.clear(); secrets.set(KEY_NAME, k); writeCaps(null); checkSoon(1_000) })
  ipcMain.handle('fmp:key:clear', () => { store.clear(); secrets.clear(KEY_NAME); writeCaps(null) })
  ipcMain.handle('fmp:cache:stats', () => store.stats())
  ipcMain.handle('fmp:cache:clear', () => { store.clear() })

  wrap('fmp:bars', (p: { symbol: string; interval: FmpInterval; from: string; to?: string }) => bars(p.symbol, p.interval, p.from, p.to ?? day(new Date())))
  wrap('fmp:quotes', async (symbols: string[]) => {
    const out = await Promise.all(symbols.map((s) => soft(() => first('quote', { symbol: s }), null)))
    return out.filter((q): q is Rec => !!q)
  })
  wrap('fmp:search', async (q: string): Promise<FmpSearchHit[]> => {
    const [a, b] = await Promise.all([soft(() => rows('search-symbol', { query: q, limit: 8 }), []), soft(() => rows('search-name', { query: q, limit: 8 }), [])])
    const seen = new Set<string>()
    return [...a, ...b].flatMap((r) => {
      const symbol = String(r['symbol'] ?? '')
      if (!symbol || seen.has(symbol)) return []
      seen.add(symbol)
      return [{ symbol, name: String(r['name'] ?? ''), exchange: String(r['exchange'] ?? r['exchangeFullName'] ?? '') }]
    }).slice(0, 10)
  })
  // Company news (one or several symbols) or the general market feed.
  wrap('fmp:news', async (p: { symbol?: string; symbols?: string[]; general?: boolean; limit?: number; page?: number }): Promise<NewsArticle[]> => {
    const limit = Math.max(1, Math.min(50, Math.floor(p.limit ?? 30)))
    const page = Math.max(0, Math.floor(p.page ?? 0))
    let list: Rec[]
    if (p.general) list = await rows('news/general-latest', { limit, page })
    else {
      const syms = (p.symbols?.length ? p.symbols : [p.symbol ?? '']).map((x) => x.trim().toUpperCase()).filter((x) => /^[A-Z0-9.^=-]{1,15}$/.test(x)).slice(0, 30)
      if (syms.length === 0) return []
      list = await rows('news/stock', { symbols: syms.join(','), limit, page })
    }
    const str = (r: Rec, k: string) => (r[k] == null ? '' : String(r[k]))
    const times = parseNewsTimes(list.map((r) => str(r, 'publishedDate')))
    return list.map((r, i) => ({
      symbol: str(r, 'symbol') || (p.general ? '' : p.symbol ?? ''), title: str(r, 'title'), publisher: str(r, 'publisher') || str(r, 'site'), site: str(r, 'site'),
      text: str(r, 'text'), url: str(r, 'url'), image: str(r, 'image'), time: times[i]
    })).filter((a) => a.title && Number.isFinite(a.time))
  })
  wrap('fmp:overview', async (symbol: string, force?: boolean): Promise<FmpOverview> => {
    const ctx = newCtx(force)
    const [quote, profile, quoteShort, afterTrade, afterQuote, priceChange] = await Promise.all([
      first('quote', { symbol }, undefined, ctx),
      soft(() => first('profile', { symbol }, undefined, ctx), null),
      soft(() => first('quote-short', { symbol }, undefined, ctx), null),
      soft(() => first('aftermarket-trade', { symbol }, undefined, ctx), null),
      soft(() => first('aftermarket-quote', { symbol }, undefined, ctx), null),
      soft(() => first('stock-price-change', { symbol }, undefined, ctx), null)
    ])
    return { quote, profile, quoteShort, afterTrade, afterQuote, priceChange, asOf: asOfSec(ctx) }
  })
  wrap('fmp:analyst', async (symbol: string, force?: boolean): Promise<FmpAnalyst> => {
    const ctx = newCtx(force)
    const [consensus, targets, grades, snapshot, targetSummary, ratingsHistory, estimates, actuals] = await Promise.all([
      soft(() => first('grades-consensus', { symbol }, undefined, ctx), null),
      soft(() => first('price-target-consensus', { symbol }, undefined, ctx), null),
      soft(() => rows('grades', { symbol, limit: 15 }, undefined, ctx), []),
      soft(() => first('ratings-snapshot', { symbol }, undefined, ctx), null),
      soft(() => first('price-target-summary', { symbol }, undefined, ctx), null),
      soft(() => rows('ratings-historical', { symbol, limit: 260 }, undefined, ctx), []),
      soft(() => rows('analyst-estimates', { symbol, period: 'annual', page: 0, limit: 10 }, undefined, ctx), []),
      soft(() => rows('income-statement', { symbol, period: 'annual', limit: 4 }, undefined, ctx), [])
    ])
    return { consensus, targets, grades, snapshot, targetSummary, ratingsHistory, estimates, actuals, asOf: asOfSec(ctx) }
  })
  // Sector/industry performance and P/E for one trading day, plus the current biggest movers.
  wrap('fmp:market', async (p: { date?: string; exchange?: string; force?: boolean } = {}): Promise<FmpMarket> => {
    const ctx = newCtx(p.force)
    const exchange = ['NASDAQ', 'NYSE', 'AMEX'].includes(String(p.exchange)) ? String(p.exchange) : 'NASDAQ'
    const step = (d: string, by: number) => new Date(Date.parse(d + 'T12:00:00Z') + by * 86400000).toISOString().slice(0, 10)
    const weekend = (d: string) => { const w = new Date(d + 'T12:00:00Z').getUTCDay(); return w === 0 || w === 6 }
    let date = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? '') ? p.date! : nyDate(Date.now() / 1000)
    while (!p.date && weekend(date)) date = step(date, -1)
    let sectors = await rows('sector-performance-snapshot', { date, exchange }, undefined, ctx)
    // before the open, on a holiday, or on a chosen non-trading day there is nothing yet: use the last day that has data
    for (let i = 0; i < 5 && sectors.length === 0; i++) { date = step(date, -1); while (weekend(date)) date = step(date, -1); sectors = await rows('sector-performance-snapshot', { date, exchange }, undefined, ctx) }
    const [industries, sectorPe, industryPe, gainers, losers, actives] = await Promise.all([
      soft(() => rows('industry-performance-snapshot', { date, exchange }, undefined, ctx), []),
      soft(() => rows('sector-pe-snapshot', { date, exchange }, undefined, ctx), []),
      soft(() => rows('industry-pe-snapshot', { date, exchange }, undefined, ctx), []),
      soft(() => rows('biggest-gainers', {}, undefined, ctx), []),
      soft(() => rows('biggest-losers', {}, undefined, ctx), []),
      soft(() => rows('most-actives', {}, undefined, ctx), [])
    ])
    return { date, exchange, sectors, industries, sectorPe, industryPe, gainers, losers, actives, asOf: asOfSec(ctx) }
  })
  // Senate / House financial disclosures: the latest filings, one symbol, or one member's history.
  wrap('fmp:congress', async (p: { kind: 'latest' | 'symbol' | 'name'; chamber: 'senate' | 'house' | 'both'; symbol?: string; name?: string; page?: number; limit?: number; force?: boolean }): Promise<FmpCongress> => {
    const ctx = newCtx(p.force)
    const chambers: ('senate' | 'house')[] = p.chamber === 'both' ? ['senate', 'house'] : [p.chamber === 'house' ? 'house' : 'senate']
    const symbol = (p.symbol ?? '').trim().toUpperCase(), name = (p.name ?? '').trim()
    if (p.kind === 'symbol' && !/^[A-Z0-9.^=-]{1,15}$/.test(symbol)) throw new FmpError('Enter a valid ticker symbol.', 'other')
    if (p.kind === 'name' && name.length < 2) throw new FmpError('Enter at least two letters of a first or last name.', 'other')
    const one = async (ch: 'senate' | 'house'): Promise<CongressTrade[]> => {
      const list = p.kind === 'latest' ? await rows(`${ch}-latest`, { page: Math.max(0, Math.floor(p.page ?? 0)), limit: Math.max(1, Math.min(100, Math.floor(p.limit ?? 100))) }, undefined, ctx)
        : p.kind === 'symbol' ? await rows(`${ch}-trades`, { symbol }, undefined, ctx) : await rows(`${ch}-trades-by-name`, { name }, undefined, ctx)
      return list.map((r) => normalizeTrade(ch, r))
    }
    const settled = await Promise.allSettled(chambers.map(one))
    const ok = settled.filter((x): x is PromiseFulfilledResult<CongressTrade[]> => x.status === 'fulfilled')
    if (ok.length === 0) throw (settled[0] as PromiseRejectedResult).reason // e.g. not in the plan, or the key is bad
    const trades = ok.flatMap((x) => x.value).sort((a, b) => (b.disclosed + b.traded).localeCompare(a.disclosed + a.traded))
    return { trades, asOf: asOfSec(ctx) }
  })
  // Stock screener: FMP filters, sorted by market cap (descending) with no other sort option.
  wrap('fmp:screener', async (p: { query: ScreenerQuery; force?: boolean }): Promise<FmpScreener> => {
    const ctx = newCtx(p.force)
    const q = p.query ?? {}
    const params: Record<string, string | number> = { limit: Math.max(1, Math.min(3000, Math.floor(q.limit ?? 250))) }
    const text = (k: 'sector' | 'industry' | 'exchange' | 'country') => { const v = (q[k] ?? '').trim(); if (v && v.length <= 60 && /^[\w &.,'/()-]+$/.test(v)) params[k] = v }
    text('sector'); text('industry'); text('exchange'); text('country')
    const num = (k: keyof ScreenerQuery) => { const v = q[k]; if (typeof v === 'number' && Number.isFinite(v) && v >= 0) params[k] = v }
    for (const k of ['marketCapMoreThan', 'marketCapLowerThan', 'priceMoreThan', 'priceLowerThan', 'volumeMoreThan', 'betaMoreThan', 'betaLowerThan'] as const) num(k)
    for (const k of ['isEtf', 'isFund', 'isActivelyTrading'] as const) if (typeof q[k] === 'boolean') params[k] = String(q[k])
    const list = await rows('company-screener', params, undefined, ctx)
    const out: ScreenerRow[] = list.map(normalizeScreenerRow).filter((r) => r.symbol)
    return { rows: out, asOf: asOfSec(ctx) }
  })
  wrap('fmp:screenerOptions', async (): Promise<FmpScreenerOptions> => {
    const list = async (path: string, key: string) => (await soft(() => rows(path, {}, undefined), [])).map((r) => String(r[key] ?? '')).filter(Boolean)
    const [sectors, industries, countries] = await Promise.all([list('available-sectors', 'sector'), list('available-industries', 'industry'), list('available-countries', 'country')])
    return { sectors: sectors.sort(), industries: industries.sort(), countries: countries.sort((a, b) => (a === 'US' ? -1 : b === 'US' ? 1 : a.localeCompare(b))) }
  })
  wrap('fmp:fundamentals', async (symbol: string): Promise<FmpFundamentals> => ({
    ratios: await soft(() => first('ratios-ttm', { symbol }), null),
    metrics: await soft(() => first('key-metrics-ttm', { symbol }), null),
    income: await soft(() => rows('income-statement', { symbol, period: 'annual', limit: 4 }), []),
    balance: await soft(() => rows('balance-sheet-statement', { symbol, period: 'annual', limit: 4 }), []),
    cashflow: await soft(() => rows('cash-flow-statement', { symbol, period: 'annual', limit: 4 }), [])
  }))

  // Probes each endpoint the app uses so plan coverage and field names can be checked.
  const runProbes = async (): Promise<{ rows: FmpTestRow[]; aborted: boolean }> => {
    const to = day(new Date()), from = day(new Date(Date.now() - 7 * 86400000))
    const lastWeekday = () => { let t = Date.now() / 1000 - 86400; while ([0, 6].includes(nyParts(t).weekday)) t -= 86400; return nyDate(t) } // yesterday or earlier: always has a full session
    const probes: [string, string, Record<string, string | number>, CapId][] = [
      ['Quote', 'quote', { symbol: 'AAPL' }, 'quotes'],
      ['Index quote', 'quote', { symbol: '^GSPC' }, 'indices'],
      ['Daily history', 'historical-price-eod/full', { symbol: 'AAPL', from, to }, 'daily'],
      ['1-minute bars', 'historical-chart/1min', { symbol: 'AAPL', from, to }, 'bars1min'],
      ['5-minute bars', 'historical-chart/5min', { symbol: 'AAPL', from, to }, 'bars5min'],
      ['15-minute bars', 'historical-chart/15min', { symbol: 'AAPL', from, to }, 'bars15min'],
      ['30-minute bars', 'historical-chart/30min', { symbol: 'AAPL', from, to }, 'bars30min'],
      ['1-hour bars', 'historical-chart/1hour', { symbol: 'AAPL', from, to }, 'bars1hour'],
      ['4-hour bars', 'historical-chart/4hour', { symbol: 'AAPL', from, to }, 'bars4hour'],
      ['Symbol search', 'search-symbol', { query: 'AAPL', limit: 3 }, 'search'],
      ['Stock news', 'news/stock', { symbols: 'AAPL', limit: 3 }, 'news'],
      ['General market news', 'news/general-latest', { limit: 3 }, 'marketNews'],
      ['Company profile', 'profile', { symbol: 'AAPL' }, 'profile'],
      ['Analyst consensus', 'grades-consensus', { symbol: 'AAPL' }, 'analyst'],
      ['Price targets', 'price-target-consensus', { symbol: 'AAPL' }, 'analyst'],
      ['Analyst grades', 'grades', { symbol: 'AAPL', limit: 3 }, 'analyst'],
      ['Short quote', 'quote-short', { symbol: 'AAPL' }, 'quotes'],
      ['Aftermarket trade', 'aftermarket-trade', { symbol: 'AAPL' }, 'aftermarket'],
      ['Aftermarket quote', 'aftermarket-quote', { symbol: 'AAPL' }, 'aftermarket'],
      ['Price change', 'stock-price-change', { symbol: 'AAPL' }, 'quotes'],
      ['Sector performance', 'sector-performance-snapshot', { date: lastWeekday(), exchange: 'NASDAQ' }, 'sectors'],
      ['Biggest gainers', 'biggest-gainers', {}, 'movers'],
      ['Stock screener', 'company-screener', { marketCapMoreThan: 10000000000, limit: 3 }, 'screener'],
      ['Senate disclosures', 'senate-latest', { page: 0, limit: 3 }, 'congress'],
      ['House disclosures', 'house-latest', { page: 0, limit: 3 }, 'congress'],
      ['Senate trades by symbol', 'senate-trades', { symbol: 'AAPL' }, 'congress'],
      ['Ratings snapshot', 'ratings-snapshot', { symbol: 'AAPL' }, 'analyst'],
      ['Price target summary', 'price-target-summary', { symbol: 'AAPL' }, 'analyst'],
      ['Ratings history', 'ratings-historical', { symbol: 'AAPL', limit: 3 }, 'analyst'],
      ['Analyst estimates', 'analyst-estimates', { symbol: 'AAPL', period: 'annual', page: 0, limit: 5 }, 'estimates'],
      ['Ratios (TTM)', 'ratios-ttm', { symbol: 'AAPL' }, 'fundamentals'],
      ['Key metrics (TTM)', 'key-metrics-ttm', { symbol: 'AAPL' }, 'fundamentals'],
      ['Income statement', 'income-statement', { symbol: 'AAPL', period: 'annual', limit: 2 }, 'fundamentals'],
      ['Balance sheet', 'balance-sheet-statement', { symbol: 'AAPL', period: 'annual', limit: 2 }, 'fundamentals'],
      ['Cash flow', 'cash-flow-statement', { symbol: 'AAPL', period: 'annual', limit: 2 }, 'fundamentals']
    ]
    const out: FmpTestRow[] = []
    let aborted = false
    for (const [name, path, params, cap] of probes) {
      try {
        const v = await request(path, params, { ctx: newCtx(true) })
        const list = Array.isArray(v) ? (v as Rec[]) : []
        out.push({ name, path, cap, ok: list.length > 0, status: list.length ? 'ok' : 'empty', detail: list.length ? `${list.length} record${list.length === 1 ? '' : 's'}` : 'Empty response', fields: list[0] ? Object.keys(list[0]) : undefined })
      } catch (e) {
        out.push({ name, path, cap, ok: false, status: e instanceof FmpError && e.kind === 'plan' ? 'plan' : 'error', detail: (e as Error).message })
        if (e instanceof FmpError && (e.kind === 'auth' || e.kind === 'nokey' || e.kind === 'network')) { aborted = true; break }
      }
    }
    return { rows: out, aborted }
  }

  // The result of the last check, kept so screens and tools can leave out what the plan does not include.
  const readCaps = (): FmpCaps | null => loadCaps(db)
  const writeCaps = (caps: FmpCaps | null) => {
    saveCaps(db, caps)
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send('fmp:caps:changed', caps)
  }
  /** A capability is missing only when every probe for it was refused by the plan; an empty answer still counts as available. */
  const capsFromRows = (rows: FmpTestRow[]): FmpCaps => {
    const byCap = new Map<string, FmpTestRow[]>()
    for (const r of rows) if (r.cap) byCap.set(r.cap, [...(byCap.get(r.cap) ?? []), r])
    const unavailable = [...byCap].filter(([, rs]) => rs.every((r) => r.status === 'plan')).map(([c]) => c as CapId)
    return { checkedAt: Math.floor(Date.now() / 1000), unavailable }
  }
  let probing: Promise<FmpTestRow[] | null> | null = null
  /** Runs the plan check and stores the outcome. Joins a check already in progress instead of starting a second. */
  const checkPlan = (): Promise<FmpTestRow[] | null> => {
    if (!key()) return Promise.resolve(null)
    probing ??= runProbes().then(({ rows, aborted }) => { if (!aborted) writeCaps(capsFromRows(rows)); return rows }).catch(() => null).finally(() => { probing = null })
    return probing
  }
  let lastCheckStart = 0
  const checkSoon = (ms: number) => setTimeout(() => { lastCheckStart = Date.now(); void checkPlan() }, ms)
  // An endpoint refused for plan reasons usually means the plan changed (or was never checked). Re-check, but not more than every 10 minutes:
  // one refused request can also be about a single symbol, so a lone error never switches a feature off by itself.
  noteRefusal = () => { if (!probing && Date.now() - lastCheckStart > 10 * 60_000) checkSoon(1_500) }
  if (key() && !readCaps()) checkSoon(6_000)

  ipcMain.handle('fmp:caps:get', () => readCaps())
  wrap('fmp:test', async (): Promise<FmpTestRow[]> => {
    lastCheckStart = Date.now()
    const rows = await checkPlan()
    if (!rows) throw new FmpError('No FMP API key. Add one in File → Settings.', 'nokey')
    return rows
  })

  // used by the paper-trading engine
  return {
    async quote(symbol: string): Promise<number | null> {
      const q = await first('quote', { symbol }, 8_000)
      const v = Number(q?.['price'])
      return Number.isFinite(v) && v > 0 ? v : null
    },
    /** What the plan allows for filling working orders: 1-minute bars if included, otherwise the finest it has. */
    grain: (): FillGrain | null => fillGrain(readCaps()?.unavailable ?? []),
    /** Bars of the current grain from `fromEpoch` (UTC seconds) until now, ascending. Looks back at most 10 days. */
    async barsFine(symbol: string, fromEpoch: number): Promise<Bar[]> {
      const g = fillGrain(readCaps()?.unavailable ?? [])
      if (!g) return []
      const floor = Date.now() / 1000 - 10 * 86400
      const start = Math.max(fromEpoch, floor)
      const boundary = Math.floor((start - g.offset) / g.seconds) * g.seconds + g.offset
      const all = await bars(symbol, g.interval, nyDate(start), day(new Date()), 15_000)
      return all.filter((b) => b.time >= boundary)
    },
    caps: readCaps
  }
}
