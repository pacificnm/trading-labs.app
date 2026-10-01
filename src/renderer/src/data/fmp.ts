import { useEffect, useRef, useState } from 'react'
import type { Bar, FmpResult, Rec } from '../../../shared/fmp'
import { barCount, intervalInfo, type Interval, type Range } from '../chart/timeframe'
import { aggregate } from './candles'
import type { Candle } from '../chart/indicators'

export class DataError extends Error { constructor(message: string, public kind: string) { super(message) } }

export function unwrap<T>(r: FmpResult<T>): T {
  if (!r.ok) throw new DataError(r.error, r.kind)
  return r.data
}

/** Loads async data, keeping the previous value on screen while a new request runs. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: enabled })
  const seq = useRef(0)
  const run = () => {
    if (!enabled) return
    const id = ++seq.current
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then(
      (data) => id === seq.current && setState({ data, error: null, loading: false }),
      (e: Error) => id === seq.current && setState((s) => ({ data: s.data, error: e.message, loading: false }))
    )
  }
  useEffect(run, [...deps, enabled])
  return { ...state, reload: run }
}

const calendarDays = (range: Range): number => {
  const now = new Date()
  switch (range) {
    case '1D': return 5
    case '5D': return 9
    case '1M': return 35
    case '3M': return 100
    case '6M': return 190
    case 'YTD': return Math.ceil((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000) + 5
    case '1Y': return 370
    case '5Y': return 1830
    case 'MAX': return 7300
  }
}

export async function loadCandles(symbol: string, range: Range, interval: Interval): Promise<Candle[]> {
  const info = intervalInfo(interval)
  const weekMonth = interval === '1week' || interval === '1month'
  const days = calendarDays(range) + (weekMonth ? 45 : 0)
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const bars: Bar[] = unwrap(await window.api.fmp.bars({ symbol, interval: weekMonth || !info.intraday ? '1day' : (interval as never), from }))
  if (bars.length === 0) throw new DataError(`No price data returned for ${symbol}.`, 'other')
  const candles: Candle[] = weekMonth ? aggregate(bars, interval === '1week' ? 'week' : 'month') : bars
  return candles.slice(-barCount(range, interval))
}

// FMP fields vary a little by endpoint/version; take the first one present.
export const pick = (o: Rec | null | undefined, ...names: string[]): number | null => {
  if (!o) return null
  for (const n of names) { const v = o[n]; if (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) return Number(v) }
  return null
}
export const pickStr = (o: Rec | null | undefined, ...names: string[]): string => {
  if (!o) return ''
  for (const n of names) { const v = o[n]; if (v !== undefined && v !== null && v !== '') return String(v) }
  return ''
}
export const dash = (v: number | null, fmt: (n: number) => string) => (v == null ? '—' : fmt(v))
