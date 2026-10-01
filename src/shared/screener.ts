import type { Rec, ScreenerRow } from './fmp'

/** One row of FMP's company-screener response. */
export function normalizeScreenerRow(r: Rec): ScreenerRow {
  const n = (k: string) => { const v = r[k]; return v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v) }
  const s = (k: string) => (r[k] == null ? '' : String(r[k]))
  return {
    symbol: s('symbol'), name: s('companyName'), marketCap: n('marketCap'), sector: s('sector'), industry: s('industry'), beta: n('beta'), price: n('price'),
    dividend: n('lastAnnualDividend'), volume: n('volume'), avgVolume: n('avgVolume'), exchange: s('exchangeShortName') || s('exchange'), country: s('country'),
    isEtf: r['isEtf'] === true, isFund: r['isFund'] === true, active: r['isActivelyTrading'] !== false
  }
}
