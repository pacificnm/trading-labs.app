import type { CongressTrade } from '../../../shared/fmp'

export interface AmountRange { lo: number; hi: number; mid: number }

/** "$15,001 - $50,000" -> its bounds and midpoint. Open-ended ranges ("Over $50,000,000") use the floor. */
export function amountRange(s: string): AmountRange | null {
  const nums = (s.match(/\$?[\d,]+/g) ?? []).map((x) => Number(x.replace(/[$,]/g, ''))).filter((n) => Number.isFinite(n) && n > 0)
  if (nums.length >= 2) return { lo: nums[0], hi: nums[1], mid: (nums[0] + nums[1]) / 2 }
  if (nums.length === 1) return { lo: nums[0], hi: nums[0], mid: nums[0] }
  return null
}

/** Days between the transaction and its public disclosure (members have up to 45 days to file). */
export function delayDays(t: CongressTrade): number | null {
  const a = Date.parse(t.traded), b = Date.parse(t.disclosed)
  return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.round((b - a) / 86400000)) : null
}

export const isBuy = (t: CongressTrade) => /purchase/i.test(t.type)
export const isSell = (t: CongressTrade) => /sale/i.test(t.type)

export interface Summary {
  count: number; buys: number; sells: number; other: number
  /** estimated dollars from range midpoints */
  buyValue: number; sellValue: number
  medianDelay: number | null; maxDelay: number | null
  topSymbols: { symbol: string; count: number; buys: number; sells: number; members: number }[]
  topMembers: { member: string; memberId: string; chamber: string; count: number }[]
  assetTypes: { type: string; count: number }[]
  from: string | null; to: string | null
}

export function summarize(list: CongressTrade[]): Summary {
  let buys = 0, sells = 0, buyValue = 0, sellValue = 0
  const delays: number[] = []
  const sym = new Map<string, { symbol: string; count: number; buys: number; sells: number; who: Set<string> }>()
  const mem = new Map<string, { member: string; memberId: string; chamber: string; count: number }>()
  const types = new Map<string, number>()
  for (const t of list) {
    const v = amountRange(t.amount)?.mid ?? 0
    if (isBuy(t)) { buys++; buyValue += v } else if (isSell(t)) { sells++; sellValue += v }
    const d = delayDays(t); if (d != null) delays.push(d)
    if (t.symbol) { const e = sym.get(t.symbol) ?? { symbol: t.symbol, count: 0, buys: 0, sells: 0, who: new Set<string>() }; e.who.add(`${t.chamber}:${t.memberId || t.member}`); e.count++; if (isBuy(t)) e.buys++; if (isSell(t)) e.sells++; sym.set(t.symbol, e) }
    const mk = `${t.chamber}:${t.memberId || t.member}`
    const m = mem.get(mk) ?? { member: t.member, memberId: t.memberId, chamber: t.chamber, count: 0 }; m.count++; mem.set(mk, m)
    types.set(t.assetType || 'Other', (types.get(t.assetType || 'Other') ?? 0) + 1)
  }
  delays.sort((a, b) => a - b)
  const dates = list.map((t) => t.traded).filter(Boolean).sort()
  return {
    count: list.length, buys, sells, other: list.length - buys - sells, buyValue, sellValue,
    medianDelay: delays.length ? delays[Math.floor(delays.length / 2)] : null, maxDelay: delays.length ? delays[delays.length - 1] : null,
    topSymbols: [...sym.values()].sort((a, b) => b.count - a.count).slice(0, 8).map(({ who, ...x }) => ({ ...x, members: who.size })), topMembers: [...mem.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    assetTypes: [...types].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count), from: dates[0] ?? null, to: dates[dates.length - 1] ?? null
  }
}

export interface TradeFilter { kind: 'all' | 'buys' | 'sells'; assetType: 'all' | 'stocks'; q: string; owner: string }
export const DEFAULT_TRADE_FILTER: TradeFilter = { kind: 'all', assetType: 'all', q: '', owner: 'all' }

export function filterTrades(list: CongressTrade[], f: TradeFilter): CongressTrade[] {
  const q = f.q.trim().toLowerCase()
  return list.filter((t) =>
    (f.kind === 'all' || (f.kind === 'buys' ? isBuy(t) : isSell(t))) &&
    (f.assetType === 'all' || /stock/i.test(t.assetType) && !/option/i.test(t.assetType)) &&
    (f.owner === 'all' || t.owner === f.owner) &&
    (!q || `${t.member} ${t.symbol} ${t.asset} ${t.district}`.toLowerCase().includes(q)))
}

/** Distinct members in a result set, most active first. */
export function groupMembers(list: CongressTrade[]): { key: string; member: string; memberId: string; chamber: 'senate' | 'house'; district: string; count: number }[] {
  const m = new Map<string, { key: string; member: string; memberId: string; chamber: 'senate' | 'house'; district: string; count: number }>()
  for (const t of list) { const key = `${t.chamber}:${t.memberId || t.member}`; const e = m.get(key) ?? { key, member: t.member, memberId: t.memberId, chamber: t.chamber, district: t.district, count: 0 }; e.count++; m.set(key, e) }
  return [...m.values()].sort((a, b) => b.count - a.count)
}
