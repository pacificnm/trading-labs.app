import { useEffect, useRef } from 'react'
import ScreenFrame, { KV, RangeBar } from '../components/ScreenFrame'
import type { SymbolView } from '../components/SymbolTabs'
import { usePlan } from '../fmpCaps'
import { sampleQuote } from '../data/sample'
import { compact, money, pct } from '../format'
import { dash, pick, pickStr, unwrap, useAsync } from '../data/fmp'
import { formatClock, resolveTz, tzAbbr } from '../display'
import type { FmpOverview } from '../../../shared/fmp'

export interface QuoteData {
  name: string; sub: string
  price: number | null; change: number | null; changePct: number | null; volume: number | null
  prev: number | null; open: number | null; dayLow: number | null; dayHigh: number | null; low52: number | null; high52: number | null
  avgVolume: number | null; marketCap: number | null; pe: number | null; eps: number | null; beta: number | null; divYield: number | null
  trade: { price: number | null; size: number | null; time: number | null } | null
  book: { bid: number | null; bidSize: number | null; ask: number | null; askSize: number | null; volume: number | null; time: number | null } | null
  performance: { label: string; pct: number | null }[]
  asOf: number | null
}

const PERIODS: [string, string][] = [['1D', '1D'], ['5D', '5D'], ['1M', '1M'], ['3M', '3M'], ['6M', '6M'], ['YTD', 'ytd'], ['1Y', '1Y'], ['3Y', '3Y'], ['5Y', '5Y'], ['10Y', '10Y'], ['Max', 'max']]

export function buildQuote(o: FmpOverview): QuoteData {
  const { quote, profile, quoteShort: qs, afterTrade: at, afterQuote: aq, priceChange: pc } = o
  const price = pick(qs, 'price') ?? pick(quote, 'price')
  const change = pick(qs, 'change') ?? pick(quote, 'change')
  const prev = pick(quote, 'previousClose') ?? (price != null && change != null ? price - change : null)
  const div = pick(profile, 'lastDividend', 'lastDiv')
  const ms = (v: number | null) => (v == null ? null : v > 1e11 ? v / 1000 : v) // aftermarket timestamps are in milliseconds
  return {
    name: pickStr(profile, 'companyName') || pickStr(quote, 'name'),
    sub: [pickStr(quote, 'exchange') || pickStr(profile, 'exchange'), pickStr(profile, 'sector'), pickStr(profile, 'industry')].filter(Boolean).join(' · '),
    price, change, changePct: prev && change != null ? (change / prev) * 100 : pick(quote, 'changePercentage', 'changesPercentage'),
    volume: pick(qs, 'volume') ?? pick(quote, 'volume'),
    prev, open: pick(quote, 'open'), dayLow: pick(quote, 'dayLow'), dayHigh: pick(quote, 'dayHigh'), low52: pick(quote, 'yearLow'), high52: pick(quote, 'yearHigh'),
    avgVolume: pick(quote, 'avgVolume') ?? pick(profile, 'averageVolume', 'volAvg'), marketCap: pick(quote, 'marketCap') ?? pick(profile, 'marketCap', 'mktCap'),
    pe: pick(quote, 'pe'), eps: pick(quote, 'eps'), beta: pick(profile, 'beta'), divYield: div != null && price ? (div / price) * 100 : null,
    trade: at ? { price: pick(at, 'price'), size: pick(at, 'tradeSize'), time: ms(pick(at, 'timestamp')) } : null,
    book: aq ? { bid: pick(aq, 'bidPrice'), bidSize: pick(aq, 'bidSize'), ask: pick(aq, 'askPrice'), askSize: pick(aq, 'askSize'), volume: pick(aq, 'volume'), time: ms(pick(aq, 'timestamp')) } : null,
    performance: pc ? PERIODS.map(([label, k]) => ({ label, pct: pick(pc, k) })) : [],
    asOf: o.asOf
  }
}

function fromSample(symbol: string): QuoteData {
  const s = sampleQuote(symbol)
  const now = Date.now() / 1000
  return {
    name: '', sub: '', price: s.price, change: s.change, changePct: s.changePct, volume: s.volume, prev: s.prev, open: s.open, dayLow: s.dayLow, dayHigh: s.dayHigh, low52: s.low52, high52: s.high52,
    avgVolume: s.avgVolume, marketCap: s.marketCap, pe: s.pe, eps: s.eps, beta: s.beta, divYield: s.dividendYield,
    trade: { price: s.price + 0.01, size: 100, time: now }, book: { bid: s.price - 0.02, bidSize: 3, ask: s.price + 0.03, askSize: 5, volume: s.volume, time: now },
    performance: PERIODS.map(([label], i) => ({ label, pct: [s.changePct, 1.2, 4.1, 9.8, 15.2, 12.4, 22.3, 61, 98, 240, 5200][i] })), asOf: null
  }
}

const pctFmt = (n: number) => (Math.abs(n) >= 10000 ? `${n >= 0 ? '+' : ''}${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}%` : pct(n))
const clockAt = (t: number | null) => (t == null ? '—' : `${formatClock(t, undefined, true)} ${tzAbbr(resolveTz(), t)}`)

