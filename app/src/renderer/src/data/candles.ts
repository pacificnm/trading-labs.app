import type { Candle } from '../chart/indicators'
import { barCount, intervalInfo, tradingDays, type Interval, type Range } from '../chart/timeframe'
import { rng } from './sample'

// Synthetic candles, used only while no FMP key is configured.
const SESSION_MIN = 390
const OPEN_UTC_MIN = 13 * 60 + 30 // 09:30 New York, ignoring DST

function weekdaysBack(count: number): number[] {
  const days: number[] = []
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  while (days.length < count) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.unshift(d.getTime() / 1000)
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return days
}

function walk(symbol: string, salt: string, times: number[], sigma: number, volBase: number): Candle[] {
  const r = rng(symbol, [...salt].reduce((a, c) => a + c.charCodeAt(0), 0))
  let price = 40 + rng(symbol)() * 400
  return times.map((time) => {
    const open = price
    const close = open * (1 + (r() - 0.49) * sigma * 2)
    price = close
    return {
      time, open, close,
      high: Math.max(open, close) * (1 + r() * sigma * 0.5),
      low: Math.min(open, close) * (1 - r() * sigma * 0.5),
      volume: Math.round(volBase * (0.5 + r()))
    }
  })
}

export function aggregate(daily: Candle[], by: 'week' | 'month'): Candle[] {
  const out: Candle[] = []
  let key = ''
  for (const c of daily) {
    const d = new Date(c.time * 1000)
    const k = by === 'month' ? `${d.getUTCFullYear()}-${d.getUTCMonth()}` : `${d.getUTCFullYear()}-${Math.floor((c.time / 86400 + 3) / 7)}`
    const last = out[out.length - 1]
    if (k !== key || !last) { out.push({ ...c }); key = k }
    else { last.high = Math.max(last.high, c.high); last.low = Math.min(last.low, c.low); last.close = c.close; last.volume += c.volume }
  }
  return out
}

export function sampleCandles(symbol: string, range: Range, interval: Interval): Candle[] {
  const info = intervalInfo(interval)
  const n = barCount(range, interval)
  if (interval === '1week' || interval === '1month') {
    const daily = walk(symbol, '1day', weekdaysBack(tradingDays(range) + 25), 0.009, 3e7)
    return aggregate(daily, interval === '1week' ? 'week' : 'month').slice(-n)
  }
  if (!info.intraday) return walk(symbol, interval, weekdaysBack(n), 0.009, 3e7)

  const step = SESSION_MIN / info.barsPerDay
  const slots = Math.round(info.barsPerDay)
  const days = weekdaysBack(Math.ceil(n / slots))
  const times: number[] = []
  for (const day of days) for (let k = 0; k < slots; k++) times.push(day + (OPEN_UTC_MIN + k * (step === 195 ? 195 : step)) * 60)
  const sigma = 0.009 * Math.sqrt(step / SESSION_MIN)
  return walk(symbol, interval, times.slice(-n), sigma, (3e7 / info.barsPerDay))
}
