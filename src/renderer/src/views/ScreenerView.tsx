import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Plus, RefreshCw, RotateCcw, Search, Sparkles, ListPlus } from 'lucide-react'
import { unwrap, useAsync } from '../data/fmp'
import { applyClientFilters, csv, toToolArgs, DEFAULT_FILTERS, dividendYield, hasClientFilters, presetFilters, PRESETS, relVolume, sortRows, summarize, toQuery, type Filters, type SortKey } from '../data/screener'
import { formatClock, resolveTz, tzAbbr } from '../display'
import { ago } from '../components/NewsList'
import { money } from '../data/sample'
import { toast } from '../toast'
import { promptText } from '../dialog'
import type { FmpScreenerOptions, ScreenerRow } from '../../../shared/fmp'

const cap = (n: number | null) => (n == null ? '—' : n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : `$${n.toLocaleString()}`)
const vol = (n: number | null) => (n == null ? '—' : Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n))
const SIZES: [string, string, string][] = [['', '', 'Any size'], ['0', '300', 'Micro (< $300M)'], ['300', '2000', 'Small ($300M – $2B)'], ['2000', '10000', 'Mid ($2B – $10B)'], ['10000', '200000', 'Large ($10B – $200B)'], ['200000', '', 'Mega (> $200B)']]

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="sc-f"><span>{label}{hint && <em> {hint}</em>}</span>{children}</label>
}

