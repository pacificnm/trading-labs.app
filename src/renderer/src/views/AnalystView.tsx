import { RangeBar, KV } from '../components/ScreenFrame'
import ScreenFrame from '../components/ScreenFrame'
import type { SymbolView } from '../components/SymbolTabs'
import { sampleAnalyst, money } from '../data/sample'
import { pick, pickStr, unwrap, useAsync } from '../data/fmp'
import { useRef, type ReactNode } from 'react'
import type { FmpAnalyst, FmpOverview } from '../../../shared/fmp'

const COLORS: Record<string, string> = { 'Strong Buy': '#1b9e77', Buy: '#26a69a', Hold: '#f5a623', Sell: '#ef5350', 'Strong Sell': '#b71c1c' }
const SCORE_ROWS: [string, string][] = [['dcf', 'Discounted cash flow'], ['roe', 'Return on equity'], ['roa', 'Return on assets'], ['de', 'Debt to equity'], ['pe', 'Price to earnings'], ['pb', 'Price to book']]

export interface View {
  counts: Record<string, number>
  consensus: string
  price: number | null
  low: number | null; avg: number | null; high: number | null; median: number | null
  summary: { label: string; count: number | null; avg: number | null }[]
  publishers: string[]
  snapshot: { letter: string; overall: number; scores: Record<string, number | null> } | null
  history: { date: string; score: number; letter: string }[] // oldest first
  reports: { date: string; firm: string; action: string; from: string; to: string }[]
  estimates: EstRow[]
  asOf: number | null
}

export interface EstRow {
  year: string; actual: boolean
  /** actual when reported, otherwise the consensus estimate */
  revenue: number | null; epsVal: number | null
  revLow: number | null; revHigh: number | null; epsLow: number | null; epsHigh: number | null
  nRev: number | null; nEps: number | null
  /** for reported years: % by which the actual beat (+) or missed (-) the consensus */
  revBeat: number | null; epsBeat: number | null
}

