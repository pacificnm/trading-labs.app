// Interval ids mirror FMP's chart endpoints: /historical-chart/{1min,5min,15min,30min,1hour,4hour}
// and the end-of-day series for daily. Weekly and monthly bars are built locally from daily.
export type Interval = '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' | '1day' | '1week' | '1month'
export type Range = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

export const INTERVALS: { id: Interval; label: string; barsPerDay: number; intraday: boolean }[] = [
  { id: '1min', label: '1 Min', barsPerDay: 390, intraday: true },
  { id: '5min', label: '5 Min', barsPerDay: 78, intraday: true },
  { id: '15min', label: '15 Min', barsPerDay: 26, intraday: true },
  { id: '30min', label: '30 Min', barsPerDay: 13, intraday: true },
  { id: '1hour', label: '1 Hour', barsPerDay: 7, intraday: true },
  { id: '4hour', label: '4 Hour', barsPerDay: 2, intraday: true },
  { id: '1day', label: 'Day', barsPerDay: 1, intraday: false },
  { id: '1week', label: 'Week', barsPerDay: 1 / 5, intraday: false },
  { id: '1month', label: 'Month', barsPerDay: 1 / 21, intraday: false }
]

export const RANGES: { id: Range; label: string }[] = [
  { id: '1D', label: '1 Day' }, { id: '5D', label: '5 Days' }, { id: '1M', label: '1 Month' },
  { id: '3M', label: '3 Months' }, { id: '6M', label: '6 Months' }, { id: 'YTD', label: 'Year to Date' },
  { id: '1Y', label: '1 Year' }, { id: '5Y', label: '5 Years' }, { id: 'MAX', label: 'Max' }
]

export const intervalInfo = (i: Interval) => INTERVALS.find((x) => x.id === i)!

export function tradingDays(range: Range, now = new Date()): number {
  switch (range) {
    case '1D': return 1
    case '5D': return 5
    case '1M': return 21
    case '3M': return 63
    case '6M': return 126
    case 'YTD': return Math.max(1, Math.round(((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000) * (5 / 7)))
    case '1Y': return 252
    case '5Y': return 1260
    case 'MAX': return 5040
  }
}

export const barCount = (range: Range, interval: Interval) => Math.ceil(tradingDays(range) * intervalInfo(interval).barsPerDay)

const MIN_BARS = 4
const MAX_BARS = 10000

// Intervals the user's FMP plan does not include. Set from the connection check (see fmpCaps.tsx); every control and tool goes through
// isAllowed, so one list keeps the toolbar, Claude's set_chart and strategy setups consistent. Daily bars are never blocked: without them there is no chart.
let blocked: ReadonlySet<Interval> = new Set()
export const setBlockedIntervals = (ids: Interval[]) => { blocked = new Set(ids.filter((i) => i !== '1day')) }
export const isBlocked = (interval: Interval) => blocked.has(interval)

export const isAllowed = (range: Range, interval: Interval) => {
  if (blocked.has(interval)) return false
  const n = barCount(range, interval)
  return n >= MIN_BARS && n <= MAX_BARS
}

export const allowedIntervals = (range: Range) => INTERVALS.filter((i) => isAllowed(range, i.id))
/** Ranges that still have at least one usable interval (a 1-day range needs intraday bars). */
export const availableRanges = () => RANGES.filter((r) => allowedIntervals(r.id).length > 0)

/** Keep the interval if it works for the range, otherwise the closest one that does. */
export function coerceInterval(range: Range, interval: Interval): Interval {
  if (isAllowed(range, interval)) return interval
  const order = INTERVALS.map((i) => i.id)
  const from = order.indexOf(interval)
  const options = allowedIntervals(range)
  return options.length ? options.sort((a, b) => Math.abs(order.indexOf(a.id) - from) - Math.abs(order.indexOf(b.id) - from))[0].id : '1day'
}

/** A range/interval pair that works with the current plan: the pair itself if usable, else the closest interval, else a daily chart. */
export function usableTimeframe(range: Range, interval: Interval): { range: Range; interval: Interval } {
  const i = coerceInterval(range, interval)
  if (isAllowed(range, i)) return { range, interval: i }
  return { range: '6M', interval: '1day' }
}
