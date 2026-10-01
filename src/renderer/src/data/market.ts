import { pick, pickStr } from './fmp'
import type { FmpMarket, Rec } from '../../../shared/fmp'

export interface Sector { name: string; change: number | null; pe: number | null }
export interface Mover { symbol: string; name: string; price: number | null; change: number | null; pct: number | null; exchange: string }
export interface MarketModel { date: string; exchange: string; sectors: Sector[]; industries: Sector[]; gainers: Mover[]; losers: Mover[]; actives: Mover[]; asOf: number }

/** Joins each day's performance and P/E lists by name, best performer first. */
function join(perf: Rec[], pe: Rec[], key: 'sector' | 'industry'): Sector[] {
  const peBy = new Map(pe.map((r) => [pickStr(r, key), pick(r, 'pe')]))
  return perf
    .map((r) => ({ name: pickStr(r, key), change: pick(r, 'averageChange'), pe: peBy.get(pickStr(r, key)) ?? null }))
    .filter((s) => s.name)
    .sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity))
}
const movers = (rows: Rec[]): Mover[] => rows.map((r) => ({ symbol: pickStr(r, 'symbol'), name: pickStr(r, 'name'), price: pick(r, 'price'), change: pick(r, 'change'), pct: pick(r, 'changesPercentage', 'changePercentage'), exchange: pickStr(r, 'exchange') })).filter((m) => m.symbol)

export function buildMarket(m: FmpMarket): MarketModel {
  return { date: m.date, exchange: m.exchange, sectors: join(m.sectors, m.sectorPe, 'sector'), industries: join(m.industries, m.industryPe, 'industry'), gainers: movers(m.gainers), losers: movers(m.losers), actives: movers(m.actives), asOf: m.asOf }
}

export interface MoverFilter { minPrice: number; hideFunds: boolean; exchange: 'all' | 'NASDAQ' | 'NYSE' | 'AMEX' }
export const DEFAULT_MOVER_FILTER: MoverFilter = { minPrice: 5, hideFunds: true, exchange: 'all' }

/** Mutual-fund tickers (four letters ending in X) and anything named like an ETF, fund or trust. */
export const isFund = (m: Mover) => /^[A-Z]{4}X$/.test(m.symbol) || /\b(ETF|ETN|Fund|Funds|Trust|Portfolio)\b/i.test(m.name)

export function filterMovers(list: Mover[], f: MoverFilter, limit = 12): Mover[] {
  return list.filter((m) => (m.price ?? 0) >= f.minPrice && (!f.hideFunds || !isFund(m)) && (f.exchange === 'all' || m.exchange === f.exchange)).slice(0, limit)
}