export default function QuoteView({ symbol, onNavigate, live }: { symbol: string; onNavigate: (v: SymbolView) => void; live: boolean }) {
  const plan = usePlan()
  const force = useRef(false)
  const { data, error, loading, reload } = useAsync(async () => {
    const f = force.current; force.current = false
    return buildQuote(unwrap(await window.api.fmp.overview(symbol, f)))
  }, [symbol], live)
  // re-read while open: the cache serves it unless the data has aged out, so this stays cheap
  useEffect(() => { if (!live) return; const t = setInterval(reload, 20_000); return () => clearInterval(t) }, [live, symbol])
  const q = live ? data : fromSample(symbol)

  const spread = q?.book && q.book.ask != null && q.book.bid != null ? q.book.ask - q.book.bid : null
  const mid = q?.book && q.book.ask != null && q.book.bid != null ? (q.book.ask + q.book.bid) / 2 : null
  const totalSize = q?.book ? (q.book.bidSize ?? 0) + (q.book.askSize ?? 0) : 0
  const tradeVsQuote = q?.trade?.price != null && q.price != null ? q.trade.price - q.price : null

  return (
    <ScreenFrame title="Quote Details" symbol={symbol} view="quote" onNavigate={onNavigate} wide sample={!live} loading={live && loading && !q} error={error} onRetry={reload}
      asOf={live ? q?.asOf ?? null : null} onRefresh={() => { force.current = true; reload() }} refreshing={loading}>
      {q && (
        <>
          {q.name && <div className="hero-name">{q.name}<span className="muted"> {q.sub && `— ${q.sub}`}</span></div>}
          <div className="card-grid rows-auto">
            <section className="card-x">
              <div className="card-x-head"><h4>Short quote</h4><span className="muted">price, change, volume</span></div>
              <div className="hero">
                <span className="hero-price">{dash(q.price, money)}</span>
                {q.change != null && <span className={q.change >= 0 ? 'up' : 'down'}>{q.change >= 0 ? '+' : ''}{q.change.toFixed(2)} {q.changePct != null && `(${pct(q.changePct)})`}</span>}
              </div>
              <KV data={{ Volume: dash(q.volume, compact), 'Previous close': dash(q.prev, money) }} />
              <div className="quote-ranges">
                {q.price != null && q.dayLow != null && q.dayHigh != null && <RangeBar label="Day range" low={q.dayLow} high={q.dayHigh} value={q.price} fmt={(n) => n.toFixed(2)} />}
                {q.price != null && q.low52 != null && q.high52 != null && <RangeBar label="52-week range" low={q.low52} high={q.high52} value={q.price} fmt={(n) => n.toFixed(2)} />}
              </div>
            </section>

            <section className="card-x">
              <div className="card-x-head"><h4>Key statistics</h4></div>
              <KV data={{
                Open: dash(q.open, money), 'Avg volume': dash(q.avgVolume, compact), 'Market cap': dash(q.marketCap, compact),
                'P/E (TTM)': dash(q.pe, (n) => n.toFixed(2)), 'EPS (TTM)': dash(q.eps, money), 'Dividend yield': dash(q.divYield, (n) => `${n.toFixed(2)}%`), Beta: dash(q.beta, (n) => n.toFixed(2))
              }} />
            </section>

            {!plan.unavailable.has('aftermarket') && (<>
            <section className="card-x">
              <div className="card-x-head"><h4>Aftermarket trade</h4><span className="muted">latest trade, including extended hours</span></div>
              {q.trade ? (
                <>
                  <div className="hero"><span className="hero-price sm">{dash(q.trade.price, money)}</span>
                    {tradeVsQuote != null && <span className={tradeVsQuote >= 0 ? 'up' : 'down'}>{tradeVsQuote >= 0 ? '+' : ''}{tradeVsQuote.toFixed(2)} vs quote</span>}</div>
                  <KV data={{ 'Trade size': q.trade.size != null ? `${q.trade.size.toLocaleString()} sh` : '—', 'Traded at': clockAt(q.trade.time) }} />
                </>
              ) : <div className="muted">No trade data available.</div>}
            </section>

            <section className="card-x">
              <div className="card-x-head"><h4>Aftermarket quote</h4><span className="muted">latest bid and ask</span></div>
              {q.book ? (
                <>
                  <div className="book">
                    <div className="book-side bid"><span className="muted">Bid</span><b>{dash(q.book.bid, money)}</b><span className="muted">× {q.book.bidSize ?? '—'}</span></div>
                    <div className="book-side ask"><span className="muted">Ask</span><b>{dash(q.book.ask, money)}</b><span className="muted">× {q.book.askSize ?? '—'}</span></div>
                  </div>
                  {totalSize > 0 && <div className="book-bar" title="Share of displayed size on each side"><i style={{ width: `${((q.book.bidSize ?? 0) / totalSize) * 100}%` }} /></div>}
                  <KV data={{
                    Spread: spread != null ? `${money(spread)}${mid ? ` (${((spread / mid) * 100).toFixed(3)}%)` : ''}` : '—', Midpoint: dash(mid, money),
                    Volume: dash(q.book.volume, compact), 'Quoted at': clockAt(q.book.time)
                  }} />
                </>
              ) : <div className="muted">No quote data available.</div>}
            </section>
            </>)}

            <section className="card-x span-all">
              <div className="card-x-head"><h4>Price performance</h4><span className="muted">% change over each period</span></div>
              {q.performance.length > 0 ? (
                <div className="perf">
                  {q.performance.map((p) => (
                    <div key={p.label} className={'perf-tile ' + (p.pct == null ? '' : p.pct >= 0 ? 'pos' : 'neg')}>
                      <span>{p.label}</span><b>{p.pct == null ? '—' : pctFmt(p.pct)}</b>
                    </div>
                  ))}
                </div>
              ) : <div className="muted">No performance data available.</div>}
            </section>
          </div>
        </>
      )}
    </ScreenFrame>
  )
}
