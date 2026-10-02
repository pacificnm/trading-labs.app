export type FmpInterval = '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' | '1day'

export interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }

export type Rec = Record<string, unknown>

export type FmpResult<T> = { ok: true; data: T } | { ok: false; error: string; kind: 'nokey' | 'auth' | 'plan' | 'rate' | 'network' | 'other' }

export interface FmpSearchHit { symbol: string; name: string; exchange: string }

export interface FmpOverview {
  quote: Rec | null; profile: Rec | null
  /** quote-short: price, change, volume */
  quoteShort: Rec | null
  /** latest trade (price, size, time in ms) */
  afterTrade: Rec | null
  /** latest bid/ask with sizes */
  afterQuote: Rec | null
  /** % change over 1D, 5D, 1M ... max */
  priceChange: Rec | null
  /** when the oldest piece of this data was fetched (UTC seconds), for the "updated" label */
  asOf: number
}
export interface FmpAnalyst {
  consensus: Rec | null; targets: Rec | null; grades: Rec[]
  /** FMP's own quantitative rating (letter grade + 1-5 scores) */
  snapshot: Rec | null
  targetSummary: Rec | null
  /** daily rating history, newest first */
  ratingsHistory: Rec[]
  /** consensus estimates by fiscal year, newest first */
  estimates: Rec[]
  /** reported annual income statements, newest first (to compare with the estimates) */
  actuals: Rec[]
  asOf: number
}
export interface FmpFundamentals { ratios: Rec | null; metrics: Rec | null; income: Rec[]; balance: Rec[]; cashflow: Rec[] }

export interface FmpTestRow {
  name: string; path: string; ok: boolean; detail: string; fields?: string[]
  /** ok = data came back, empty = answered with nothing, plan = not in the user's FMP plan, error = anything else */
  status?: 'ok' | 'empty' | 'plan' | 'error'
  /** which plan capability this probe checks (see shared/fmpCaps.ts) */
  cap?: string
}

export interface NewsArticle {
  symbol: string
  title: string
  publisher: string
  site: string
  text: string
  url: string
  image: string
  /** UTC epoch seconds */
  time: number
}

/** Market-wide performance: sector and industry snapshots (per exchange, per day) plus today's movers. */
export interface FmpMarket {
  /** the trading day the snapshots are for (YYYY-MM-DD) */
  date: string
  exchange: string
  sectors: Rec[]
  industries: Rec[]
  sectorPe: Rec[]
  industryPe: Rec[]
  gainers: Rec[]
  losers: Rec[]
  actives: Rec[]
  asOf: number
}

/** One reported securities transaction by a member of Congress (Senate and House disclosures share a shape). */
export interface CongressTrade {
  chamber: 'senate' | 'house'
  /** FMP's member id, e.g. M000355 */
  memberId: string
  /** display name */
  member: string
  /** state (Senate) or district such as OK01 (House) */
  district: string
  /** Self, Spouse, Joint, Child or blank */
  owner: string
  symbol: string
  asset: string
  assetType: string
  /** Purchase, Sale, Sale (Partial), Exchange... */
  type: string
  /** disclosed as a range, e.g. "$15,001 - $50,000" */
  amount: string
  /** YYYY-MM-DD */
  disclosed: string
  traded: string
  link: string
}
export interface FmpCongress { trades: CongressTrade[]; asOf: number }

/** Filters FMP applies on its side (everything else is applied in the app). */
export interface ScreenerQuery {
  sector?: string; industry?: string; exchange?: string; country?: string
  marketCapMoreThan?: number; marketCapLowerThan?: number
  priceMoreThan?: number; priceLowerThan?: number
  volumeMoreThan?: number; betaMoreThan?: number; betaLowerThan?: number
  isEtf?: boolean; isFund?: boolean; isActivelyTrading?: boolean
  limit?: number
}
export interface ScreenerRow {
  symbol: string; name: string; marketCap: number | null; sector: string; industry: string; beta: number | null
  price: number | null; dividend: number | null; volume: number | null; avgVolume: number | null
  exchange: string; country: string; isEtf: boolean; isFund: boolean; active: boolean
}
export interface FmpScreener { rows: ScreenerRow[]; asOf: number }
export interface FmpScreenerOptions { sectors: string[]; industries: string[]; countries: string[] }
