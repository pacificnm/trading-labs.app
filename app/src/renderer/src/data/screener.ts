import type { ScreenerQuery, ScreenerRow } from '../../../shared/fmp'

/** Everything the screen edits. Numbers are strings so half-typed values survive re-renders; blank means "no limit". */
export interface Filters {
  sector: string; industry: string; exchange: '' | 'NASDAQ' | 'NYSE' | 'AMEX'; country: string
  /** market cap in $ millions */
  capMin: string; capMax: string
  priceMin: string; priceMax: string
  /** shares per day */
  volumeMin: string
  betaMin: string; betaMax: string
  /** dividend yield in % (computed in the app: FMP gives dollars per share) */
  yieldMin: string
  /** today's volume divided by average volume (computed in the app) */
  relVolMin: string
  kind: 'stocks' | 'etfs' | 'both'
  active: boolean
  limit: number
}

export const DEFAULT_FILTERS: Filters = {
  sector: '', industry: '', exchange: '', country: 'US', capMin: '300', capMax: '', priceMin: '', priceMax: '', volumeMin: '200000', betaMin: '', betaMax: '',
  yieldMin: '', relVolMin: '', kind: 'stocks', active: true, limit: 250
}

const num = (s: string): number | undefined => { const v = parseFloat(s); return Number.isFinite(v) && v >= 0 ? v : undefined }
export const hasClientFilters = (f: Filters) => num(f.yieldMin) !== undefined || num(f.relVolMin) !== undefined

/** The part FMP can filter. When a client-side filter is on we pull a big batch so it has enough to work with. */
export function toQuery(f: Filters): ScreenerQuery {
  const cap = (m?: number) => (m === undefined ? undefined : m * 1_000_000)
  return {
    sector: f.sector || undefined, industry: f.industry || undefined, exchange: f.exchange || undefined, country: f.country || undefined,
    marketCapMoreThan: cap(num(f.capMin)), marketCapLowerThan: cap(num(f.capMax)), priceMoreThan: num(f.priceMin), priceLowerThan: num(f.priceMax),
    volumeMoreThan: num(f.volumeMin), betaMoreThan: num(f.betaMin), betaLowerThan: num(f.betaMax),
    isEtf: f.kind === 'etfs' ? true : f.kind === 'stocks' ? false : undefined, isFund: f.kind === 'both' ? undefined : false,
    isActivelyTrading: f.active ? true : undefined, limit: hasClientFilters(f) ? 3000 : f.limit
  }
}

export const relVolume = (r: ScreenerRow) => (r.volume != null && r.avgVolume ? r.volume / r.avgVolume : null)
/** annual dividend per share / price, in % */
export const dividendYield = (r: ScreenerRow) => (r.dividend != null && r.price ? (r.dividend / r.price) * 100 : null)

/** Filters FMP can't do (yield, relative volume) plus a safety net for the type filters. */
export function applyClientFilters(rows: ScreenerRow[], f: Filters): ScreenerRow[] {
  const y = num(f.yieldMin), rv = num(f.relVolMin)
  return rows.filter((r) =>
    (f.kind !== 'stocks' || (!r.isEtf && !r.isFund)) && (f.kind !== 'etfs' || r.isEtf) &&
    (y === undefined || (dividendYield(r) ?? -1) >= y) && (rv === undefined || (relVolume(r) ?? -1) >= rv))
}

export type SortKey = 'marketCap' | 'price' | 'volume' | 'relVol' | 'beta' | 'yield' | 'symbol' | 'name'
const val = (r: ScreenerRow, k: SortKey): number | string | null =>
  k === 'relVol' ? relVolume(r) : k === 'yield' ? dividendYield(r) : k === 'symbol' ? r.symbol : k === 'name' ? r.name.toLowerCase() : r[k]
/** Missing values always sort last. */
export function sortRows(rows: ScreenerRow[], key: SortKey, dir: 1 | -1): ScreenerRow[] {
  return [...rows].sort((a, b) => {
    const x = val(a, key), y = val(b, key)
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    return (x < y ? -1 : x > y ? 1 : 0) * dir
  })
}

