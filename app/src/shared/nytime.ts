// New York wall-clock helpers (FMP intraday timestamps and the regular trading session are in ET).
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' })

export interface NyParts { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number }

export function nyParts(epochSec: number): NyParts {
  const p = Object.fromEntries(fmt.formatToParts(new Date(epochSec * 1000)).map((x) => [x.type, x.value]))
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(String(p.weekday))
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, second: +p.second, weekday: wd }
}

function offsetMs(utcMs: number): number {
  const p = nyParts(Math.floor(utcMs / 1000))
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000
}

/** "2026-03-04 09:30:00" (New York time) -> UTC epoch seconds */
export function nyToEpoch(s: string): number {
  const [d, t = '00:00:00'] = s.split(/[ T]/)
  const [Y, M, D] = d.split('-').map(Number)
  const [h, m, sec] = t.split(':').map(Number)
  const guess = Date.UTC(Y, M - 1, D, h, m, sec || 0)
  let utc = guess - offsetMs(guess)
  utc = guess - offsetMs(utc) // second pass settles DST edges
  return Math.floor(utc / 1000)
}

export const nyDate = (epochSec: number): string => {
  const p = nyParts(epochSec)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Regular session: Mon–Fri 09:30–16:00 ET (market holidays are not modelled). */
export function isMarketOpen(epochSec: number): boolean {
  const p = nyParts(epochSec)
  const m = p.hour * 60 + p.minute
  return p.weekday >= 1 && p.weekday <= 5 && m >= 570 && m < 960
}

/** The next 16:00 ET weekday close strictly after `epochSec`. */
export function sessionCloseAfter(epochSec: number): number {
  for (let d = 0; d < 10; d++) {
    const t = epochSec + d * 86400
    const p = nyParts(t)
    if (p.weekday < 1 || p.weekday > 5) continue
    const close = nyToEpoch(`${nyDate(t)} 16:00:00`)
    if (close > epochSec) return close
  }
  return epochSec + 86400
}

/** Pre-market 04:00–09:30 and after-hours 16:00–20:00 ET, weekdays. */
export function isExtendedHours(epochSec: number): boolean {
  const p = nyParts(epochSec)
  const m = p.hour * 60 + p.minute
  return p.weekday >= 1 && p.weekday <= 5 && ((m >= 240 && m < 570) || (m >= 960 && m < 1200))
}

/** Seconds until the next session boundary (04:00, 09:30, 16:00 or 20:00 ET on a weekday). */
export function secondsToNextSessionBoundary(epochSec: number): number {
  for (let d = 0; d < 10; d++) {
    const t = epochSec + d * 86400
    const p = nyParts(t)
    if (p.weekday < 1 || p.weekday > 5) continue
    for (const hm of ['04:00:00', '09:30:00', '16:00:00', '20:00:00']) {
      const b = nyToEpoch(`${nyDate(t)} ${hm}`)
      if (b > epochSec) return b - epochSec
    }
  }
  return 3600
}
