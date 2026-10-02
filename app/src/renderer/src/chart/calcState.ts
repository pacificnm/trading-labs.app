import { atr as atrSeries } from './indicators'
import { sampleCandles } from '../data/candles'
import { loadCandles } from '../data/fmp'
import type { CalcInput, StopSpec, TargetSpec, RiskSpec } from '../../../shared/position'

/** Everything the Calculator screen edits. Values are strings so half-typed numbers survive re-renders. */
export interface CalcState {
  symbol: string
  side: 'long' | 'short'
  followLive: boolean
  entry: string
  accountBasis: 'paper' | 'custom'
  customAccount: string
  riskMode: 'percent' | 'dollars'
  riskPct: string
  riskDollars: string
  stopMode: 'price' | 'percent' | 'atr'
  stopPrice: string
  stopPct: string
  stopAtr: string
  targetMode: 'none' | 'price' | 'percent' | 'r'
  targetPrice: string
  targetPct: string
  targetR: string
  winRate: string
  commission: string
}

export const DEFAULT_CALC: CalcState = {
  symbol: '', side: 'long', followLive: true, entry: '', accountBasis: 'paper', customAccount: '100000',
  riskMode: 'percent', riskPct: '1', riskDollars: '500', stopMode: 'atr', stopPrice: '', stopPct: '2', stopAtr: '1.5',
  targetMode: 'r', targetPrice: '', targetPct: '6', targetR: '2', winRate: '50', commission: '0'
}

const n = (s: string) => { const v = parseFloat(s); return Number.isFinite(v) ? v : NaN }

export interface CalcContext { last: number | null; atr: number | null; equity: number; buyingPower: number | null; investedNow: number }

export function toInput(c: CalcState, ctx: CalcContext): CalcInput {
  const entry = c.followLive ? ctx.last ?? NaN : n(c.entry)
  const stop: StopSpec = c.stopMode === 'price' ? { mode: 'price', price: n(c.stopPrice) } : c.stopMode === 'percent' ? { mode: 'percent', pct: n(c.stopPct) } : { mode: 'atr', mult: n(c.stopAtr) }
  const target: TargetSpec | null = c.targetMode === 'none' ? null : c.targetMode === 'price' ? { mode: 'price', price: n(c.targetPrice) } : c.targetMode === 'percent' ? { mode: 'percent', pct: n(c.targetPct) } : { mode: 'r', r: n(c.targetR) }
  const risk: RiskSpec = c.riskMode === 'percent' ? { mode: 'percent', pct: n(c.riskPct) } : { mode: 'dollars', dollars: n(c.riskDollars) }
  const custom = c.accountBasis === 'custom'
  const wr = n(c.winRate)
  return {
    side: c.side, entry, stop, target, risk, account: custom ? n(c.customAccount) : ctx.equity, buyingPower: custom ? null : ctx.buyingPower,
    investedNow: ctx.investedNow, atr: ctx.atr, winRate: Number.isFinite(wr) ? Math.max(0, Math.min(100, wr)) / 100 : null, commission: Math.max(0, n(c.commission) || 0)
  }
}

/** Latest price for a symbol (sample price when no market-data key is configured). */
export async function fetchLast(symbol: string, live: boolean): Promise<number | null> {
  if (!live) return sampleCandles(symbol, '1M', '1day').at(-1)?.close ?? null
  const r = await window.api.fmp.quotes([symbol])
  return r.ok && r.data[0] ? Number(r.data[0]['price']) || null : null
}

/** 14-day average true range from daily bars, so stops can be sized in ATRs. */
export async function fetchAtr(symbol: string, live: boolean): Promise<number | null> {
  try {
    const candles = live ? await loadCandles(symbol, '3M', '1day') : sampleCandles(symbol, '3M', '1day')
    const a = atrSeries(candles, 14)
    for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]
  } catch { /* ATR is optional */ }
  return null
}
