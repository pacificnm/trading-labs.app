import { TickMarkType, type Time } from 'lightweight-charts'

export type TzMode = 'market' | 'local' | 'custom'
export interface DisplaySettings { tzMode: TzMode; customTz: string; hour12: boolean }

export const DEFAULT_DISPLAY: DisplaySettings = { tzMode: 'market', customTz: 'UTC', hour12: false }
export const MARKET_TZ = 'America/New_York'
export const localTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// The current setting, readable from non-React code (tool handlers, formatters).
let current: DisplaySettings = DEFAULT_DISPLAY
export const setDisplay = (d: DisplaySettings) => { current = d }
export const getDisplay = () => current

const valid = (tz: string) => { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false } }

export function resolveTz(d: DisplaySettings = current): string {
  if (d.tzMode === 'market') return MARKET_TZ
  if (d.tzMode === 'custom' && valid(d.customTz)) return d.customTz
  return localTz()
}

const cache = new Map<string, Intl.DateTimeFormat>()
function dtf(tz: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const k = tz + JSON.stringify(opts)
  let f = cache.get(k)
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }); cache.set(k, f) }
  return f
}
const parts = (tz: string, epoch: number, opts: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(dtf(tz, opts).formatToParts(new Date(epoch * 1000)).map((p) => [p.type, p.value])) as Record<string, string>

/** Short zone name at that moment, e.g. "EDT", "GMT+1". */
export const tzAbbr = (tz: string, epoch = Date.now() / 1000) => parts(tz, epoch, { timeZoneName: 'short' }).timeZoneName ?? tz

const clock = (tz: string, epoch: number, hour12: boolean, seconds = false) => {
  const p = parts(tz, epoch, { hour: 'numeric', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), hour12, ...(hour12 ? {} : { hourCycle: 'h23' as const }) })
  const hh = hour12 ? p.hour : p.hour.padStart(2, '0')
  return `${hh}:${p.minute}${seconds ? ':' + p.second : ''}${hour12 ? ' ' + p.dayPeriod : ''}`
}
export const formatClock = (epoch: number, d: DisplaySettings = current, seconds = false) => clock(resolveTz(d), epoch, d.hour12, seconds)

const dateShort = (tz: string, epoch: number) => { const p = parts(tz, epoch, { weekday: 'short', day: 'numeric', month: 'short' }); return `${p.weekday} ${p.day} ${p.month}` }

/** e.g. "Wed 30 Sep, 10:32 EDT" in the chosen zone (used in lists). */
export function formatDateTime(epoch: number, d: DisplaySettings = current): string {
  const tz = resolveTz(d)
  return `${dateShort(tz, epoch)}, ${clock(tz, epoch, d.hour12)} ${tzAbbr(tz, epoch)}`
}

const epochOf = (t: Time): number => (typeof t === 'number' ? t : typeof t === 'string' ? Date.parse(t) / 1000 : Date.UTC(t.year, t.month - 1, t.day) / 1000)

/**
 * Axis and crosshair labels. Intraday bars are shown in the chosen zone; daily and longer bars are
 * calendar dates, so they stay in UTC (shifting a date-only bar into New York would show the day before).
 */
export function chartFormatters(intraday: boolean, tz: string, hour12: boolean) {
  const zone = intraday ? tz : 'UTC'
  return {
    tick: (time: Time, type: TickMarkType): string => {
      const e = epochOf(time)
      switch (type) {
        case TickMarkType.Year: return parts(zone, e, { year: 'numeric' }).year
        case TickMarkType.Month: return parts(zone, e, { month: 'short' }).month
        case TickMarkType.DayOfMonth: { const p = parts(zone, e, { day: 'numeric', month: 'short' }); return `${p.day} ${p.month}` }
        case TickMarkType.TimeWithSeconds: return clock(zone, e, hour12, true)
        default: return clock(zone, e, hour12)
      }
    },
    crosshair: (time: Time): string => {
      const e = epochOf(time)
      const p = parts(zone, e, { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })
      const date = `${p.weekday} ${p.day} ${p.month} '${p.year}`
      return intraday ? `${date}  ${clock(zone, e, hour12)} ${tzAbbr(zone, e)}` : date
    }
  }
}
