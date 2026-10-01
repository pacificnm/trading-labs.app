import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, RefreshCw, Sparkles } from 'lucide-react'
import { unwrap, useAsync } from '../data/fmp'
import { amountRange, DEFAULT_TRADE_FILTER, delayDays, filterTrades, groupMembers, isBuy, isSell, summarize, type TradeFilter } from '../data/congress'
import { formatClock, resolveTz, tzAbbr } from '../display'
import { ago } from '../components/NewsList'
import type { CongressTrade } from '../../../shared/fmp'

type Mode = 'latest' | 'symbol' | 'member'
type Chamber = 'both' | 'senate' | 'house'
const money0 = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`)
const CH: Record<string, string> = { senate: 'Senate', house: 'House' }

export function TradesTable({ trades, showMember = true, onSymbol }: { trades: CongressTrade[]; showMember?: boolean; onSymbol: (s: string) => void }) {
  if (trades.length === 0) return <div className="muted">No trades match.</div>
  return (
    <div className="cg-scroll">
      <table className="grid cg-table">
        <thead><tr><th>Disclosed</th><th>Traded</th>{showMember && <th>Member</th>}<th>Symbol</th><th>Asset</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th><th>Owner</th><th></th></tr></thead>
        <tbody>{trades.map((t, i) => {
          const d = delayDays(t)
          return (
            <tr key={`${t.chamber}${t.memberId}${t.traded}${t.symbol}${t.amount}${i}`}>
              <td>{t.disclosed}</td>
              <td>{t.traded}{d != null && <span className={'cg-delay' + (d > 45 ? ' late' : '')} title={d > 45 ? 'Filed after the 45-day deadline' : `Disclosed ${d} days after the trade`}>{d}d</span>}</td>
              {showMember && <td><b>{t.member}</b> <span className={'cg-ch ' + t.chamber}>{CH[t.chamber]}</span><div className="muted cg-sub">{t.district}</div></td>}
              <td>{t.symbol ? <a className="link" onClick={() => onSymbol(t.symbol)}>{t.symbol}</a> : <span className="muted">—</span>}</td>
              <td className="cg-asset" title={t.asset}>{t.asset}<div className="muted cg-sub">{t.assetType}</div></td>
              <td className={isBuy(t) ? 'up' : isSell(t) ? 'down' : ''}>{t.type}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{t.amount}</td>
              <td className="muted">{t.owner || '—'}</td>
              <td>{t.link && <button className="icon-btn" title="Open the official filing" onClick={() => window.api.openExternal(t.link)}><ExternalLink size={13} /></button>}</td>
            </tr>
          )
        })}</tbody>
      </table>
    </div>
  )
}

/** Summary, filters and table for a set of trades (shared by the three views). */
export function CongressResults({ trades, showMember = true, onSymbol, heading, extra }: { trades: CongressTrade[]; showMember?: boolean; onSymbol: (s: string) => void; heading?: string; extra?: React.ReactNode }) {
  const [f, setF] = useState<TradeFilter>(DEFAULT_TRADE_FILTER)
  const shown = useMemo(() => filterTrades(trades, f), [trades, f])
  const s = useMemo(() => summarize(shown), [shown])
  const owners = useMemo(() => [...new Set(trades.map((t) => t.owner).filter(Boolean))], [trades])
  const net = s.buyValue - s.sellValue
  return (
    <>
      <div className="card-grid rows-auto">
        <section className="card-x">
          <div className="card-x-head"><h4>{heading ?? 'Summary'}</h4><span className="muted">{s.from && s.to ? `trades ${s.from} to ${s.to}` : ''}</span></div>
          <div className="cg-stats">
            <div><span>Trades</span><b>{s.count}</b></div>
            <div><span>Purchases</span><b className="up">{s.buys}</b><em>≈ {money0(s.buyValue)}</em></div>
            <div><span>Sales</span><b className="down">{s.sells}</b><em>≈ {money0(s.sellValue)}</em></div>
            <div><span>Net (est.)</span><b className={net >= 0 ? 'up' : 'down'}>{net >= 0 ? '+' : '-'}{money0(Math.abs(net))}</b><em>{net >= 0 ? 'net buying' : 'net selling'}</em></div>
            <div><span>Median filing delay</span><b>{s.medianDelay != null ? `${s.medianDelay}d` : '—'}</b><em>{s.maxDelay != null ? `up to ${s.maxDelay}d` : ''}</em></div>
          </div>
          <div className="muted note">Amounts are filed as ranges, so dollar figures use each range's midpoint. Trades are public only after filing (up to 45 days later), so this is history, not a live signal.</div>
        </section>
        <section className="card-x">
          <div className="card-x-head"><h4>Most traded</h4><span className="muted">in the current view</span></div>
          <div className="cg-chips"><span className="muted">Symbols</span>{s.topSymbols.length === 0 && <span className="muted">none</span>}
            {s.topSymbols.map((x) => <button key={x.symbol} className="cg-chip" onClick={() => onSymbol(x.symbol)} title={`${x.count} trades by ${x.members} member${x.members === 1 ? '' : 's'}: ${x.buys} purchases, ${x.sells} sales${x.members === 1 ? '. Many filings from one member is usually a single position being built or sold.' : ''}`}>{x.symbol} <b>{x.count}</b>{x.members > 1 && <span className="muted"> · {x.members} members</span>}</button>)}</div>
          {showMember && <div className="cg-chips"><span className="muted">Members</span>{s.topMembers.map((x) => <span key={x.chamber + x.memberId} className="cg-chip static">{x.member} <b>{x.count}</b></span>)}</div>}
          <div className="cg-chips"><span className="muted">Assets</span>{s.assetTypes.slice(0, 6).map((x) => <span key={x.type} className="cg-chip static">{x.type} <b>{x.count}</b></span>)}</div>
        </section>
      </div>
      {extra}
      <div className="card-x opt-chain">
        <div className="card-x-head"><h4>Disclosures</h4><span className="muted">{shown.length} of {trades.length}</span>
          <select className="tf-select" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as TradeFilter['kind'] })}><option value="all">Buys and sales</option><option value="buys">Purchases only</option><option value="sells">Sales only</option></select>
          <select className="tf-select" value={f.assetType} onChange={(e) => setF({ ...f, assetType: e.target.value as TradeFilter['assetType'] })}><option value="all">All assets</option><option value="stocks">Stocks only</option></select>
          {owners.length > 0 && <select className="tf-select" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })}><option value="all">Any owner</option>{owners.map((o) => <option key={o}>{o}</option>)}</select>}
          <div className="search-box news-filter"><input style={{ textTransform: 'none' }} placeholder="Filter…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div></div>
        <TradesTable trades={shown} showMember={showMember} onSymbol={onSymbol} />
      </div>
    </>
  )
}

export default function CongressView({ live, symbol, onSelectSymbol, onAskClaude, onOpenSettings }: { live: boolean; symbol: string; onSelectSymbol: (s: string) => void; onAskClaude: (t: string) => void; onOpenSettings: () => void }) {
  const [mode, setMode] = useState<Mode>('latest')
  const [chamber, setChamber] = useState<Chamber>('both')
  const [pages, setPages] = useState(1)
  const [symText, setSymText] = useState(symbol)
  const [sym, setSym] = useState(symbol)
  const [nameText, setNameText] = useState('')
  const [name, setName] = useState('')
  const [pick, setPick] = useState<string | null>(null)
  const force = useRef(false)
  useEffect(() => { setSymText(symbol); setSym(symbol) }, [symbol])

  const enabled = live && (mode === 'latest' || (mode === 'symbol' && !!sym) || (mode === 'member' && name.length >= 2))
  const { data, error, loading, reload } = useAsync(async () => {
    const f = force.current; force.current = false
    if (mode === 'latest') {
      const all = await Promise.all(Array.from({ length: pages }, (_, p) => window.api.fmp.congress({ kind: 'latest', chamber, page: p, limit: 100, force: f && p === 0 }).then(unwrap)))
      return { trades: all.flatMap((r) => r.trades), asOf: all[0].asOf }
    }
    return unwrap(await window.api.fmp.congress(mode === 'symbol' ? { kind: 'symbol', chamber, symbol: sym, force: f } : { kind: 'name', chamber, name, force: f }))
  }, [mode, chamber, pages, sym, name], enabled)
  useEffect(() => { setPick(null) }, [name, chamber])

  const members = useMemo(() => (mode === 'member' && data ? groupMembers(data.trades) : []), [mode, data])
  const memberKey = pick ?? (members.length === 1 ? members[0].key : null)
  const memberTrades = useMemo(() => (memberKey && data ? data.trades.filter((t) => `${t.chamber}:${t.memberId || t.member}` === memberKey) : []), [memberKey, data])
  const ask = () => onAskClaude(mode === 'symbol' ? `Use get_congress_trades to look at how members of Congress have traded ${sym}. Summarise who traded, buys versus sells, and what a beginner should and should not conclude from it.`
    : mode === 'member' && memberTrades[0] ? `Use get_congress_trades to look at ${memberTrades[0].member}'s reported trades and summarise the pattern: what they trade, buys versus sells, filing delays, and how much weight to put on it.`
    : 'Use get_congress_trades to summarise the latest Senate and House disclosures: what is being bought and sold, whether several members are trading the same names, and what a beginner should be careful about when reading this data.')

  const body = mode === 'member' && memberKey ? memberTrades : data?.trades ?? []
  const name0 = memberTrades[0]
  return (
    <div className="col">
      <div className="pane-title"><span>Senate &amp; House Trades</span></div>
      <div className="subtabs">
        {([['latest', 'Latest disclosures'], ['symbol', 'By symbol'], ['member', 'By member']] as [Mode, string][]).map(([id, l]) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}>{l}</button>)}
        <span className="spacer" style={{ flex: 1 }} />
        <select className="tf-select" title="Chamber" value={chamber} onChange={(e) => { setChamber(e.target.value as Chamber); setPages(1) }}><option value="both">Senate + House</option><option value="senate">Senate only</option><option value="house">House only</option></select>
      </div>
      <div className="pane-body pad screen"><div className="screen-inner full">
        {!live ? <div className="muted">Congressional disclosures come from Financial Modeling Prep. <a className="link" onClick={onOpenSettings}>Add your FMP key</a> to see them.</div> : (
          <>
            <div className="mv-bar">
              {mode === 'symbol' && <label>Symbol <input className="tf-select" style={{ width: 90 }} value={symText} onChange={(e) => setSymText(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && setSym(symText.trim())} /><button className="btn small" onClick={() => setSym(symText.trim())}>Look up</button></label>}
              {mode === 'member' && <label>Member <input className="tf-select" style={{ width: 200 }} placeholder="first or last name, e.g. Pelosi" value={nameText} onChange={(e) => setNameText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setName(nameText.trim())} /><button className="btn small" onClick={() => setName(nameText.trim())}>Search</button></label>}
              <span className="muted asof-inline">{data?.asOf ? `Data as of ${formatClock(data.asOf, undefined, true)} ${tzAbbr(resolveTz(), data.asOf)}${ago(data.asOf) ? ` · ${ago(data.asOf)}` : ''} · cached to limit FMP requests` : ''}</span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn small" onClick={ask}><Sparkles size={12} /> Ask Claude</button>
              <button className="btn small" disabled={loading || !enabled} onClick={() => { force.current = true; reload() }}><RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh</button>
            </div>
            <div className="opt-note muted">Members of Congress must report securities trades, but only within 45 days, and only as dollar ranges. It is a fascinating dataset and a poor trading signal: by the time you see a trade, the price has usually moved. Not investment advice.</div>
            {mode === 'member' && name.length < 2 && <div className="muted">Search a member by first or last name to see their reported trades and a profile built from them.</div>}
            {error && <div className="msg-error"><span>{error}</span><button onClick={reload}>Retry</button></div>}
            {loading && !data && enabled && <div className="muted">Loading…</div>}
            {mode === 'member' && members.length > 1 && (
              <div className="cg-chips" style={{ marginBottom: 12 }}><span className="muted">{members.length} members match “{name}”:</span>
                {members.map((m) => <button key={m.key} className={'cg-chip' + (m.key === memberKey ? ' on' : '')} onClick={() => setPick(m.key)}>{m.member} <span className="muted">({CH[m.chamber]}, {m.district})</span> <b>{m.count}</b></button>)}
              </div>
            )}
            {data && (mode !== 'member' || memberKey) && (
              <CongressResults key={mode + (memberKey ?? sym)} trades={body} showMember={mode !== 'member'} onSymbol={onSelectSymbol}
                heading={mode === 'member' && name0 ? `${name0.member} · ${CH[name0.chamber]}, ${name0.district}` : mode === 'symbol' ? `${sym} in Congress` : 'Latest filings'} />
            )}
            {data && mode === 'latest' && (
              <div className="news-more"><button className="btn" disabled={loading} onClick={() => setPages((p) => p + 1)}>{loading ? 'Loading…' : 'Load older disclosures'}</button></div>
            )}
          </>
        )}
      </div></div>
    </div>
  )
}
