import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { unwrap, useAsync } from '../data/fmp'
import { buildMarket, DEFAULT_MOVER_FILTER, filterMovers, type MarketModel, type Mover, type MoverFilter, type Sector } from '../data/market'
import { formatClock, resolveTz, tzAbbr } from '../display'
import { ago } from '../components/NewsList'
import { money } from '../data/sample'

const pct = (n: number | null, d = 2) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`)
const cls = (n: number | null) => (n == null ? '' : n >= 0 ? 'up' : 'down')
const tint = (n: number | null) => (n == null ? '#2a2a2a' : `rgba(${n >= 0 ? '38,166,154' : '239,83,80'},${(0.12 + Math.min(Math.abs(n) / 3, 1) * 0.55).toFixed(2)})`)

function MoverList({ title, sub, list, onSelect }: { title: string; sub: string; list: Mover[]; onSelect: (s: string) => void }) {
  return (
    <section className="card-x">
      <div className="card-x-head"><h4>{title}</h4><span className="muted">{sub}</span></div>
      {list.length === 0 ? <div className="muted">Nothing matches your filters.</div> : (
        <table className="grid mv-table"><tbody>
          {list.map((m) => (
            <tr key={m.symbol} className="opt-pick" onClick={() => onSelect(m.symbol)} title={`${m.name} · ${m.exchange}`}>
              <td><b>{m.symbol}</b><div className="muted mv-name">{m.name}</div></td>
              <td style={{ textAlign: 'right' }}>{m.price != null ? money(m.price) : '—'}</td>
              <td style={{ textAlign: 'right' }} className={cls(m.pct)}>{pct(m.pct)}</td>
            </tr>
          ))}
        </tbody></table>
      )}
    </section>
  )
}

export function MarketBody({ m, onSelectSymbol, onAskClaude }: { m: MarketModel; onSelectSymbol: (s: string) => void; onAskClaude: (t: string) => void }) {
  const [filter, setFilter] = useState<MoverFilter>(DEFAULT_MOVER_FILTER)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ by: 'change' | 'pe' | 'name'; dir: 1 | -1 }>({ by: 'change', dir: -1 })

  const up = m.sectors.filter((s) => (s.change ?? 0) > 0).length
  const peMax = Math.max(1, ...m.sectors.map((s) => s.pe ?? 0))
  const peAvg = useMemo(() => { const v = m.sectors.map((s) => s.pe).filter((x): x is number => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }, [m])
  const byPe = useMemo(() => [...m.sectors].filter((s) => s.pe != null).sort((a, b) => b.pe! - a.pe!), [m])
  const industries = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = m.industries.filter((i) => !t || i.name.toLowerCase().includes(t))
    const val = (i: Sector) => (sort.by === 'name' ? i.name.toLowerCase() : sort.by === 'pe' ? i.pe ?? -Infinity : i.change ?? -Infinity)
    return [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * sort.dir)
  }, [m, q, sort])
  const head = (label: string, by: 'change' | 'pe' | 'name', right = true) => (
    <th style={{ textAlign: right ? 'right' : 'left' }} className="sortable" onClick={() => setSort((s) => ({ by, dir: s.by === by ? (s.dir === 1 ? -1 : 1) : by === 'name' ? 1 : -1 }))}>{label}{sort.by === by ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</th>
  )
  const ask = () => onAskClaude(`Give me a read on the market today using get_market_performance. Which sectors and industries are leading and lagging, what does that say about risk appetite or rotation, how do the P/E ratios compare, and what should a beginner take from it? Also point out anything in the movers lists I should be careful about.`)

  const f = (patch: Partial<MoverFilter>) => setFilter({ ...filter, ...patch })
  return (
    <>
      <div className="opt-note muted">{m.sectors.length ? `${up} of ${m.sectors.length} sectors are up on ${m.exchange}-listed stocks.` : ''} Sector and industry figures are the average change across listed stocks. Movers below are live.
        <button className="btn small" onClick={ask}><Sparkles size={12} /> Ask Claude for a read</button></div>
      <div className="card-grid rows-auto">
        <section className="card-x">
          <div className="card-x-head"><h4>Sector performance</h4><span className="muted">{m.date} · average change</span></div>
          <div className="heat">
            {m.sectors.map((s) => (
              <div key={s.name} className="heat-tile" style={{ background: tint(s.change) }} title={`${s.name}: ${pct(s.change)}${s.pe != null ? ` · P/E ${s.pe.toFixed(1)}` : ''}`}>
                <span>{s.name}</span><b className={cls(s.change)}>{pct(s.change)}</b>
              </div>
            ))}
          </div>
          {m.sectors.length === 0 && <div className="muted">No sector data for this day and exchange.</div>}
        </section>

        <section className="card-x">
          <div className="card-x-head"><h4>Sector valuation</h4><span className="muted">price / earnings{peAvg != null ? ` · average of sectors ${peAvg.toFixed(1)}` : ''}</span></div>
          {byPe.length === 0 ? <div className="muted">No P/E data.</div> : (
            <div className="pebars">
              {byPe.map((s) => (
                <div key={s.name} className="pe-row" title={`${s.name}: P/E ${s.pe!.toFixed(1)}`}>
                  <span>{s.name}</span>
                  <div className="pe-bar"><i style={{ width: `${(s.pe! / peMax) * 100}%` }} />{peAvg != null && <em style={{ left: `${(peAvg / peMax) * 100}%` }} />}</div>
                  <b>{s.pe!.toFixed(1)}</b>
                </div>
              ))}
            </div>
          )}
          <div className="muted note">A high P/E means investors pay more per dollar of earnings, usually for expected growth. It is a comparison, not a verdict: sectors differ structurally.</div>
        </section>
      </div>

      <div className="card-x opt-chain">
        <div className="card-x-head"><h4>Industries</h4><span className="muted">{industries.length} of {m.industries.length}</span>
          <div className="search-box news-filter"><input style={{ textTransform: 'none' }} placeholder="Filter industries…" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        <div className="mv-scroll">
          <table className="grid">
            <thead><tr>{head('Industry', 'name', false)}{head('Change', 'change')}<th className="pt-bar-col"></th>{head('P/E', 'pe')}</tr></thead>
            <tbody>{industries.map((i) => (
              <tr key={i.name}>
                <td>{i.name}</td><td style={{ textAlign: 'right' }} className={cls(i.change)}>{pct(i.change)}</td>
                <td className="pt-bar-col"><div className="dv-bar"><i className={cls(i.change)} style={{ width: `${Math.min(50, (Math.abs(i.change ?? 0) / 4) * 50)}%`, [(i.change ?? 0) >= 0 ? 'left' : 'right']: '50%' }} /></div></td>
                <td style={{ textAlign: 'right' }}>{i.pe != null ? i.pe.toFixed(1) : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="mv-filter">
        <b>Movers</b>
        <label>Min price <select value={filter.minPrice} onChange={(e) => f({ minPrice: Number(e.target.value) })}><option value={0}>Any</option><option value={1}>$1+</option><option value={5}>$5+</option><option value={10}>$10+</option><option value={20}>$20+</option></select></label>
        <label>Exchange <select value={filter.exchange} onChange={(e) => f({ exchange: e.target.value as MoverFilter['exchange'] })}><option value="all">All</option><option value="NASDAQ">NASDAQ</option><option value="NYSE">NYSE</option><option value="AMEX">AMEX</option></select></label>
        <label className="cx-check"><input type="checkbox" checked={filter.hideFunds} onChange={(e) => f({ hideFunds: e.target.checked })} /> Hide funds &amp; ETFs</label>
        <span className="muted">Raw lists are dominated by illiquid penny stocks, which move a lot on tiny volume. They are hard to trade and easy to lose money in.</span>
      </div>
      <div className="card-grid rows-auto mv-grid">
        <MoverList title="Biggest gainers" sub="today" list={filterMovers(m.gainers, filter)} onSelect={onSelectSymbol} />
        <MoverList title="Biggest losers" sub="today" list={filterMovers(m.losers, filter)} onSelect={onSelectSymbol} />
        <MoverList title="Most active" sub="top traded today" list={filterMovers(m.actives, filter)} onSelect={onSelectSymbol} />
      </div>
    </>
  )
}

const EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX']

export default function MarketView({ live, onSelectSymbol, onAskClaude, onOpenSettings }: { live: boolean; onSelectSymbol: (s: string) => void; onAskClaude: (t: string) => void; onOpenSettings: () => void }) {
  const [exchange, setExchange] = useState('NASDAQ')
  const [date, setDate] = useState('') // '' = latest trading day
  const force = useRef(false)
  const { data, error, loading, reload } = useAsync<MarketModel>(async () => { const f = force.current; force.current = false; return buildMarket(unwrap(await window.api.fmp.market({ exchange, date: date || undefined, force: f }))) }, [exchange, date], live)
  useEffect(() => { if (!live) return; const t = setInterval(reload, 60_000); return () => clearInterval(t) }, [live, exchange, date])

  return (
    <div className="col">
      <div className="pane-title"><span>Market Performance</span></div>
      <div className="pane-body pad screen"><div className="screen-inner wide">
        {!live ? <div className="muted">Market performance comes from Financial Modeling Prep. <a className="link" onClick={onOpenSettings}>Add your FMP key</a> to see it.</div> : (
          <>
            <div className="mv-bar">
              <label>Exchange <select className="tf-select" value={exchange} onChange={(e) => setExchange(e.target.value)}>{EXCHANGES.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Day <input className="tf-select" type="date" value={date || data?.date || ''} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></label>
              {date && <button className="btn small" onClick={() => setDate('')}>Latest</button>}
              <span className="muted asof-inline">{data?.asOf ? `Data as of ${formatClock(data.asOf, undefined, true)} ${tzAbbr(resolveTz(), data.asOf)}${ago(data.asOf) ? ` · ${ago(data.asOf)}` : ''} · cached to limit FMP requests` : ''}</span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn small" disabled={loading} onClick={() => { force.current = true; reload() }}><RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh</button>
            </div>
            {error && <div className="msg-error"><span>{error}</span><button onClick={reload}>Retry</button></div>}
            {loading && !data && <div className="muted">Loading…</div>}
            {data && <MarketBody key={data.exchange} m={data} onSelectSymbol={onSelectSymbol} onAskClaude={onAskClaude} />}
          </>
        )}
      </div></div>
    </div>
  )
}
