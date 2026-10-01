import { useEffect, useMemo, useRef, useState } from 'react'
import { sampleCandles } from '../data/candles'
import { loadCandles, useAsync } from '../data/fmp'
import type { Candle } from './indicators'
import type { ChartSettings } from './settings'
import type { Drawing } from './drawings'

export const chartKey = (symbol: string, s: Pick<ChartSettings, 'range' | 'interval'>) => `${symbol}|${s.range}|${s.interval}`

/** Candles for the selected symbol/range/interval (real when an FMP key exists, sample otherwise). */
export function useChartData(symbol: string, settings: ChartSettings, live: boolean) {
  const key = chartKey(symbol, settings)
  const sample = useMemo(() => sampleCandles(symbol, settings.range, settings.interval), [key])
  const real = useAsync(async () => ({ key, candles: await loadCandles(symbol, settings.range, settings.interval) }), [key], live)
  const candles: Candle[] | null = live ? real.data?.candles ?? null : sample // never fake data once a feed is configured
  const loadedKey = live ? real.data?.key ?? null : key
  return { candles, loadedKey, loading: real.loading, error: live ? real.error : null, reload: real.reload }
}

/** Drawings for one symbol, persisted in SQLite. `update` applies synchronously via a ref. */
export function useDrawings(symbol: string) {
  const [state, setState] = useState<{ symbol: string; list: Drawing[] }>({ symbol, list: [] })
  const ref = useRef(state)
  const symRef = useRef(symbol)
  symRef.current = symbol
  useEffect(() => {
    let alive = true
    window.api.getSetting('drawings:' + symbol).then((d) => {
      if (!alive) return
      ref.current = { symbol, list: d ?? [] }
      setState(ref.current)
    })
    return () => { alive = false }
  }, [symbol])
  const update = (fn: (d: Drawing[]) => Drawing[]) => {
    const sym = symRef.current
    const next = fn(ref.current.symbol === sym ? ref.current.list : [])
    ref.current = { symbol: sym, list: next }
    setState(ref.current)
    window.api.setSetting('drawings:' + sym, next)
  }
  return { drawings: state.symbol === symbol ? state.list : [], ready: state.symbol === symbol, update }
}