export interface Preset { id: string; label: string; what: string; apply: Partial<Filters> }
export const PRESETS: Preset[] = [
  { id: 'large', label: 'Large-cap leaders', what: 'Companies worth $10B+ that trade at least 2 million shares a day: liquid and well covered.', apply: { capMin: '10000', capMax: '', volumeMin: '2000000' } },
  { id: 'dividend', label: 'Dividend payers', what: 'Established companies ($2B+) yielding at least 3% a year. Check payout safety before trusting a high yield.', apply: { capMin: '2000', capMax: '', yieldMin: '3', volumeMin: '300000' } },
  { id: 'volume', label: 'Unusual volume', what: 'Stocks trading at least twice their normal volume today: something is happening, so find out what.', apply: { capMin: '500', capMax: '', relVolMin: '2', volumeMin: '500000', priceMin: '5' } },
  { id: 'defensive', label: 'Low-beta defensives', what: 'Larger companies that historically move less than the market (beta under 0.8).', apply: { capMin: '5000', capMax: '', betaMax: '0.8', volumeMin: '500000' } },
  { id: 'growth', label: 'High-beta tech', what: 'Technology companies that swing more than the market (beta over 1.5): bigger moves both ways.', apply: { sector: 'Technology', capMin: '2000', capMax: '', betaMin: '1.5', volumeMin: '500000' } },
  { id: 'small', label: 'Liquid small caps', what: 'Companies between $300M and $2B that still trade enough shares to get in and out.', apply: { capMin: '300', capMax: '2000', volumeMin: '500000', priceMin: '5' } },
  { id: 'etf', label: 'Active ETFs', what: 'Exchange-traded funds trading at least a million shares a day.', apply: { kind: 'etfs', capMin: '', capMax: '', volumeMin: '1000000' } }
]
export const presetFilters = (p: Preset): Filters => ({ ...DEFAULT_FILTERS, capMin: '', volumeMin: '', ...p.apply })

export interface Summary { count: number; medianCap: number | null; sectors: { name: string; count: number }[]; exchanges: { name: string; count: number }[] }
export function summarize(rows: ScreenerRow[]): Summary {
  const caps = rows.map((r) => r.marketCap).filter((c): c is number => c != null).sort((a, b) => a - b)
  const tally = (key: 'sector' | 'exchange') => { const m = new Map<string, number>(); for (const r of rows) { const k = r[key] || 'Other'; m.set(k, (m.get(k) ?? 0) + 1) } return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) }
  return { count: rows.length, medianCap: caps.length ? caps[Math.floor(caps.length / 2)] : null, sectors: tally('sector').slice(0, 8), exchanges: tally('exchange') }
}

export const csv = (rows: ScreenerRow[]) =>
  ['Symbol,Name,Sector,Industry,Exchange,Market cap,Price,Volume,Avg volume,Rel volume,Beta,Dividend yield %']
    .concat(rows.map((r) => [r.symbol, `"${r.name.replace(/"/g, '""')}"`, r.sector, `"${r.industry}"`, r.exchange, r.marketCap ?? '', r.price ?? '', r.volume ?? '', r.avgVolume ?? '', relVolume(r)?.toFixed(2) ?? '', r.beta ?? '', dividendYield(r)?.toFixed(2) ?? ''].join(','))).join('\n')

/** The same filters in the names Claude's run_screener tool uses (market cap in $ millions). */
export function toToolArgs(f: Filters): Record<string, string | number | boolean> {
  const n = (v: string) => { const x = parseFloat(v); return Number.isFinite(x) ? x : undefined }
  const out: Record<string, string | number | boolean | undefined> = {
    sector: f.sector || undefined, industry: f.industry || undefined, exchange: f.exchange || undefined, country: f.country || undefined, type: f.kind,
    market_cap_min_millions: n(f.capMin), market_cap_max_millions: n(f.capMax), price_min: n(f.priceMin), price_max: n(f.priceMax), volume_min: n(f.volumeMin),
    beta_min: n(f.betaMin), beta_max: n(f.betaMax), dividend_yield_min: n(f.yieldMin), relative_volume_min: n(f.relVolMin), limit: 25
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean>
}
