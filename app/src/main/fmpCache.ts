import type { DatabaseSync } from 'node:sqlite'
import { isExtendedHours, isMarketOpen, nyDate, secondsToNextSessionBoundary } from '../shared/nytime'

const MIN = 60_000, HOUR = 3_600_000

/** How long a response stays fresh. Live-price data follows the market session; company data changes slowly. */
export function ttlFor(path: string, nowMs = Date.now(), params: Record<string, string | number> = {}): number {
  const now = nowMs / 1000
  const open = isMarketOpen(now), ext = isExtendedHours(now)
  const live = open || ext
  let ttl: number
  let sessionBound = false // may not outlive the next session boundary (a "closed" price is stale once trading resumes)
  if (path === 'quote' || path === 'quote-short') { ttl = open ? 15_000 : ext ? 45_000 : 10 * MIN; sessionBound = true }
  else if (path.startsWith('aftermarket-')) { ttl = live ? 15_000 : 30 * MIN; sessionBound = true }
  else if (path === 'stock-price-change') { ttl = open ? 5 * MIN : ext ? 10 * MIN : 3 * HOUR; sessionBound = true }
  else if (path.startsWith('historical-chart/')) { ttl = open ? 30_000 : 10 * MIN; sessionBound = true }
  else if (path === 'historical-price-eod/full') { ttl = open ? 10 * MIN : 2 * HOUR; sessionBound = true }
  else if (path.endsWith('-performance-snapshot') || path.endsWith('-pe-snapshot')) {
    // a past day never changes; today moves while the market is open
    const past = typeof params.date === 'string' && params.date < nyDate(now)
    ttl = past ? 24 * HOUR : open ? 5 * MIN : 3 * HOUR
    sessionBound = !past
  }
  else if (path === 'biggest-gainers' || path === 'biggest-losers' || path === 'most-actives') { ttl = open ? 60_000 : ext ? 3 * MIN : 30 * MIN; sessionBound = true }
  else if (path === 'company-screener') { ttl = open ? 5 * MIN : ext ? 10 * MIN : HOUR; sessionBound = true }
  else if (path.startsWith('available-')) ttl = 24 * HOUR
  else if (path.startsWith('senate-') || path.startsWith('house-')) ttl = 30 * MIN // disclosures are filed in batches, a few times a day
  else if (path.startsWith('news/')) ttl = open ? 3 * MIN : 10 * MIN
  else if (path === 'ratings-historical' || path === 'analyst-estimates') ttl = 12 * HOUR
  else if (['grades', 'grades-consensus', 'price-target-consensus', 'price-target-summary', 'ratings-snapshot'].includes(path)) ttl = 4 * HOUR
  else if (['profile', 'ratios-ttm', 'key-metrics-ttm', 'income-statement', 'balance-sheet-statement', 'cash-flow-statement'].includes(path)) ttl = 24 * HOUR
  else if (path.startsWith('search-')) ttl = 30 * MIN
  else ttl = MIN
  if (sessionBound) ttl = Math.min(ttl, secondsToNextSessionBoundary(now) * 1000)
  return Math.max(1000, ttl)
}

export interface CacheEntry { body: unknown; fetchedAt: number; expiresAt: number }
const MAX_PERSISTED_BYTES = 1_500_000
const MAX_ROWS = 1500
const MAX_AGE_MS = 7 * 24 * HOUR

/** Memory first, then SQLite, so cached responses survive restarts. Intraday bars stay in memory only. */
export class ResponseCache {
  private mem = new Map<string, CacheEntry>()
  constructor(private db: DatabaseSync | null, private clock: () => number = Date.now) {
    db?.exec('CREATE TABLE IF NOT EXISTS fmp_cache (key TEXT PRIMARY KEY, body TEXT NOT NULL, fetched_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, bytes INTEGER NOT NULL)')
    if (db) {
      db.prepare('DELETE FROM fmp_cache WHERE fetched_at < ?').run(this.clock() - MAX_AGE_MS)
      db.prepare('DELETE FROM fmp_cache WHERE key NOT IN (SELECT key FROM fmp_cache ORDER BY fetched_at DESC LIMIT ?)').run(MAX_ROWS)
    }
  }
  get(key: string): CacheEntry | undefined {
    const m = this.mem.get(key)
    if (m) return m
    if (!this.db) return undefined
    const r = this.db.prepare('SELECT body, fetched_at, expires_at FROM fmp_cache WHERE key = ?').get(key) as { body: string; fetched_at: number; expires_at: number } | undefined
    if (!r) return undefined
    try {
      const e = { body: JSON.parse(r.body), fetchedAt: r.fetched_at, expiresAt: r.expires_at }
      this.mem.set(key, e)
      return e
    } catch { return undefined }
  }
  set(key: string, body: unknown, ttlMs: number): CacheEntry {
    const now = this.clock()
    const e: CacheEntry = { body, fetchedAt: now, expiresAt: now + ttlMs }
    this.mem.set(key, e)
    if (this.db && !key.startsWith('historical-chart/')) {
      const text = JSON.stringify(body)
      if (text.length <= MAX_PERSISTED_BYTES) this.db.prepare('INSERT INTO fmp_cache (key, body, fetched_at, expires_at, bytes) VALUES (?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET body = excluded.body, fetched_at = excluded.fetched_at, expires_at = excluded.expires_at, bytes = excluded.bytes').run(key, text, e.fetchedAt, e.expiresAt, text.length)
    }
    return e
  }
  clear(): void { this.mem.clear(); this.db?.exec('DELETE FROM fmp_cache') }
  stats(): { entries: number; bytes: number; oldest: number | null } {
    if (!this.db) return { entries: this.mem.size, bytes: 0, oldest: null }
    const r = this.db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(bytes),0) AS b, MIN(fetched_at) AS o FROM fmp_cache').get() as { n: number; b: number; o: number | null }
    return { entries: r.n, bytes: r.b, oldest: r.o }
  }
}

export interface Ctx { force: boolean; /** oldest fetch time (ms) among the responses used */ asOf: number }
export const newCtx = (force = false): Ctx => ({ force, asOf: Infinity })
export const cacheKey = (path: string, params: Record<string, string | number>) =>
  `${path}?${Object.entries(params).map(([k, v]) => [k, String(v)] as const).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`

/**
 * Cached GET with: fresh hits served without a request, identical concurrent requests merged into one,
 * and (when the failure is transient) the last good copy served instead of an error.
 */
export function createRequester(
  store: ResponseCache,
  fetchJson: (path: string, params: Record<string, string | number>) => Promise<unknown>,
  staleOk: (err: unknown) => boolean,
  clock: () => number = Date.now
) {
  const inflight = new Map<string, Promise<CacheEntry>>()
  return async function get(path: string, params: Record<string, string | number> = {}, opts: { ttl?: number; ctx?: Ctx } = {}): Promise<unknown> {
    const key = cacheKey(path, params)
    const ctx = opts.ctx
    const entry = store.get(key)
    const touch = (e: CacheEntry) => { if (ctx) ctx.asOf = Math.min(ctx.asOf, e.fetchedAt) }
    if (entry && !ctx?.force && clock() < entry.expiresAt) { touch(entry); return entry.body }
    let p = inflight.get(key)
    if (!p) {
      p = fetchJson(path, params).then((body) => store.set(key, body, opts.ttl ?? ttlFor(path, clock(), params))).finally(() => inflight.delete(key))
      inflight.set(key, p)
    }
    try { const e = await p; touch(e); return e.body }
    catch (err) {
      if (entry && staleOk(err)) { touch(entry); return entry.body }
      throw err
    }
  }
}
