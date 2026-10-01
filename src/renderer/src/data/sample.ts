// Deterministic per-symbol sample data, shown only while no market-data key is configured (see CLAUDE.md invariant 4).
import { compact } from '../format'
export function rng(symbol: string, salt = 0) {
  let seed = ([...symbol].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) + salt) >>> 0
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


export function sampleQuote(symbol: string) {
  const r = rng(symbol)
  const price = 40 + r() * 400
  const prev = price * (1 + (r() - 0.5) * 0.03)
  const low = price * (0.97 - r() * 0.02), high = price * (1.03 + r() * 0.02)
  return {
    price, prev, change: price - prev, changePct: ((price - prev) / prev) * 100,
    open: prev * (1 + (r() - 0.5) * 0.01), dayLow: low, dayHigh: high,
    low52: price * (0.55 + r() * 0.15), high52: price * (1.15 + r() * 0.3),
    volume: Math.round(2e7 + r() * 6e7), avgVolume: Math.round(3e7 + r() * 4e7),
    marketCap: price * (2e9 + r() * 12e9), pe: 12 + r() * 30, eps: price / (12 + r() * 30),
    dividendYield: r() * 2.5, beta: 0.7 + r() * 1.1, bid: price - 0.01, ask: price + 0.01
  }
}

export function sampleAnalyst(symbol: string) {
  const r = rng(symbol, 1)
  const q = sampleQuote(symbol)
  const counts = { 'Strong Buy': Math.round(4 + r() * 12), Buy: Math.round(6 + r() * 14), Hold: Math.round(3 + r() * 10), Sell: Math.round(r() * 4), 'Strong Sell': Math.round(r() * 2) }
  const firms = ['Morgan Stanley', 'Goldman Sachs', 'JPMorgan', 'Bank of America', 'Wedbush', 'Barclays', 'UBS', 'Citigroup']
  const actions = ['Maintains', 'Upgrades', 'Downgrades', 'Reiterates', 'Initiates']
  const ratings = ['Buy', 'Overweight', 'Neutral', 'Outperform', 'Hold']
  const reports = firms.slice(0, 6).map((firm, i) => ({
    date: new Date(Date.UTC(2026, 8, 28 - i * 4)).toISOString().slice(0, 10),
    firm, action: actions[Math.floor(r() * actions.length)], rating: ratings[Math.floor(r() * ratings.length)],
    target: q.price * (0.95 + r() * 0.4)
  }))
  const scores = { dcf: 1 + Math.floor(r() * 5), roe: 1 + Math.floor(r() * 5), roa: 1 + Math.floor(r() * 5), de: 1 + Math.floor(r() * 5), pe: 1 + Math.floor(r() * 5), pb: 1 + Math.floor(r() * 5) }
  const overall = Math.round((scores.dcf + scores.roe + scores.roa + scores.de + scores.pe + scores.pb) / 6)
  const letters = ['F', 'D', 'C', 'B', 'A']
  const history = Array.from({ length: 120 }, (_, i) => ({ date: new Date(Date.UTC(2026, 8, 30) - i * 86400000 * 1.4).toISOString().slice(0, 10), score: Math.max(1, Math.min(5, overall + (i > 70 ? 1 : 0) - (i > 100 ? 1 : 0))) }))
  const t = (k: number, n: number) => ({ count: n, avg: q.price * k })
  return {
    counts, low: q.price * 0.8, avg: q.price * 1.12, high: q.price * 1.45, price: q.price, reports,
    median: q.price * 1.13, summary: { month: t(1.14, 3), quarter: t(1.1, 14), year: t(1.03, 60), all: t(0.8, 240) },
    snapshot: { letter: letters[overall - 1], overall, scores }, history,
    estimates: Array.from({ length: 5 }, (_, i) => {
      const rev = 4e10 * (1 + r()) * 1.08 ** i, eps = (q.price / 25) * 1.09 ** i
      return { year: String(2025 + i), actual: i === 0, revenue: rev, epsVal: eps, revLow: rev * 0.95, revHigh: rev * 1.05, epsLow: eps * 0.93, epsHigh: eps * 1.07, nRev: 20 - i * 3, nEps: 22 - i * 3, revBeat: i === 0 ? 0.4 : null, epsBeat: i === 0 ? 1.1 : null }
    })
  }
}

export function sampleFundamentals(symbol: string) {
  const r = rng(symbol, 2)
  const q = sampleQuote(symbol)
  const rev0 = 5e9 + r() * 90e9
  const years = [2025, 2024, 2023, 2022].map((y, i) => {
    const revenue = rev0 / (1 + 0.09) ** i
    const net = revenue * (0.12 + r() * 0.12)
    return { year: y, revenue, gross: revenue * (0.35 + r() * 0.25), operating: revenue * (0.15 + r() * 0.15), net, eps: net / (q.marketCap / q.price), fcf: net * (0.8 + r() * 0.5) }
  })
  return {
    valuation: { 'Market cap': compact(q.marketCap), 'P/E (TTM)': q.pe.toFixed(1), 'Forward P/E': (q.pe * 0.88).toFixed(1), 'P/S': (2 + r() * 8).toFixed(1), 'P/B': (1.5 + r() * 12).toFixed(1), 'EV/EBITDA': (8 + r() * 16).toFixed(1) },
    profitability: { 'Gross margin': `${(35 + r() * 30).toFixed(1)}%`, 'Operating margin': `${(12 + r() * 25).toFixed(1)}%`, 'Net margin': `${(8 + r() * 20).toFixed(1)}%`, ROE: `${(8 + r() * 30).toFixed(1)}%`, ROA: `${(4 + r() * 14).toFixed(1)}%` },
    balance: { Cash: compact(rev0 * 0.3), 'Total debt': compact(rev0 * (0.2 + r() * 0.5)), 'Debt / equity': (0.2 + r() * 1.4).toFixed(2), 'Current ratio': (0.9 + r() * 1.6).toFixed(2), 'Shares outstanding': compact(q.marketCap / q.price) },
    years
  }
}
