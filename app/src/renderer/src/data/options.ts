import { historicalVol, type OptionsChain } from '../../../shared/options'
import { loadCandles } from './fmp'

export async function fetchChain(symbol: string, force = false): Promise<OptionsChain> {
  const r = await window.api.options.chain(symbol, force)
  if (!r.ok) throw new Error(r.error)
  return r.data
}

/** 30-day realised volatility from real daily closes, to compare with implied volatility. Null without market data: sample prices would make the comparison meaningless. */
export async function fetchHv30(symbol: string, live: boolean): Promise<number | null> {
  if (!live) return null
  try {
    const candles = await loadCandles(symbol, '3M', '1day')
    return historicalVol(candles.map((c) => c.close), 30)
  } catch { return null }
}
