import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import ScreenFrame, { KV } from '../components/ScreenFrame'
import type { SymbolView } from '../components/SymbolTabs'
import { compact, money } from '../format'
import { fetchChain, fetchHv30 } from '../data/options'
import { useAsync } from '../data/fmp'
import { activity, atmIv, atmStrike, contractLabel, contractsFor, expectedMove, maxPain, mid, straddle, strikeRows, termStructure, type OptionContract, type OptionsChain } from '../../../shared/options'

const pc = (n: number | null, d = 1) => (n == null ? '—' : `${(n * 100).toFixed(d)}%`)
const f2 = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(2))
const f3 = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(3))

/** ATM implied volatility for each expiration: is the market pricing more movement near-term or later? */
function TermChart({ chain, selected }: { chain: OptionsChain; selected: string }) {
  const pts = termStructure(chain)
  if (pts.length < 2) return <div className="muted">Not enough expirations.</div>
  const W = 640, H = 170, L = 40, R = 12, T = 12, B = 24
  const maxD = Math.max(...pts.map((p) => p.dte)) || 1
  const lo = Math.min(...pts.map((p) => p.iv)), hi = Math.max(...pts.map((p) => p.iv)), pad = (hi - lo) * 0.15 || 0.02
  const x = (dte: number) => L + (dte / maxD) * (W - L - R)
  const y = (iv: number) => T + (1 - (iv - (lo - pad)) / (hi - lo + 2 * pad)) * (H - T - B)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${x(p.dte)} ${y(p.iv)}`).join(' ')
  return (
    <svg className="hist-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Implied volatility by expiration">
      {[lo, (lo + hi) / 2, hi].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid-line" /><text x={L - 6} y={y(v) + 3} textAnchor="end" className="axis">{(v * 100).toFixed(0)}%</text></g>)}
      <path d={d} className="hist-line" vectorEffect="non-scaling-stroke" />
      {pts.map((p) => <circle key={p.date} cx={x(p.dte)} cy={y(p.iv)} r={p.date === selected ? 5 : 3} className={p.date === selected ? 'pt-sel' : 'pt'}><title>{`${p.date} (${p.dte}d): ${(p.iv * 100).toFixed(1)}%`}</title></circle>)}
      <text x={L} y={H - 6} className="axis">{pts[0].dte}d</text><text x={W - R} y={H - 6} textAnchor="end" className="axis">{maxD}d</text>
    </svg>
  )
}

/** Open interest by strike for the selected expiration, with the price and max-pain strike marked. */
function OiChart({ cs, price, pain }: { cs: OptionContract[]; price: number; pain: number | null }) {
  const rows = strikeRows(cs, price, 14)
  if (rows.length < 2) return <div className="muted">No open interest data.</div>
  const W = 640, H = 170, L = 8, R = 8, T = 10, B = 22
  const max = Math.max(1, ...rows.flatMap((r) => [r.call?.oi ?? 0, r.put?.oi ?? 0]))
  const step = (W - L - R) / rows.length, bw = Math.max(2, step * 0.38)
  const xc = (i: number) => L + i * step + step / 2
  const yb = (v: number) => T + (1 - v / max) * (H - T - B)
  const posOf = (k: number) => { const i = rows.findIndex((r) => r.strike >= k); return i <= 0 ? 0 : xc(i - 1) + ((k - rows[i - 1].strike) / (rows[i].strike - rows[i - 1].strike)) * step }
  const labelEvery = Math.ceil(rows.length / 8)
  return (
    <svg className="hist-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Open interest by strike">
      {rows.map((r, i) => (
        <g key={r.strike}>
          <rect x={xc(i) - bw - 0.5} y={yb(r.call?.oi ?? 0)} width={bw} height={H - B - yb(r.call?.oi ?? 0)} fill="#26a69a"><title>{`${r.strike} calls: ${(r.call?.oi ?? 0).toLocaleString()} open interest`}</title></rect>
          <rect x={xc(i) + 0.5} y={yb(r.put?.oi ?? 0)} width={bw} height={H - B - yb(r.put?.oi ?? 0)} fill="#ef5350"><title>{`${r.strike} puts: ${(r.put?.oi ?? 0).toLocaleString()} open interest`}</title></rect>
          {i % labelEvery === 0 && <text x={xc(i)} y={H - 6} textAnchor="middle" className="axis">{r.strike}</text>}
        </g>
      ))}
      <line x1={posOf(price)} x2={posOf(price)} y1={T} y2={H - B} stroke="#3794ff" strokeDasharray="4 3" /><text x={posOf(price) + 4} y={T + 8} className="axis" fill="#3794ff">price</text>
      {pain != null && <><line x1={posOf(pain)} x2={posOf(pain)} y1={T} y2={H - B} stroke="#f5a623" strokeDasharray="2 3" /><text x={posOf(pain) + 4} y={T + 20} className="axis" fill="#f5a623">max pain</text></>}
    </svg>
  )
}

export function OptionsBody({ chain, hv, symbol, onAskClaude }: { chain: OptionsChain; hv: number | null; symbol: string; onAskClaude: (t: string) => void }) {
  const [exp, setExp] = useState<string>(() => (chain.expirations.find((e) => e.dte >= 7) ?? chain.expirations[0]).date)
  const [span, setSpan] = useState<string>('8')
  const [greeks, setGreeks] = useState(false)
  // a chain refresh can drop the expiration being viewed (e.g. it expired)
  useEffect(() => { if (!chain.expirations.some((e) => e.date === exp)) setExp((chain.expirations.find((e) => e.dte >= 7) ?? chain.expirations[0]).date) }, [chain])

  const cs = useMemo(() => contractsFor(chain, exp), [chain, exp])
  const dte = chain.expirations.find((e) => e.date === exp)?.dte ?? 0
  const all = useMemo(() => activity(chain.contracts), [chain])
  const one = useMemo(() => activity(cs), [cs])
  const iv = atmIv(cs, chain.price)
  const sd = iv != null ? expectedMove(chain.price, iv, dte) : null
  const st = straddle(cs, chain.price)
  const pain = useMemo(() => maxPain(cs), [cs])
  const rows = useMemo(() => strikeRows(cs, chain.price, span === 'all' ? null : Number(span)), [chain, cs, span])
  const atm = atmStrike(cs, chain.price)
  const busiest = useMemo(() => [...chain.contracts].filter((c) => c.volume > 0).sort((a, b) => b.volume - a.volume).slice(0, 8), [chain])
  const ivHv = chain.iv30 != null && hv != null && hv > 0 ? chain.iv30 / hv : null

  const explain = () => onAskClaude(`Explain the ${symbol} options chain to me as a beginner. Use get_options_chain (and get_quote) to read the real data, then walk me through what the implied volatility, expected move, put/call ratios and the near-the-money contracts are telling us, and what I should be careful about. Remember I can only paper-trade stocks here, so keep it educational.`)

  const cell = (c: OptionContract | undefined, price: number) => {
    const itm = c && (c.type === 'C' ? c.strike < price : c.strike > price)
    return { itm, c }
  }
  return (
        <>
          <div className="opt-note muted">Learning view: the paper account trades stocks, not options. One contract covers 100 shares, and quoted prices are per share.
            <button className="btn small" onClick={explain}><Sparkles size={12} /> Ask Claude to explain this</button></div>
          <div className="card-grid rows-auto">
            <section className="card-x">
              <div className="card-x-head"><h4>Volatility &amp; expected move</h4><span className="muted">{exp} · {dte} days</span></div>
              <KV data={{
                'Stock price': `${money(chain.price)}${chain.changePct != null ? `  (${chain.changePct >= 0 ? '+' : ''}${chain.changePct.toFixed(2)}%)` : ''}`,
                'Implied vol (30-day)': pc(chain.iv30), 'Historical vol (30-day)': pc(hv),
                'IV vs realised': ivHv != null ? `${ivHv.toFixed(2)}×  ${ivHv > 1.15 ? '(options look pricey)' : ivHv < 0.85 ? '(options look cheap)' : '(in line)'}` : '—',
                'ATM implied vol': pc(iv), 'Expected move': sd != null ? `±${money(sd)} (${((sd / chain.price) * 100).toFixed(1)}%)` : '—',
                'Range by expiry': sd != null ? `${money(chain.price - sd)} – ${money(chain.price + sd)}` : '—', 'ATM straddle': st ? `${money(st.cost)} @ ${st.strike}` : '—'
              }} />
              <div className="muted note">Expected move is the one-standard-deviation range the options market implies by the selected expiration; price finishes inside it about two times in three.</div>
            </section>

            <section className="card-x">
              <div className="card-x-head"><h4>Activity</h4><span className="muted">whole chain · selected expiration</span></div>
              <KV data={{
                'Put/call ratio (volume)': `${all?.pcVolume?.toFixed(2) ?? '—'}  ·  ${one.pcVolume?.toFixed(2) ?? '—'}`, 'Put/call ratio (open interest)': `${all?.pcOi?.toFixed(2) ?? '—'}  ·  ${one.pcOi?.toFixed(2) ?? '—'}`,
                'Call volume': `${compact(all?.callVolume ?? 0)}  ·  ${compact(one.callVolume)}`, 'Put volume': `${compact(all?.putVolume ?? 0)}  ·  ${compact(one.putVolume)}`,
                'Call open interest': `${compact(all?.callOi ?? 0)}  ·  ${compact(one.callOi)}`, 'Put open interest': `${compact(all?.putOi ?? 0)}  ·  ${compact(one.putOi)}`,
                'Max pain (this expiry)': pain != null ? money(pain) : '—'
              }} />
              <div className="muted note">A put/call ratio above 1 means more put than call activity, often read as caution. It is a crowd gauge, not a forecast.</div>
            </section>

            <section className="card-x">
              <div className="card-x-head"><h4>Implied volatility by expiration</h4><span className="muted">at-the-money</span></div>
              <TermChart chain={chain} selected={exp} />
              <div className="muted note">Rising to the right is normal. A curve sloping down (near-term above later) often signals expected news, such as earnings.</div>
            </section>

            <section className="card-x">
              <div className="card-x-head"><h4>Open interest by strike</h4><span className="muted">{exp}</span></div>
              <OiChart cs={cs} price={chain.price} pain={pain} />
              <div className="muted note"><i className="dot-g" /> calls <i className="dot-r" /> puts. Big clusters of open interest can act as magnets or barriers into expiration.</div>
            </section>

            <section className="card-x span-all">
              <div className="card-x-head"><h4>Most active contracts</h4><span className="muted">by volume today, all expirations</span></div>
              <table className="grid">
                <thead><tr><th>Contract</th><th style={{ textAlign: 'right' }}>Days</th><th style={{ textAlign: 'right' }}>Last</th><th style={{ textAlign: 'right' }}>Volume</th><th style={{ textAlign: 'right' }}>Open int.</th><th style={{ textAlign: 'right' }} title="Volume above open interest means new positions are being opened today">Vol / OI</th><th style={{ textAlign: 'right' }}>IV</th></tr></thead>
                <tbody>{busiest.map((c) => {
                  const ratio = c.oi ? c.volume / c.oi : null
                  return <tr key={`${c.exp}${c.type}${c.strike}`} className="opt-pick" onClick={() => setExp(c.exp)}><td><b className={c.type === 'C' ? 'up' : 'down'}>{contractLabel(c)}</b></td><td style={{ textAlign: 'right' }}>{chain.expirations.find((e) => e.date === c.exp)?.dte}</td><td style={{ textAlign: 'right' }}>{f2(c.last ?? mid(c))}</td><td style={{ textAlign: 'right' }}>{c.volume.toLocaleString()}</td><td style={{ textAlign: 'right' }}>{c.oi.toLocaleString()}</td><td style={{ textAlign: 'right' }} className={ratio != null && ratio > 1 ? 'up' : ''}>{ratio != null ? ratio.toFixed(2) : '—'}</td><td style={{ textAlign: 'right' }}>{pc(c.iv)}</td></tr>
                })}</tbody>
              </table>
            </section>
          </div>

          <div className="card-x opt-chain">
            <div className="card-x-head"><h4>Option chain</h4>
              <select className="tf-select" value={exp} onChange={(e) => setExp(e.target.value)}>{chain.expirations.map((e) => <option key={e.date} value={e.date}>{e.date} · {e.dte}d</option>)}</select>
              <select className="tf-select" value={span} onChange={(e) => setSpan(e.target.value)}><option value="6">±6 strikes</option><option value="8">±8 strikes</option><option value="15">±15 strikes</option><option value="all">All strikes</option></select>
              <label className="cx-check"><input type="checkbox" checked={greeks} onChange={(e) => setGreeks(e.target.checked)} /> Greeks</label>
            </div>
            <div className="opt-scroll">
              <table className="grid chain">
                <thead>
                  <tr><th colSpan={greeks ? 9 : 6} className="ch-calls">Calls</th><th></th><th colSpan={greeks ? 9 : 6} className="ch-puts">Puts</th></tr>
                  <tr>
                    {greeks && <><th title="Vega: change in price per 1-point change in IV">Vega</th><th title="Theta: price lost per day from time passing">Theta</th><th title="Gamma: how fast delta changes">Gamma</th></>}
                    <th>Delta</th><th>IV</th><th>OI</th><th>Vol</th><th>Ask</th><th>Bid</th>
                    <th>Strike</th>
                    <th>Bid</th><th>Ask</th><th>Vol</th><th>OI</th><th>IV</th><th>Delta</th>
                    {greeks && <><th>Gamma</th><th>Theta</th><th>Vega</th></>}
                  </tr>
                </thead>
                <tbody>{rows.map((r) => {
                  const c = cell(r.call, chain.price), p = cell(r.put, chain.price)
                  return (
                    <tr key={r.strike} className={r.strike === atm ? 'atm' : ''}>
                      {greeks && <><td className={c.itm ? 'itm' : ''}>{f3(r.call?.vega)}</td><td className={c.itm ? 'itm' : ''}>{f3(r.call?.theta)}</td><td className={c.itm ? 'itm' : ''}>{f3(r.call?.gamma)}</td></>}
                      <td className={c.itm ? 'itm' : ''}>{f2(r.call?.delta)}</td><td className={c.itm ? 'itm' : ''}>{pc(r.call?.iv ?? null)}</td><td className={c.itm ? 'itm' : ''}>{r.call?.oi.toLocaleString() ?? '—'}</td><td className={c.itm ? 'itm' : ''}>{r.call?.volume.toLocaleString() ?? '—'}</td><td className={c.itm ? 'itm' : ''}>{f2(r.call?.ask)}</td><td className={c.itm ? 'itm' : ''}>{f2(r.call?.bid)}</td>
                      <td className="strike">{r.strike}</td>
                      <td className={p.itm ? 'itm' : ''}>{f2(r.put?.bid)}</td><td className={p.itm ? 'itm' : ''}>{f2(r.put?.ask)}</td><td className={p.itm ? 'itm' : ''}>{r.put?.volume.toLocaleString() ?? '—'}</td><td className={p.itm ? 'itm' : ''}>{r.put?.oi.toLocaleString() ?? '—'}</td><td className={p.itm ? 'itm' : ''}>{pc(r.put?.iv ?? null)}</td><td className={p.itm ? 'itm' : ''}>{f2(r.put?.delta)}</td>
                      {greeks && <><td className={p.itm ? 'itm' : ''}>{f3(r.put?.gamma)}</td><td className={p.itm ? 'itm' : ''}>{f3(r.put?.theta)}</td><td className={p.itm ? 'itm' : ''}>{f3(r.put?.vega)}</td></>}
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            <div className="muted note">Shaded cells are in the money. Delta is roughly the share exposure per contract (0.50 ≈ 50 shares) and a rough chance of finishing in the money. Wide bid–ask gaps mean expensive trading.</div>
          </div>
        </>
  )
}

export default function OptionsView({ symbol, onNavigate, live, onAskClaude }: { symbol: string; onNavigate: (v: SymbolView) => void; live: boolean; onAskClaude: (t: string) => void }) {
  const force = useRef(false)
  const { data: chain, error, loading, reload } = useAsync<OptionsChain>(async () => { const f = force.current; force.current = false; return fetchChain(symbol, f) }, [symbol])
  const [hv, setHv] = useState<number | null>(null)
  useEffect(() => { setHv(null); fetchHv30(symbol, live).then(setHv) }, [symbol, live])
  useEffect(() => { const t = setInterval(reload, 60_000); return () => clearInterval(t) }, [symbol])
  return (
    <ScreenFrame title="Option Stats" symbol={symbol} view="options" onNavigate={onNavigate} wide loading={loading && !chain} error={error} onRetry={reload}
      asOf={chain?.fetchedAt ?? null} asOfLabel={`prices are delayed about 15 minutes · ${chain?.source ?? 'Cboe'}`} onRefresh={() => { force.current = true; reload() }} refreshing={loading}>
      {chain && <OptionsBody key={chain.symbol} chain={chain} hv={hv} symbol={symbol} onAskClaude={onAskClaude} />}
    </ScreenFrame>
  )
}