const letterColor = (l: string) => ({ A: '#1b9e77', B: '#7cc47a', C: '#f5a623', D: '#ef8a3d', F: '#ef5350' })[l[0]?.toUpperCase()] ?? '#9e9e9e'
const pctVs = (target: number | null, price: number | null) => (target != null && price ? ((target - price) / price) * 100 : null)
const compactMoney = (n: number) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const pctText = (n: number | null) => (n == null ? '' : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`)

function Card({ title, sub, span, children }: { title: string; sub?: string; span?: boolean; children: ReactNode }) {
  return (
    <section className={'card-x' + (span ? ' span-all' : '')}>
      <div className="card-x-head"><h4>{title}</h4>{sub && <span className="muted">{sub}</span>}</div>
      {children}
    </section>
  )
}

function Pips({ n }: { n: number | null }) {
  return <span className="pips" title={n == null ? 'n/a' : `${n} out of 5`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={n != null && i <= n ? 'on' : ''} data-lvl={n ?? 0} />)}</span>
}

/** Overall rating score (1 to 5) over time, as a step line. */
function HistoryChart({ data }: { data: View['history'] }) {
  if (data.length < 2) return <div className="muted">Not enough history.</div>
  const W = 640, H = 150, L = 24, R = 8, T = 8, B = 20
  const x = (i: number) => L + (i / (data.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - 1) / 4) * (H - T - B)
  let d = `M ${x(0)} ${y(data[0].score)}`
  data.forEach((p, i) => { if (i > 0) d += ` H ${x(i)} V ${y(p.score)}` })
  const changes = data.map((p, i) => ({ p, i })).filter(({ p, i }) => i > 0 && p.letter !== data[i - 1].letter)
  return (
    <svg className="hist-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Overall rating score over time">
      {[1, 2, 3, 4, 5].map((v) => (<g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid-line" /><text x={L - 6} y={y(v) + 3} textAnchor="end" className="axis">{v}</text></g>))}
      <path d={d} className="hist-line" vectorEffect="non-scaling-stroke" />
      {changes.map(({ p, i }) => <circle key={i} cx={x(i)} cy={y(p.score)} r="3.5" fill={letterColor(p.letter)}><title>{`${p.date}: ${data[i - 1].letter} → ${p.letter}`}</title></circle>)}
      <text x={L} y={H - 4} className="axis">{data[0].date}</text>
      <text x={W - R} y={H - 4} textAnchor="end" className="axis">{data[data.length - 1].date}</text>
    </svg>
  )
}

export function buildAnalystView(a: FmpAnalyst, o: FmpOverview): View {
  const sm = a.targetSummary, sn = a.snapshot
  const history = [...a.ratingsHistory].reverse().map((h) => ({ date: pickStr(h, 'date').slice(0, 10), score: pick(h, 'overallScore') ?? 0, letter: pickStr(h, 'rating') })).filter((h) => h.score > 0)
  let publishers: string[] = []
  try { publishers = JSON.parse(pickStr(sm, 'publishers') || '[]') } catch { /* ignore */ }
  return {
    counts: { 'Strong Buy': pick(a.consensus, 'strongBuy') ?? 0, Buy: pick(a.consensus, 'buy') ?? 0, Hold: pick(a.consensus, 'hold') ?? 0, Sell: pick(a.consensus, 'sell') ?? 0, 'Strong Sell': pick(a.consensus, 'strongSell') ?? 0 },
    consensus: pickStr(a.consensus, 'consensus'), price: pick(o.quote, 'price'),
    low: pick(a.targets, 'targetLow'), avg: pick(a.targets, 'targetConsensus'), high: pick(a.targets, 'targetHigh'), median: pick(a.targets, 'targetMedian'),
    summary: [['Last month', 'lastMonth'], ['Last quarter', 'lastQuarter'], ['Last year', 'lastYear'], ['All time', 'allTime']].map(([label, k]) => ({ label, count: pick(sm, `${k}Count`), avg: pick(sm, `${k}AvgPriceTarget`) })),
    publishers,
    snapshot: sn ? { letter: pickStr(sn, 'rating'), overall: pick(sn, 'overallScore') ?? 0, scores: { dcf: pick(sn, 'discountedCashFlowScore'), roe: pick(sn, 'returnOnEquityScore'), roa: pick(sn, 'returnOnAssetsScore'), de: pick(sn, 'debtToEquityScore'), pe: pick(sn, 'priceToEarningsScore'), pb: pick(sn, 'priceToBookScore') } } : null,
    history,
    reports: a.grades.map((g) => ({ date: pickStr(g, 'date').slice(0, 10), firm: pickStr(g, 'gradingCompany'), action: pickStr(g, 'action'), from: pickStr(g, 'previousGrade'), to: pickStr(g, 'newGrade') })),
    estimates: buildEstimates(a),
    asOf: a.asOf
  }
}

/** Fiscal years from the last reported one onward. Reported years show the actual and how it compared with consensus. */
export function buildEstimates(a: FmpAnalyst, now = Date.now()): EstRow[] {
  const byDate = new Map(a.actuals.map((r) => [pickStr(r, 'date').slice(0, 10), r]))
  const rows = [...a.estimates].sort((x, y) => pickStr(x, 'date').localeCompare(pickStr(y, 'date')))
  const cutoff = new Date(now - 420 * 86400000).toISOString().slice(0, 10)
  const out: EstRow[] = rows.filter((r) => pickStr(r, 'date').slice(0, 10) >= cutoff).map((r) => {
    const date = pickStr(r, 'date').slice(0, 10)
    const act = byDate.get(date) ?? null
    const estRev = pick(r, 'revenueAvg'), estEps = pick(r, 'epsAvg')
    const aRev = pick(act, 'revenue'), aEps = pick(act, 'epsDiluted', 'epsdiluted', 'eps')
    const beat = (actual: number | null, est: number | null) => (actual != null && est ? ((actual - est) / Math.abs(est)) * 100 : null)
    return {
      year: date.slice(0, 4), actual: act != null,
      revenue: aRev ?? estRev, epsVal: aEps ?? estEps,
      revLow: pick(r, 'revenueLow'), revHigh: pick(r, 'revenueHigh'), epsLow: pick(r, 'epsLow'), epsHigh: pick(r, 'epsHigh'),
      nRev: pick(r, 'numAnalystsRevenue'), nEps: pick(r, 'numAnalystsEps'),
      revBeat: beat(aRev, estRev), epsBeat: beat(aEps, estEps)
    }
  })
  return out.slice(0, 5)
}

export default function AnalystView({ symbol, onNavigate, live }: { symbol: string; onNavigate: (v: SymbolView) => void; live: boolean }) {
  const force = useRef(false)
  const { data, error, loading, reload } = useAsync<View>(async () => {
    const f = force.current; force.current = false
    const [a, o] = await Promise.all([window.api.fmp.analyst(symbol, f).then(unwrap), window.api.fmp.overview(symbol, f).then(unwrap)])
    return buildAnalystView(a, o)
  }, [symbol], live)

  let v: View | null = data
  if (!live) {
    const s = sampleAnalyst(symbol)
    const letters = s.history.map((h) => ['F', 'D', 'C', 'B', 'A'][h.score - 1])
    v = {
      counts: s.counts, consensus: 'Buy', price: s.price, low: s.low, avg: s.avg, high: s.high, median: s.median,
      summary: [['Last month', s.summary.month], ['Last quarter', s.summary.quarter], ['Last year', s.summary.year], ['All time', s.summary.all]].map(([label, x]) => ({ label: label as string, count: (x as { count: number }).count, avg: (x as { avg: number }).avg })),
      publishers: [], snapshot: { letter: s.snapshot.letter, overall: s.snapshot.overall, scores: s.snapshot.scores },
      history: s.history.map((h, i) => ({ date: h.date, score: h.score, letter: letters[i] })).reverse(),
      reports: s.reports.map((r) => ({ date: r.date, firm: r.firm, action: r.action, from: '', to: r.rating })),
      estimates: s.estimates.map((e) => ({ year: e.year, actual: e.actual, revenue: e.revenue, epsVal: e.epsVal, revLow: e.revLow, revHigh: e.revHigh, epsLow: e.epsLow, epsHigh: e.epsHigh, nRev: e.nRev, nEps: e.nEps, revBeat: e.revBeat, epsBeat: e.epsBeat })),
      asOf: null
    }
  }
  const total = v ? Object.values(v.counts).reduce((s, n) => s + n, 0) : 0
  const maxAvg = v ? Math.max(...v.summary.map((x) => x.avg ?? 0), v.price ?? 0) : 0

  return (
    <ScreenFrame title="Analyst Reports" symbol={symbol} view="analyst" onNavigate={onNavigate} wide sample={!live} loading={live && loading && !v} error={error} onRetry={reload}
      asOf={live ? v?.asOf ?? null : null} onRefresh={() => { force.current = true; reload() }} refreshing={loading}>
      {v && (
        <>
        <div className="card-grid">
          <Card title="Analyst consensus" sub={total > 0 ? `${total} analysts` : undefined}>
            {total > 0 ? (
              <>
                {v.consensus && <div className="big-verdict" style={{ color: COLORS[v.consensus] ?? undefined }}>{v.consensus}</div>}
                <div className="stack">{Object.entries(v.counts).map(([k, n]) => n > 0 && <div key={k} style={{ width: `${(n / total) * 100}%`, background: COLORS[k] }} title={`${k}: ${n}`}>{n}</div>)}</div>
                <div className="legend">{Object.keys(v.counts).map((k) => <span key={k}><i style={{ background: COLORS[k] }} />{k}</span>)}</div>
              </>
            ) : <div className="muted">No analyst rating summary available.</div>}
          </Card>

          <Card title="Price target consensus">
            {v.low != null && v.high != null && v.price != null ? (
              <>
                <RangeBar label={`Range ${money(v.low)} – ${money(v.high)} · current ${money(v.price)}`} low={Math.min(v.low, v.price)} high={Math.max(v.high, v.price)} value={v.price} fmt={(n) => n.toFixed(0)} />
                <KV data={{
                  Consensus: v.avg != null ? `${money(v.avg)}  (${pctText(pctVs(v.avg, v.price))})` : '—',
                  Median: v.median != null ? `${money(v.median)}  (${pctText(pctVs(v.median, v.price))})` : '—',
                  High: `${money(v.high)}  (${pctText(pctVs(v.high, v.price))})`, Low: `${money(v.low)}  (${pctText(pctVs(v.low, v.price))})`
                }} />
              </>
            ) : <div className="muted">No price targets available.</div>}
          </Card>

          <Card title="Price target trend" sub="average target by period">
            {v.summary.some((x) => x.avg != null) ? (
              <>
                <table className="grid pt-table">
                  <thead><tr><th>Period</th><th style={{ textAlign: 'right' }}>Targets</th><th style={{ textAlign: 'right' }}>Average</th><th style={{ textAlign: 'right' }}>vs price</th><th className="pt-bar-col"></th></tr></thead>
                  <tbody>{v.summary.map((x) => {
                    const d = pctVs(x.avg, v.price)
                    return (
                      <tr key={x.label}>
                        <td>{x.label}</td><td style={{ textAlign: 'right' }}>{x.count ?? '—'}</td><td style={{ textAlign: 'right' }}>{x.avg != null ? money(x.avg) : '—'}</td>
                        <td style={{ textAlign: 'right' }} className={d == null ? '' : d >= 0 ? 'up' : 'down'}>{pctText(d)}</td>
                        <td className="pt-bar-col"><div className="pt-bar"><i style={{ width: `${maxAvg && x.avg ? (x.avg / maxAvg) * 100 : 0}%` }} /></div></td>
                      </tr>
                    )
                  })}</tbody>
                </table>
                {v.publishers.length > 0 && <div className="pub-chips"><span className="muted">Sources:</span>{v.publishers.map((p) => <span key={p} className="pub-chip">{p}</span>)}</div>}
              </>
            ) : <div className="muted">No price target history available.</div>}
          </Card>

          <Card title="Ratings snapshot" sub="FMP's own score, not an analyst opinion">
            {v.snapshot ? (
              <div className="snap">
                <div className="snap-grade" style={{ borderColor: letterColor(v.snapshot.letter), color: letterColor(v.snapshot.letter) }}>
                  <b>{v.snapshot.letter || '—'}</b><span>overall {v.snapshot.overall}/5</span>
                </div>
                <div className="snap-rows">
                  {SCORE_ROWS.map(([k, label]) => <div key={k}><span>{label}</span><Pips n={v!.snapshot!.scores[k] ?? null} /></div>)}
                </div>
              </div>
            ) : <div className="muted">No rating snapshot available.</div>}
            <div className="muted note">Each factor is scored 1 (weak) to 5 (strong) from the company's financials and valuation.</div>
          </Card>

          <Card title="Rating history" sub={v.history.length ? `${v.history[0].date} to ${v.history[v.history.length - 1].date}` : undefined}>
            {v.history.length > 1 ? (
              <>
                <HistoryChart data={v.history} />
                <div className="muted note">Overall score (1–5) over time. Dots mark days the letter grade changed.</div>
              </>
            ) : <div className="muted">No rating history available.</div>}
          </Card>

          <Card title="Analyst estimates" sub="consensus by fiscal year">
            {v.estimates.length > 0 ? (
              <>
                <table className="grid est-table">
                  <thead><tr><th>FY</th><th style={{ textAlign: 'right' }}>Revenue</th><th style={{ textAlign: 'right' }}>Growth</th><th style={{ textAlign: 'right' }}>EPS</th><th style={{ textAlign: 'right' }}>Growth</th><th style={{ textAlign: 'right' }}>Analysts</th></tr></thead>
                  <tbody>{v.estimates.map((e, i) => {
                    const prev = v.estimates[i - 1]
                    const g = (cur: number | null, p: number | null) => (cur != null && p ? ((cur - p) / Math.abs(p)) * 100 : null)
                    const rg = g(e.revenue, prev?.revenue ?? null), eg = g(e.epsVal, prev?.epsVal ?? null)
                    return (
                      <tr key={e.year} className={e.actual ? 'est-actual' : ''}>
                        <td><b>{e.year}</b> <span className={'est-tag' + (e.actual ? ' a' : '')}>{e.actual ? 'reported' : 'est.'}</span></td>
                        <td style={{ textAlign: 'right' }} title={e.revLow != null && e.revHigh != null ? `Estimate range $${compactMoney(e.revLow)} – $${compactMoney(e.revHigh)}` : undefined}>
                          {e.revenue != null ? `$${compactMoney(e.revenue)}` : '—'}
                          {e.revBeat != null && <div className={'est-beat ' + (e.revBeat >= 0 ? 'up' : 'down')}>{e.revBeat >= 0 ? 'beat' : 'missed'} {pctText(e.revBeat)}</div>}
                        </td>
                        <td style={{ textAlign: 'right' }} className={rg == null ? '' : rg >= 0 ? 'up' : 'down'}>{pctText(rg)}</td>
                        <td style={{ textAlign: 'right' }} title={e.epsLow != null && e.epsHigh != null ? `Estimate range $${e.epsLow.toFixed(2)} – $${e.epsHigh.toFixed(2)}` : undefined}>
                          {e.epsVal != null ? `$${e.epsVal.toFixed(2)}` : '—'}
                          {e.epsBeat != null && <div className={'est-beat ' + (e.epsBeat >= 0 ? 'up' : 'down')}>{e.epsBeat >= 0 ? 'beat' : 'missed'} {pctText(e.epsBeat)}</div>}
                        </td>
                        <td style={{ textAlign: 'right' }} className={eg == null ? '' : eg >= 0 ? 'up' : 'down'}>{pctText(eg)}</td>
                        <td style={{ textAlign: 'right' }} className="muted">{e.nEps ?? '—'}</td>
                      </tr>
                    )
                  })}</tbody>
                </table>
                <div className="muted note">Reported years show actual results and how they compared with what analysts expected. Hover an estimate to see its low–high range. Few analysts cover the far years, so treat them loosely.</div>
              </>
            ) : <div className="muted">No estimates available.</div>}
          </Card>
        </div>

        <div style={{ marginTop: 14 }}>
          <Card title="Recent rating changes">
            {v.reports.length === 0 ? <div className="muted">None available.</div> : (
              <table className="grid">
                <thead><tr><th>Date</th><th>Firm</th><th>Action</th><th>Rating</th></tr></thead>
                <tbody>{v.reports.map((r, i) => <tr key={i}><td>{r.date}</td><td>{r.firm}</td><td>{r.action}</td><td>{r.from && r.from !== r.to ? `${r.from} → ${r.to}` : r.to}</td></tr>)}</tbody>
              </table>
            )}
          </Card>
        </div>
        </>
      )}
    </ScreenFrame>
  )
}
