import { useEffect, useMemo, useRef, useState } from 'react'
import { sampleCandles } from '../data/candles'
import { loadCandles, refreshCandles, refreshEveryMs, useAsync } from '../data/fmp'
import { isMarketOpen } from '../../../shared/nytime'
import { chartBridge } from './bridge'
import type { Candle } from './indicators'
import type { ChartSettings } from './settings'
import type { Drawing } from './drawings'

export const chartKey = (symbol: string, s: Pick<ChartSettings, 'range' | 'interval'>) => `${symbol}|${s.range}|${s.interval}`

// The regular session, plus a few minutes after the close so the last bars are picked up
const sessionActive = (ms: number) => isMarketOpen(ms / 1000) || isMarketOpen(ms / 1000 - 180)

/**
 * Candles for the selected symbol/range/interval (real when an FMP key exists, sample otherwise).
 * While the market is open and the window is visible, the latest bars are re-read on a timer that depends on the interval.
 */
export function useChartData(symbol: string, settings: ChartSettings, live: boolean) {
  const key = chartKey(symbol, settings)
  const sample = useMemo(() => sampleCandles(symbol, settings.range, settings.interval), [key])
  const real = useAsync(async () => ({ key, candles: await loadCandles(symbol, settings.range, settings.interval) }), [key], live)
  // a refreshed copy belongs to the load it was made from; a new load (symbol, range, interval or Retry) starts clean
  const [fresh, setFresh] = useState<{ from: unknown; candles: Candle[] } | null>(null)
  const [checkedAt, setCheckedAt] = useState<number | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const shown = live ? (fresh && fresh.from === real.data ? fresh.candles : real.data?.candles ?? null) : sample
  const shownRef = useRef<Candle[] | null>(shown)
  shownRef.current = shown
  const loadedKey = live ? real.data?.key ?? null : key

  useEffect(() => {
    if (real.data) { setCheckedAt(Date.now()); setRefreshError(null) }
  }, [real.data])

  useEffect(() => {
    if (!live || !real.data || real.data.key !== key) return
    const base = real.data
    const every = refreshEveryMs(settings.interval)
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let last = Date.now()
    const tick = async () => {
      if (stopped) return
      last = Date.now()
      let wait = every
      if (document.visibilityState === 'visible' && sessionActive(last)) {
        if (chartBridge.busy?.()) wait = 5000 // mid-drawing or dragging: do not rebuild the chart under the user's hand
        else {
          try {
            const next = await refreshCandles(symbol, settings.range, settings.interval, shownRef.current ?? base.candles)
            if (stopped) return
            if (next) setFresh({ from: base, candles: next })
            setCheckedAt(Date.now()); setRefreshError(null)
          } catch (e) {
            if (!stopped) setRefreshError(e instanceof Error ? e.message : 'Update failed')
          }
        }
      }
      if (!stopped) timer = setTimeout(tick, wait)
    }
    timer = setTimeout(tick, every)
    // coming back to the window after a while: catch up now instead of waiting out the timer
    const onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - last >= every) { clearTimeout(timer); tick() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [key, live, real.data])

  return { candles: shown, loadedKey, loading: real.loading, error: live ? real.error : null, reload: real.reload, checkedAt: live ? checkedAt : null, refreshError: live ? refreshError : null }
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