export function ScreenerResults({ rows, fetched, truncated, onSymbol, onAdd, onSaveList, onAsk }: {
  rows: ScreenerRow[]; fetched: number; truncated: boolean; onSymbol: (s: string) => void; onAdd: (s: string) => void; onSaveList: (rows: ScreenerRow[]) => void; onAsk: () => void
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'marketCap', dir: -1 })
  const [shown, setShown] = useState(100)
  const sorted = useMemo(() => sortRows(rows, sort.key, sort.dir), [rows, sort])
  const sum = useMemo(() => summarize(rows), [rows])
  const th = (label: string, key: SortKey, left = false) => (
    <th className="sortable" style={{ textAlign: left ? 'left' : 'right' }} onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'symbol' || key === 'name' ? 1 : -1 }))}>{label}{sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</th>
  )
  return (
    <div className="card-x opt-chain">
      <div className="card-x-head"><h4>Results</h4>
        <span className="muted">{rows.length.toLocaleString()} match{rows.length === 1 ? '' : 'es'}{fetched !== rows.length ? ` of ${fetched.toLocaleString()} checked` : ''}{truncated ? ' (more exist: the list is capped, so raise the result limit or add filters)' : ''}</span>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn small" disabled={!rows.length} onClick={onAsk}><Sparkles size={12} /> Ask Claude</button>
        <button className="btn small" disabled={!rows.length} onClick={() => onSaveList(sorted.slice(0, 50))}><ListPlus size={12} /> Save top 50 as watchlist</button>
        <button className="btn small" disabled={!rows.length} onClick={() => { navigator.clipboard.writeText(csv(sorted)); toast.success(`Copied ${sorted.length} rows as CSV`) }}><Copy size={12} /> Copy CSV</button>
      </div>
      {rows.length > 0 && (
        <div className="cg-chips"><span className="muted">Median market cap {cap(sum.medianCap)}</span>
          {sum.sectors.map((s) => <span key={s.name} className="cg-chip static">{s.name} <b>{s.count}</b></span>)}</div>
      )}
      {rows.length === 0 ? <div className="muted">No stocks match. Loosen a filter, for example lower the market cap or volume minimum.</div> : (
        <div className="cg-scroll sc-scroll">
          <table className="grid cg-table">
            <thead><tr>{th('Symbol', 'symbol', true)}{th('Company', 'name', true)}<th>Sector / industry</th>{th('Market cap', 'marketCap')}{th('Price', 'price')}{th('Volume', 'volume')}{th('Rel. vol', 'relVol')}{th('Beta', 'beta')}{th('Yield', 'yield')}<th></th></tr></thead>
            <tbody>{sorted.slice(0, shown).map((r) => {
              const rv = relVolume(r), y = dividendYield(r)
              return (
                <tr key={r.symbol}>
                  <td><a className="link" onClick={() => onSymbol(r.symbol)}><b>{r.symbol}</b></a> <span className="muted cg-sub">{r.exchange}</span></td>
                  <td className="cg-asset" title={r.name}>{r.name}{(r.isEtf || r.isFund) && <span className="cg-delay">{r.isEtf ? 'ETF' : 'fund'}</span>}</td>
                  <td><div>{r.sector || '—'}</div><div className="muted cg-sub">{r.industry}</div></td>
                  <td style={{ textAlign: 'right' }}>{cap(r.marketCap)}</td><td style={{ textAlign: 'right' }}>{r.price != null ? money(r.price) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{vol(r.volume)}</td>
                  <td style={{ textAlign: 'right' }} className={rv != null && rv >= 2 ? 'up' : ''}>{rv != null ? `${rv.toFixed(1)}×` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{r.beta != null ? r.beta.toFixed(2) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{y != null && y > 0 ? `${y.toFixed(2)}%` : '—'}</td>
                  <td><button className="icon-btn" title="Add to watchlist" onClick={() => onAdd(r.symbol)}><Plus size={14} /></button></td>
                </tr>
              )
            })}</tbody>
          </table>
          {sorted.length > shown && <div className="news-more"><button className="btn" onClick={() => setShown(shown + 100)}>Show 100 more ({sorted.length - shown} left)</button></div>}
        </div>
      )}
    </div>
  )
}

export default function ScreenerView({ live, onSelectSymbol, onAddToWatchlist, onSaveAsWatchlist, onAskClaude, onOpenSettings }: {
  live: boolean; onSelectSymbol: (s: string) => void; onAddToWatchlist: (s: string) => void; onSaveAsWatchlist: (name: string, symbols: string[]) => void; onAskClaude: (t: string) => void; onOpenSettings: () => void
}) {
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS)
  const [preset, setPreset] = useState<string | null>(null)
  const [opts, setOpts] = useState<FmpScreenerOptions | null>(null)
  const force = useRef(false)
  useEffect(() => { if (live) window.api.fmp.screenerOptions().then((r) => r.ok && setOpts(r.data)) }, [live])

  const { data, error, loading, reload } = useAsync(async () => { const fo = force.current; force.current = false; return unwrap(await window.api.fmp.screener({ query: toQuery(applied), force: fo })) }, [JSON.stringify(applied)], live)
  const rows = useMemo(() => (data ? applyClientFilters(data.rows, applied) : []), [data, applied])
  const set = (p: Partial<Filters>) => { setPreset(null); setF({ ...f, ...p }) }
  const run = (next: Filters = f) => { setF(next); setApplied(next) }
  const dirty = JSON.stringify(f) !== JSON.stringify(applied)
  const active = PRESETS.find((p) => p.id === preset)

  const saveList = async (list: ScreenerRow[]) => {
    const name = await promptText({ title: 'Save as watchlist', label: `Name for the ${list.length} symbols`, initial: active?.label ?? 'Screener results', okLabel: 'Save', validate: (v) => (v ? null : 'Give the list a name.') })
    if (name) onSaveAsWatchlist(name, list.map((r) => r.symbol))
  }
  const ask = () => onAskClaude(`I ran a stock screen and want your help reading it. Use run_screener with these arguments: ${JSON.stringify(toToolArgs(applied))}. Tell me what the screen is actually selecting for, point out anything odd in the results, pick a few names worth a closer look and explain what you would check next (chart, fundamentals, news), without treating the list as buy recommendations.`)

  return (
    <div className="col">
      <div className="pane-title"><span>Stock Screener</span></div>
      <div className="pane-body pad screen"><div className="screen-inner full">
        {!live ? <div className="muted">The screener uses Financial Modeling Prep data. <a className="link" onClick={onOpenSettings}>Add your FMP key</a> to use it.</div> : (
          <>
            <div className="sc-presets"><span className="muted">Start from</span>
              {PRESETS.map((p) => <button key={p.id} className={'tk-chip' + (preset === p.id ? ' on' : '')} onClick={() => { setPreset(p.id); run(presetFilters(p)) }}>{p.label}</button>)}
              <button className="btn small" onClick={() => { setPreset(null); run(DEFAULT_FILTERS) }}><RotateCcw size={12} /> Reset</button></div>
            {active && <div className="muted sc-what">{active.what}</div>}

            <div className="card-x sc-filters">
              <div className="sc-grid">
                <Field label="Sector"><select value={f.sector} onChange={(e) => set({ sector: e.target.value })}><option value="">Any</option>{opts?.sectors.map((s) => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Industry"><select value={f.industry} onChange={(e) => set({ industry: e.target.value })}><option value="">Any</option>{opts?.industries.map((s) => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Exchange"><select value={f.exchange} onChange={(e) => set({ exchange: e.target.value as Filters['exchange'] })}><option value="">Any</option><option>NASDAQ</option><option>NYSE</option><option>AMEX</option></select></Field>
                <Field label="Country"><select value={f.country} onChange={(e) => set({ country: e.target.value })}><option value="">Any</option>{opts?.countries.map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Type"><select value={f.kind} onChange={(e) => set({ kind: e.target.value as Filters['kind'] })}><option value="stocks">Stocks</option><option value="etfs">ETFs</option><option value="both">Stocks and ETFs</option></select></Field>
                <Field label="Size"><select value={SIZES.find(([a, b]) => a === f.capMin && b === f.capMax)?.[2] ?? 'Custom'} onChange={(e) => { const s = SIZES.find((x) => x[2] === e.target.value); if (s) set({ capMin: s[0], capMax: s[1] }) }}>{SIZES.map((s) => <option key={s[2]}>{s[2]}</option>)}<option>Custom</option></select></Field>
                <Field label="Market cap min" hint="$M"><input type="number" min="0" value={f.capMin} onChange={(e) => set({ capMin: e.target.value })} /></Field>
                <Field label="Market cap max" hint="$M"><input type="number" min="0" value={f.capMax} onChange={(e) => set({ capMax: e.target.value })} /></Field>
                <Field label="Price min" hint="$"><input type="number" min="0" value={f.priceMin} onChange={(e) => set({ priceMin: e.target.value })} /></Field>
                <Field label="Price max" hint="$"><input type="number" min="0" value={f.priceMax} onChange={(e) => set({ priceMax: e.target.value })} /></Field>
                <Field label="Volume min" hint="shares"><input type="number" min="0" step="100000" value={f.volumeMin} onChange={(e) => set({ volumeMin: e.target.value })} /></Field>
                <Field label="Relative volume min" hint="× avg"><input type="number" min="0" step="0.5" value={f.relVolMin} onChange={(e) => set({ relVolMin: e.target.value })} /></Field>
                <Field label="Beta min"><input type="number" step="0.1" value={f.betaMin} onChange={(e) => set({ betaMin: e.target.value })} /></Field>
                <Field label="Beta max"><input type="number" step="0.1" value={f.betaMax} onChange={(e) => set({ betaMax: e.target.value })} /></Field>
                <Field label="Dividend yield min" hint="%"><input type="number" min="0" step="0.5" value={f.yieldMin} onChange={(e) => set({ yieldMin: e.target.value })} /></Field>
                <Field label="Max results"><select value={f.limit} onChange={(e) => set({ limit: Number(e.target.value) })}>{[100, 250, 500, 1000, 3000].map((n) => <option key={n}>{n}</option>)}</select></Field>
              </div>
              <div className="sc-run">
                <label className="cx-check"><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} /> actively trading only</label>
                {hasClientFilters(f) && <span className="muted">Yield and relative volume are worked out in the app, so it scans up to 3,000 stocks.</span>}
                <span className="spacer" style={{ flex: 1 }} />
                {data?.asOf ? <span className="muted asof-inline">As of {formatClock(data.asOf, undefined, true)} {tzAbbr(resolveTz(), data.asOf)}{ago(data.asOf) ? ` · ${ago(data.asOf)}` : ''} · cached to limit FMP requests</span> : null}
                <button className="btn" disabled={loading} onClick={() => { force.current = true; if (dirty) run(); else reload() }} title="Fetch fresh data"><RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh</button>
                <button className="btn primary" disabled={loading || !dirty} onClick={() => run()}><Search size={13} /> Run screen</button>
              </div>
            </div>

            {error && <div className="msg-error"><span>{error}</span><button onClick={reload}>Retry</button></div>}
            {loading && !data && <div className="muted">Screening…</div>}
            {data && <ScreenerResults rows={rows} fetched={data.rows.length} truncated={!hasClientFilters(applied) && data.rows.length >= applied.limit} onSymbol={onSelectSymbol} onAdd={onAddToWatchlist} onSaveList={saveList} onAsk={ask} />}
            <div className="muted note sc-note">A screen only narrows thousands of stocks to a list worth looking at. It is not a list of things to buy: check the chart, the fundamentals and the news first. Prices and volume are live; the list is sorted by market cap unless you click a column.</div>
          </>
        )}
      </div></div>
    </div>
  )
}
