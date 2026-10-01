// What an FMP plan includes, learned from the connection test. Everything here is pure so the main process (tool list,
// order-fill bars) and the renderer (menus, screens) agree. A capability that has not been checked counts as available.

export type CapId =
  | 'quotes' | 'indices' | 'daily' | 'bars1min' | 'bars5min' | 'bars15min' | 'bars30min' | 'bars1hour' | 'bars4hour'
  | 'search' | 'news' | 'marketNews' | 'profile' | 'analyst' | 'estimates' | 'aftermarket' | 'sectors' | 'movers'
  | 'screener' | 'congress' | 'fundamentals'

export interface CapDef { id: CapId; label: string; /** what stops working without it */ lost: string }

export const CAPS: CapDef[] = [
  { id: 'quotes', label: 'Live quotes', lost: 'live prices, watchlist prices and the paper account\'s marks' },
  { id: 'indices', label: 'Index quotes', lost: 'the index ticker along the top' },
  { id: 'daily', label: 'Daily bars', lost: 'daily, weekly and monthly charts' },
  { id: 'bars1min', label: '1-minute bars', lost: '1-minute charts (and precise order fills)' },
  { id: 'bars5min', label: '5-minute bars', lost: '5-minute charts' },
  { id: 'bars15min', label: '15-minute bars', lost: '15-minute charts' },
  { id: 'bars30min', label: '30-minute bars', lost: '30-minute charts' },
  { id: 'bars1hour', label: '1-hour bars', lost: '1-hour charts' },
  { id: 'bars4hour', label: '4-hour bars', lost: '4-hour charts' },
  { id: 'search', label: 'Symbol search', lost: 'searching for symbols by name' },
  { id: 'news', label: 'Stock news', lost: 'news for a symbol' },
  { id: 'marketNews', label: 'Market news', lost: 'general market news' },
  { id: 'profile', label: 'Company profile', lost: 'company details on the quote screen' },
  { id: 'analyst', label: 'Analyst ratings', lost: 'ratings, price targets and grades' },
  { id: 'estimates', label: 'Analyst estimates', lost: 'the estimates section of Analyst Reports' },
  { id: 'aftermarket', label: 'After-hours quotes', lost: 'after-hours prices on the quote screen' },
  { id: 'sectors', label: 'Sector performance', lost: 'sector and industry performance' },
  { id: 'movers', label: 'Market movers', lost: 'the biggest gainers and losers' },
  { id: 'screener', label: 'Stock screener', lost: 'the Stock Screener' },
  { id: 'congress', label: 'Senate and House trades', lost: 'the congressional trades screen' },
  { id: 'fundamentals', label: 'Fundamentals', lost: 'ratios, key metrics and financial statements' }
]
export const capLabel = (id: CapId) => CAPS.find((c) => c.id === id)?.label ?? id

/** Result of the last check. `unavailable` lists the capabilities the plan does not include. */
export interface FmpCaps { checkedAt: number; unavailable: CapId[] }

/** True when every capability in `needs` is missing, so a feature that works with any one of them stays visible if one survives. */
export const missingAll = (unavailable: ReadonlySet<CapId> | CapId[], needs: CapId[]): boolean => {
  const set = unavailable instanceof Set ? unavailable : new Set(unavailable)
  return needs.length > 0 && needs.every((n) => set.has(n))
}

// ---- features that depend on capabilities -------------------------------------------------------

/** Ribbon screens and symbol tabs that are hidden when the plan lacks everything they need. */
export const SCREEN_CAPS: Record<string, CapId[]> = {
  market: ['sectors', 'movers'],
  congress: ['congress'],
  marketnews: ['news', 'marketNews'],
  screener: ['screener'],
  news: ['news'],
  analyst: ['analyst', 'estimates'],
  fundamentals: ['fundamentals']
}

/** Claude tools that need market data the plan may not include. Tools not listed here always stay. */
export const TOOL_CAPS: Record<string, CapId[]> = {
  get_news: ['news', 'marketNews'],
  get_analyst_ratings: ['analyst'],
  run_screener: ['screener'],
  get_congress_trades: ['congress'],
  get_market_performance: ['sectors', 'movers'],
  get_quote: ['quotes']
}

export const INTERVAL_CAP: Record<string, CapId | undefined> = {
  '1min': 'bars1min', '5min': 'bars5min', '15min': 'bars15min', '30min': 'bars30min', '1hour': 'bars1hour', '4hour': 'bars4hour'
}

// ---- order fills ---------------------------------------------------------------------------------

export interface FillGrain {
  /** the FMP interval whose bars are replayed */
  interval: '1min' | '5min' | '15min' | '30min' | '1hour'
  seconds: number
  /** seconds past the epoch-aligned boundary at which bars start (hourly bars open at :30) */
  offset: number
  label: string
}
const GRAINS: (FillGrain & { cap: CapId })[] = [
  { interval: '1min', seconds: 60, offset: 0, label: '1-minute', cap: 'bars1min' },
  { interval: '5min', seconds: 300, offset: 0, label: '5-minute', cap: 'bars5min' },
  { interval: '15min', seconds: 900, offset: 0, label: '15-minute', cap: 'bars15min' },
  { interval: '30min', seconds: 1800, offset: 0, label: '30-minute', cap: 'bars30min' },
  { interval: '1hour', seconds: 3600, offset: 1800, label: '1-hour', cap: 'bars1hour' }
]

/** The finest bars the plan can supply for filling working orders, or null when it has no intraday bars at all. */
export function fillGrain(unavailable: ReadonlySet<CapId> | CapId[]): FillGrain | null {
  const set = unavailable instanceof Set ? unavailable : new Set(unavailable)
  const g = GRAINS.find((x) => !set.has(x.cap))
  return g ? { interval: g.interval, seconds: g.seconds, offset: g.offset, label: g.label } : null
}

/** First bar boundary at or after time `t` for bars of `g` (a working order can only use bars that start after it was placed). */
export const nextBar = (t: number, g: Pick<FillGrain, 'seconds' | 'offset'>): number => Math.ceil((t - g.offset) / g.seconds) * g.seconds + g.offset

/** Added to Claude's instructions so it does not try, or promise, data the user's plan does not include. Empty when nothing is missing. */
export function planNote(unavailable: ReadonlySet<CapId> | CapId[]): string {
  const set = unavailable instanceof Set ? unavailable : new Set(unavailable)
  const lost = CAPS.filter((c) => set.has(c.id))
  if (lost.length === 0) return ''
  return `\n\n## The user's market-data plan\n\nThe user's FMP plan does not include: ${lost.map((c) => c.label.toLowerCase()).join(', ')}. The screens, chart intervals and tools that depend on them are switched off, so do not try to use them or offer them. If the user asks for that data, say plainly that their plan does not include it. Work with the intervals and data you can actually get; set_chart will refuse an interval that is not available.`
}

