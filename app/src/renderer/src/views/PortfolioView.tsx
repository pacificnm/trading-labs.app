import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import SymbolSearch from '../components/SymbolSearch'
import { pick, pickStr } from '../data/fmp'
import { promptText } from '../dialog'
import { money } from '../format'
import { toast } from '../toast'
import { KINDS, effectivePortfolio, equalWeights, guessKind, normalizeWeights, planPortfolio, planSell, priceOf, summarizeHoldings, type AccountLink, type SellMethod, type Kind, type Pf, type PfItem } from '../../../shared/portfolio'
import type { AccountInfo } from '../../../shared/accounts'

const shares = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''))
const signed = (n: number) => `${n >= 0 ? '+' : '-'}${money(Math.abs(n))}`
const KIND_LABEL: Record<Kind, string> = { stock: 'Stock', etf: 'ETF', fund: 'Fund' }

/** A number box that keeps what is being typed and saves when you leave it or press Enter. */
function NumCell({ value, onCommit, prefix, suffix, width = 84, placeholder, title }: { value: number | null; onCommit: (n: number) => void; prefix?: string; suffix?: string; width?: number; placeholder?: string; title?: string }) {
  const show = (v: number | null) => (v == null ? '' : String(Math.round(v * 1e6) / 1e6))
  const [t, setT] = useState(show(value))
  const focused = useRef(false)
  useEffect(() => { if (!focused.current) setT(show(value)) }, [value])
  const commit = () => {
    focused.current = false
    const n = Number(t.replace(/[$,%\s]/g, ''))
    if (t.trim() === '' || !Number.isFinite(n)) { setT(show(value)); return }
    if (n !== value) onCommit(n)
  }
  return (
    <span className="pf-num">{prefix && <i>{prefix}</i>}
      <input style={{ width }} inputMode="decimal" value={t} placeholder={placeholder} title={title} onFocus={() => { focused.current = true }} onChange={(e) => setT(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setT(show(value)); (e.target as HTMLInputElement).blur() } }} />
      {suffix && <i>{suffix}</i>}
    </span>
  )
}

export default function PortfolioView({ live, onSelect, onOpenSettings, onAskClaude }: { live: boolean; onSelect: (symbol: string) => void; onOpenSettings: () => void; onAskClaude: (text: string) => void }) {
  const [lists, setLists] = useState<Pf[] | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [tab, setTab] = useState<'plan' | 'sell' | 'holdings'>('plan')
  const [sellPct, setSellPct] = useState(10)
  const [sellMethod, setSellMethod] = useState<SellMethod>('proportional')
  const [sellProfit, setSellProfit] = useState(false)
  const [addKind, setAddKind] = useState<'auto' | Kind>('auto')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [names, setNames] = useState<Record<string, string>>({})
  const [updated, setUpdated] = useState<number | null>(null)
  const [priceErr, setPriceErr] = useState<string | null>(null)
  const [accts, setAccts] = useState<{ list: AccountInfo[]; activeId: number } | null>(null)
  const [link, setLink] = useState<AccountLink | null>(null)
  const [linkErr, setLinkErr] = useState<string | null>(null)

  const load = useCallback(() => window.api.portfolio.list().then(setLists), [])
  useEffect(() => { load(); return window.api.portfolio.onChanged(load) }, [load])
  useEffect(() => { window.api.getSetting('pfActive').then((id) => typeof id === 'number' && setActiveId(id)) }, [])
  const loadAccts = useCallback(() => window.api.accounts.list().then((r) => setAccts({ list: r.list, activeId: r.activeId })), [])
  useEffect(() => { loadAccts(); return window.api.trade.onUpdate(loadAccts) }, [loadAccts])
  const active = lists?.find((l) => l.id === activeId) ?? lists?.[0] ?? null
  const linkedId = active?.accountId ?? null

  // a linked portfolio follows its paper account: balances and positions now, then whenever orders fill and every 15 seconds
  useEffect(() => {
    setLink(null); setLinkErr(null)
    if (linkedId == null) return
    let alive = true
    const get = async () => {
      const r = await window.api.portfolio.accountView(linkedId)
      if (!alive) return
      if (r.ok) { setLink(r.data); setLinkErr(null) } else setLinkErr(r.error)
    }
    get()
    const t = setInterval(get, 15_000)
    const off = window.api.trade.onUpdate(get)
    return () => { alive = false; clearInterval(t); off() }
  }, [linkedId])
  const symbols = useMemo(() => (active?.items ?? []).map((i) => i.symbol), [active])
  const symKey = symbols.join(',')

  // live prices: now, then every minute (fund prices only change once a day, but a stock can move any time)
  useEffect(() => {
    if (!live || symbols.length === 0) return
    let alive = true
    const get = async () => {
      const r = await window.api.fmp.quotes(symbols)
      if (!alive) return
      if (!r.ok) { setPriceErr(r.error); return }
      setPriceErr(null)
      const p: Record<string, number> = {}, n: Record<string, string> = {}
      for (const x of r.data) { const s = pickStr(x, 'symbol'), v = pick(x, 'price'); if (s && v != null && v > 0) p[s] = v; const nm = pickStr(x, 'name'); if (s && nm) n[s] = nm }
      setPrices((old) => ({ ...old, ...p })); setNames((old) => ({ ...old, ...n })); setUpdated(Date.now())
    }
    get()
    const t = setInterval(get, 60_000)
    return () => { alive = false; clearInterval(t) }
  }, [live, symKey])

  // remember each holding's name once the feed has told us
  useEffect(() => { for (const it of active?.items ?? []) if (!it.name && names[it.symbol]) window.api.portfolio.updateItem(it.id, { name: names[it.symbol] }) }, [names, active])

  // a linked portfolio is planned and valued from its account; an unlinked one from the numbers typed here
  const eff = useMemo(() => (active ? effectivePortfolio(active, link, prices) : null), [active, link, prices])
  const linked = !!active && active.accountId != null && !!link
  const view = eff?.pf ?? active
  const plan = useMemo(() => (view ? planPortfolio(view, prices) : null), [view, prices])
  const hold = useMemo(() => (view ? summarizeHoldings(view.items, prices) : null), [view, prices])
  const sell = useMemo(() => (view ? planSell(view, prices, { percent: sellPct, method: sellMethod, onlyProfit: sellProfit, sellable: linked && eff ? eff.sellable : undefined }) : null), [view, prices, sellPct, sellMethod, sellProfit, linked, eff])
  const linkedAcct = accts?.list.find((a) => a.id === active?.accountId) ?? null
  const isActiveAcct = !!linkedAcct && accts?.activeId === linkedAcct.id
  const nameOf = (it: PfItem) => it.name || names[it.symbol] || ''

  const fail = (r: { ok: boolean; error?: string }) => { if (!r.ok) toast.error(r.error ?? 'That did not work.'); return r.ok }
  const choose = (id: number) => { setActiveId(id); window.api.setSetting('pfActive', id) }

  const newPortfolio = async () => {
    const name = await promptText({ title: 'New portfolio', label: 'Name', placeholder: 'e.g. Retirement', okLabel: 'Create', validate: (v) => (v.trim() ? null : 'Give it a name.') })
    if (!name) return
    const r = await window.api.portfolio.create(name)
    if (fail(r) && r.ok) choose(r.id)
  }
  const rename = async () => {
    if (!active) return
    const name = await promptText({ title: 'Rename portfolio', label: 'Name', initial: active.name, okLabel: 'Rename', validate: (v) => (v.trim() ? null : 'Give it a name.') })
    if (name) fail(await window.api.portfolio.update(active.id, { name }))
  }
  const remove = async () => {
    if (!active || !window.confirm(`Delete the portfolio “${active.name}” with its ${active.items.length} holding${active.items.length === 1 ? '' : 's'}? This only removes your plan and records here, not anything at a broker.`)) return
    fail(await window.api.portfolio.remove(active.id))
  }
  const add = async (symbol: string) => {
    if (!active) return
    const kind = addKind === 'auto' ? guessKind(symbol.toUpperCase()) : addKind
    const r = await window.api.portfolio.addItem(active.id, { symbol, kind })
    fail(r)
  }
  const setTargets = (w: number[]) => active && fail2(window.api.portfolio.setTargets(active.id, active.items.map((it, i) => ({ id: it.id, pct: w[i] ?? 0 }))))
  const fail2 = (p: Promise<{ ok: boolean; error?: string }>) => p.then(fail)

  const recordBuys = async () => {
    if (!active || !plan) return
    const buys = plan.rows.filter((r) => r.shares > 0 && r.price != null).map((r) => ({ id: r.id, shares: r.shares, price: r.price! }))
    if (buys.length === 0) return
    const total = buys.reduce((s, b) => s + b.shares * b.price, 0)
    if (!window.confirm(`Add ${buys.length} purchase${buys.length === 1 ? '' : 's'} (about ${money(total)}) to your holdings at today's prices?\n\nThis only updates the records in Trading Lab. It does not buy anything. Do it after you have actually bought them.`)) return
    const r = await window.api.portfolio.recordBuys(active.id, buys)
    if (fail(r) && r.ok) { toast.success(`Recorded ${r.recorded} purchase${r.recorded === 1 ? '' : 's'} in your holdings.`); setTab('holdings') }
  }

  const buyOrders = async () => {
    if (!active || !plan || !linkedAcct) return
    const buys = plan.rows.filter((r, i) => r.shares > 0 && r.price != null && !(view?.items[i].noBuy)).map((r) => ({ symbol: r.symbol, qty: r.shares, price: r.price! }))
    if (buys.length === 0) return
    const total = buys.reduce((s, b) => s + b.qty * b.price, 0)
    if (!window.confirm(`Send ${buys.length} paper market order${buys.length === 1 ? '' : 's'} to “${linkedAcct.name}” for about ${money(total)}?\n\n${buys.map((b) => `Buy ${b.qty} ${b.symbol}`).join('\n')}\n\nThese are simulated orders in your paper account, filled from market data. They are not real trades.`)) return
    const r = await window.api.portfolio.placeOrders(active.id, 'buy', buys.map((b) => ({ symbol: b.symbol, qty: b.qty })))
    if (!r.ok) { toast.error(r.error); return }
    const done = r.outcomes.filter((o) => o.ok), failed = r.outcomes.filter((o) => !o.ok)
    if (done.length) toast.success(`Sent ${done.length} paper order${done.length === 1 ? '' : 's'}${done.some((o) => o.filledNow) ? '' : ': they fill when the market data allows (see Active Trades)'}.`, { title: 'Portfolio plan' })
    for (const f of failed) toast.error(`${f.symbol}: ${f.error}`, { title: 'Order not sent' })
  }
  const sellOrders = async () => {
    if (!active || !sell || !linkedAcct) return
    const rows = sell.rows.filter((r) => r.shares > 0 && r.price != null)
    if (rows.length === 0) return
    if (!window.confirm(`Send ${rows.length} paper market sell order${rows.length === 1 ? '' : 's'} to “${linkedAcct.name}” to raise about ${money(sell.proceeds)}?\n\n${rows.map((r) => `Sell ${r.shares} ${r.symbol}`).join('\n')}\n\nEstimated profit on these shares: ${signed(sell.gain)} (before any tax).\nThese are simulated orders in your paper account, filled from market data. They are not real trades.`)) return
    const r = await window.api.portfolio.placeOrders(active.id, 'sell', rows.map((x) => ({ symbol: x.symbol, qty: x.shares })))
    if (!r.ok) { toast.error(r.error); return }
    const done = r.outcomes.filter((o) => o.ok), failed = r.outcomes.filter((o) => !o.ok)
    if (done.length) toast.success(`Sent ${done.length} paper sell order${done.length === 1 ? '' : 's'}${done.some((o) => o.filledNow) ? '' : ': they fill when the market data allows (see Active Trades)'}.`, { title: 'Portfolio sale' })
    for (const f of failed) toast.error(`${f.symbol}: ${f.error}`, { title: 'Order not sent' })
  }
  const recordSells = async () => {
    if (!active || !sell) return
    const rows = sell.rows.filter((r) => r.shares > 0)
    if (rows.length === 0) return
    if (!window.confirm(`Take ${rows.length} sale${rows.length === 1 ? '' : 's'} (about ${money(sell.proceeds)}) out of your holdings?\n\nThis only updates the records in Trading Lab. It does not sell anything. Do it after you have actually sold them.`)) return
    const r = await window.api.portfolio.recordSells(active.id, rows.map((x) => ({ id: x.id, shares: x.shares })))
    if (fail(r) && r.ok) { toast.success(`Recorded ${r.recorded} sale${r.recorded === 1 ? '' : 's'} in your holdings.`); setTab('holdings') }
  }
  const makeActive = async () => { if (linkedAcct) { const r = await window.api.accounts.setActive(linkedAcct.id); if (!r.ok) toast.error(r.error) } }

  const ask = () => active && onAskClaude(`Review my portfolio "${active.name}". Use get_portfolio to read it. Tell me how closely my holdings match my targets, whether it is concentrated or well spread, what stands out in the gains and losses, and what you would double-check before investing more. Be clear that this is education, not personal financial advice.`)

  if (!lists) return <div className="col"><div className="pane-title"><span>Portfolio</span></div></div>

  const pf = active
  const priceCell = (it: PfItem) => {
    const lp = prices[it.symbol]
    if (live && lp != null) return <span>{money(lp)}</span>
    return <NumCell value={it.manualPrice} width={78} prefix="$" placeholder="price" title={live ? 'No live price came back for this symbol. Type one to use it in the calculator.' : 'No market data key, so type a price to use it in the calculator.'} onCommit={(n) => fail2(window.api.portfolio.updateItem(it.id, { manualPrice: n }))} />
  }
  const needsPrice = pf ? pf.items.some((it) => priceOf(it, prices) == null) : false

  return (
    <div className="col">
      <div className="pane-title"><span>Portfolio</span><span className="spacer" />
        <button className="btn small" disabled={!pf || pf.items.length === 0} onClick={ask}><Sparkles size={12} /> Ask Claude to review</button></div>
      <div className="subtabs wl-tabs">
        {lists.map((l) => (
          <button key={l.id} className={l.id === pf?.id ? 'active' : ''} onClick={() => choose(l.id)}>{l.name} <span className="muted">{l.items.length}</span></button>
        ))}
        <button className="wl-plus" title="New portfolio" onClick={newPortfolio}><Plus size={14} /></button>
        <span className="spacer" />
        {pf && <>
          <button className="icon-btn" title="Rename this portfolio" onClick={rename}><Pencil size={14} /></button>
          <button className="icon-btn" title="Delete this portfolio" onClick={remove}><Trash2 size={14} /></button>
        </>}
      </div>
      <div className="pane-body pad screen"><div className="screen-inner full">
        {!pf && (
          <div className="pf-empty">
            <h3>Plan and track an investment portfolio</h3>
            <p className="muted">Add stocks, ETFs and mutual funds, give each a percentage of the money you plan to invest, and Trading Lab works out how many shares that buys. Then record what you hold to see what it is worth today.</p>
            <p className="muted">It is a planning and record-keeping tool. It never buys or sells anything, and it is separate from your paper trading accounts.</p>
            <button className="btn primary" onClick={newPortfolio}><Plus size={13} /> Create your first portfolio</button>
          </div>
        )}
        {pf && plan && hold && (<>
          {!live && <div className="pf-note">No market data key is set, so prices cannot load. Type a price next to each holding to use the calculator, or <a className="link" onClick={onOpenSettings}>add your key in Settings</a>.</div>}
          {live && priceErr && <div className="pf-note err">Prices could not be updated: {priceErr}. Showing the last ones, or type a price by hand.</div>}

          {pf.accountId != null && linkErr && <div className="pf-note err">Could not read the paper account: {linkErr}</div>}
          {linked && linkedAcct && !isActiveAcct && <div className="pf-note">This portfolio follows <b>{linkedAcct.name}</b>, which is not the active account. The values below come from it, but paper orders always go to the active account, so <a className="link" onClick={makeActive}>make {linkedAcct.name} active</a> before buying.</div>}
          {linked && eff && eff.shorts.length > 0 && <div className="pf-note">The account holds a short position in {eff.shorts.join(', ')}. Shorts are not counted here.</div>}
          {linked && eff && Object.keys(eff.pendingSold).length > 0 && <div className="pf-note">Paper market sells waiting to fill ({Object.entries(eff.pendingSold).map(([s, q]) => `${q} ${s}`).join(', ')}) are counted as already sold, so the plan will not sell them twice.</div>}
          {linked && eff && Object.keys(eff.pending).length > 0 && <div className="pf-note">Paper market buys waiting to fill ({Object.entries(eff.pending).map(([s, q]) => `${q} ${s}`).join(', ')}) are counted as already held, so the plan will not buy them twice.</div>}

          <div className="pf-cards">
            <div className="card-x"><div className="muted">Value of what you hold</div><div className="pf-big">{money(hold.totalValue)}</div><div className="muted">{hold.rows.filter((r) => r.shares > 0).length} holding{hold.rows.filter((r) => r.shares > 0).length === 1 ? '' : 's'} with shares</div></div>
            <div className="card-x"><div className="muted">Total paid</div><div className="pf-big">{money(hold.totalCost)}</div><div className="muted">cost of those shares</div></div>
            <div className="card-x"><div className="muted">Gain / loss</div><div className={'pf-big ' + (hold.gain >= 0 ? 'up' : 'down')}>{hold.totalCost > 0 || hold.totalValue > 0 ? signed(hold.gain) : '—'}</div><div className={hold.gain >= 0 ? 'up' : 'down'}>{hold.gainPct != null ? `${hold.gainPct >= 0 ? '+' : ''}${hold.gainPct.toFixed(2)}%` : ' '}</div></div>
            <div className="card-x"><div className="muted">{linked ? `Cash to invest (${linkedAcct?.name ?? 'account'})` : `Plan for ${money(pf.amount)}`}</div><div className="pf-big">{money(plan.spent)}</div><div className="muted">to spend · {money(plan.leftover)} left over</div></div>
          </div>
          {hold.missingPrice.length > 0 && <div className="pf-note">No price for {hold.missingPrice.join(', ')}, so {hold.missingPrice.length === 1 ? 'it is' : 'they are'} left out of these totals.</div>}

          <div className="card-x pf-controls">
            <label className="pf-field">Paper account
              <select value={pf.accountId ?? ''} onChange={(e) => fail2(window.api.portfolio.update(pf.id, { accountId: e.target.value === '' ? null : Number(e.target.value) }))} title="Link this portfolio to a paper account so its balance, holdings and value come from that account">
                <option value="">Not linked (I type the numbers)</option>
                {accts?.list.map((a) => <option key={a.id} value={a.id}>{a.name}{a.id === accts.activeId ? ' (active)' : ''}</option>)}
              </select></label>
            {linked && eff ? (
              <div className="pf-field">Invests the account's available cash <b>{money(eff.availableCash)}</b><span className="muted">holdings {money(plan.holdingsValue)} + cash = {money(view!.amount)}</span></div>
            ) : (<>
              <label className="pf-field">Investment amount<NumCell value={pf.amount} prefix="$" width={110} onCommit={(n) => fail2(window.api.portfolio.update(pf.id, { amount: n }))} /></label>
              <div className="pf-field">The amount is
                <div className="seg"><button className={pf.mode === 'new' ? 'on' : ''} title="New money to invest now, split by your percentages" onClick={() => fail2(window.api.portfolio.update(pf.id, { mode: 'new' }))}>New money</button>
                  <button className={pf.mode === 'total' ? 'on' : ''} title="The size you want the whole portfolio to reach: what you hold now counts toward it" onClick={() => fail2(window.api.portfolio.update(pf.id, { mode: 'total' }))}>Total size</button></div></div>
              <label className="pf-check"><input type="checkbox" checked={pf.fractional} onChange={(e) => fail2(window.api.portfolio.update(pf.id, { fractional: e.target.checked }))} /> Allow fractional shares of stocks and ETFs <span className="muted">(funds always can)</span></label>
            </>)}
            <label className="pf-check"><input type="checkbox" checked={pf.leftover} onChange={(e) => fail2(window.api.portfolio.update(pf.id, { leftover: e.target.checked }))} /> Spend leftover cash on extra shares</label>
            <div className="pf-field">Targets add up to
              <span className={Math.abs(plan.pctTotal - 100) < 0.005 ? 'up' : 'down'}><b>{plan.pctTotal}%</b></span>
              <span className="pf-btns"><button className="tk-chip" disabled={pf.items.length === 0} onClick={() => setTargets(equalWeights(pf.items.length))}>Equal weight</button>
                <button className="tk-chip" disabled={pf.items.length === 0 || plan.pctTotal === 0} onClick={() => setTargets(normalizeWeights(pf.items.map((i) => i.targetPct)))}>Make it 100%</button></span></div>
          </div>

          <div className="pf-addrow">
            <div className="pf-search"><SymbolSearch live={live} onSelect={add} /></div>
            <select value={addKind} onChange={(e) => setAddKind(e.target.value as 'auto' | Kind)} title="What kind of holding to add. Auto-detect treats a five-letter ticker ending in X as a mutual fund.">
              <option value="auto">Auto-detect type</option>{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
            <span className="muted">Search for a stock, ETF or mutual fund, and press Enter to add it</span>
            <span className="spacer" />
            <div className="seg"><button className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>Plan &amp; calculator</button><button className={tab === 'sell' ? 'on' : ''} onClick={() => setTab('sell')} title="Sell a percentage of the portfolio to take profits">Sell</button><button className={tab === 'holdings' ? 'on' : ''} onClick={() => setTab('holdings')}>Holdings</button></div>
          </div>

          {pf.items.length === 0 && <div className="pad muted">Nothing here yet. Search above to add your first stock, ETF or mutual fund.</div>}

          {pf.items.length > 0 && tab === 'plan' && (<>
            <table className="grid pf-table">
              <thead><tr><th>Holding</th><th className="r">Target %</th><th className="r">Price</th><th className="r">{view!.mode === 'new' ? 'Amount for it' : 'Needs'}</th><th className="r">Shares to buy</th><th className="r">Cost</th><th className="r">You hold</th><th className="r">After buying</th><th></th></tr></thead>
              <tbody>
                {pf.items.map((it, i) => {
                  const r = plan.rows[i]
                  const ei = view!.items[i]
                  const after = ei.shares + r.shares
                  const afterTotal = plan.holdingsValue + plan.spent
                  const afterW = r.price != null && afterTotal > 0 ? ((after * r.price) / afterTotal) * 100 : null
                  return (
                    <tr key={it.id}>
                      <td className="pf-name"><b className="link" onClick={() => onSelect(it.symbol)} title="Open the chart">{it.symbol}</b> <span className="jr-badge">{KIND_LABEL[it.kind]}</span><div className="muted pf-sub">{nameOf(it)}</div></td>
                      <td className="r"><NumCell value={it.targetPct} suffix="%" width={60} onCommit={(n) => fail2(window.api.portfolio.updateItem(it.id, { targetPct: n }))} /></td>
                      <td className="r">{priceCell(it)}</td>
                      <td className="r">{r.price == null ? <span className="muted">—</span> : ei.noBuy ? <span className="muted">—</span> : money(r.dollars)}</td>
                      <td className="r">{ei.noBuy ? <span className="muted" title="Mutual funds cannot be traded in the paper account, so the plan does not buy them. Buy the fund yourself and type its shares on the Holdings tab.">can't buy here</span> : r.price == null ? <span className="muted" title="Needs a price">no price</span> : <b>{shares(r.shares)}</b>}{r.extra > 0 && <span className="muted" title="Includes shares bought with leftover cash"> (+{shares(r.extra)})</span>}
                        {r.overValue > 0 && <div className="muted pf-sub" title="Total-size mode never sells for you. This is only a comparison.">over target by {money(r.overValue)}</div>}</td>
                      <td className="r">{r.shares > 0 ? money(r.cost) : <span className="muted">—</span>}</td>
                      <td className="r">{ei.shares > 0 ? shares(ei.shares) : <span className="muted">—</span>}{eff && eff.pending[it.symbol] ? <div className="pf-sub muted">incl. {eff.pending[it.symbol]} waiting to fill</div> : null}</td>
                      <td className="r">{r.price == null ? <span className="muted">—</span> : <>{shares(after)} <span className="muted">· {afterW != null ? afterW.toFixed(1) : '0'}%</span></>}</td>
                      <td><button className="icon-btn" title={`Remove ${it.symbol}`} onClick={() => fail2(window.api.portfolio.removeItem(it.id))}><X size={14} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr><td><b>Total</b></td><td className={'r ' + (Math.abs(plan.pctTotal - 100) < 0.005 ? '' : 'down')}>{plan.pctTotal}%</td><td></td><td className="r">{money(plan.rows.reduce((s, r) => s + (r.price != null ? r.dollars : 0), 0))}</td><td></td><td className="r"><b>{money(plan.spent)}</b></td><td colSpan={3} className="muted">{money(plan.leftover)} of {money(plan.budget)} left over</td></tr></tfoot>
            </table>
            {plan.pctTotal > 100.005 && <div className="pf-note err">Your targets add up to {plan.pctTotal}%, more than 100%, so the plan wants more than the amount. Shares are rounded down, so you may overspend nothing, but fix the percentages or use “Make it 100%”.</div>}
            {plan.pctTotal < 99.995 && pf.items.length > 0 && <div className="pf-note">Your targets add up to {plan.pctTotal}%, so about {money(Math.max(0, pf.amount * (100 - plan.pctTotal) / 100))} is not assigned to anything.</div>}
            {linked && linkedAcct && <div className="pf-note">Linked to <b>{linkedAcct.name}</b>: the plan tops up whatever is under target using only that account's available cash ({money(eff?.availableCash ?? 0)}). Your holdings are the account's positions, so once the orders fill the plan has nothing left to buy. Mutual funds cannot trade in the paper account: their shares are the ones you typed, they count toward the totals, and they are never bought here.{plan.rows.map((r, i) => { const short = view!.items[i].noBuy && view!.items[i].targetPct > 0 ? view!.amount * view!.items[i].targetPct / 100 - r.currentValue : 0; return short > 0.5 ? <span key={r.id}> <b>{r.symbol}</b> is {money(short)} under its target: buy it at your fund company, outside the paper account.</span> : null })}</div>}
            {!linked && pf.mode === 'total' && <div className="pf-note">Total-size mode: the plan tops up whatever is under target using only the extra cash needed ({money(plan.budget)} = {money(pf.amount)} minus the {money(plan.holdingsValue)} you hold). It never tells you to sell.</div>}
            {needsPrice && <div className="pf-note">Some holdings have no price yet. Type a price in the Price column for those.</div>}
            <div className="pf-actions">
              {linked ? (<>
                <button className="btn primary" disabled={!isActiveAcct || !plan.rows.some((r, i) => r.shares > 0 && !view!.items[i].noBuy)} onClick={buyOrders} title={isActiveAcct ? 'Sends paper market orders to the account, after you confirm' : 'Make the linked account active first'}>Buy these in the paper account</button>
                <span className="muted">Sends simulated market orders after you confirm. They fill from market data like any paper order. Claude can never send them.</span>
              </>) : (<>
                <button className="btn primary" disabled={!plan.rows.some((r) => r.shares > 0)} onClick={recordBuys} title="Adds these shares and their cost to your Holdings, after you have bought them">I bought these: add them to my holdings</button>
                <span className="muted">The calculator only does the arithmetic. It does not place any order, and Claude cannot either.</span>
              </>)}
            </div>
          </>)}

          {pf.items.length > 0 && tab === 'sell' && sell && (<>
            <div className="card-x pf-controls">
              <label className="pf-field">Sell<NumCell value={sellPct} suffix="%" width={60} onCommit={(n) => setSellPct(Math.min(100, Math.max(0, n)))} />of the portfolio <span className="muted">({money(sell.baseValue)} can be sold from here{linked ? '' : ''})</span></label>
              <div className="pf-field">Take it from
                <div className="seg"><button className={sellMethod === 'proportional' ? 'on' : ''} title="The same share of every holding, so your mix stays as it is" onClick={() => setSellMethod('proportional')}>Every holding equally</button>
                  <button className={sellMethod === 'overweight' ? 'on' : ''} title="Trim holdings that are above their target first, then the rest" onClick={() => setSellMethod('overweight')}>Overweight first</button></div></div>
              <label className="pf-check"><input type="checkbox" checked={sellProfit} onChange={(e) => setSellProfit(e.target.checked)} /> Only holdings that are in profit</label>
              <span className="pf-btns">{[5, 10, 25, 50].map((n) => <button key={n} className="tk-chip" onClick={() => setSellPct(n)}>{n}%</button>)}</span>
            </div>
            <table className="grid pf-table">
              <thead><tr><th>Holding</th><th className="r">You hold</th><th className="r">Price</th><th className="r">Gain now</th><th className="r">Shares to sell</th><th className="r">Proceeds</th><th className="r">Profit on those</th><th className="r">Left</th><th className="r">Weight after</th></tr></thead>
              <tbody>
                {pf.items.map((it, i) => {
                  const r = sell.rows[i]
                  const ei = view!.items[i]
                  return (
                    <tr key={it.id}>
                      <td className="pf-name"><b className="link" onClick={() => onSelect(it.symbol)} title="Open the chart">{it.symbol}</b> <span className="jr-badge">{KIND_LABEL[it.kind]}</span><div className="muted pf-sub">{nameOf(it)}</div></td>
                      <td className="r">{ei.shares > 0 ? <>{shares(ei.shares)}{linked && r.sellable !== ei.shares ? <div className="pf-sub muted">{shares(r.sellable)} free to sell</div> : null}</> : <span className="muted">—</span>}</td>
                      <td className="r">{priceCell(it)}</td>
                      <td className={'r ' + (r.gainPctNow != null ? (r.gainPctNow >= 0 ? 'up' : 'down') : '')}>{r.gainPctNow != null ? `${r.gainPctNow >= 0 ? '+' : ''}${r.gainPctNow.toFixed(1)}%` : <span className="muted">—</span>}</td>
                      <td className="r">{r.shares > 0 ? <b>{shares(r.shares)}</b> : r.skip ? <span className="muted" title={r.skip}>{r.skip}</span> : <span className="muted">—</span>}</td>
                      <td className="r">{r.shares > 0 ? money(r.proceeds) : <span className="muted">—</span>}</td>
                      <td className={'r ' + (r.gain != null && r.shares > 0 ? (r.gain >= 0 ? 'up' : 'down') : '')}>{r.shares > 0 && r.gain != null ? signed(r.gain) : <span className="muted">—</span>}</td>
                      <td className="r">{ei.shares > 0 ? shares(r.left) : <span className="muted">—</span>}</td>
                      <td className="r">{r.weightAfter != null && ei.shares > 0 ? `${r.weightAfter.toFixed(1)}%` : <span className="muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr><td><b>Total</b></td><td colSpan={4} className="muted">{sell.proceeds > 0 ? `${sell.actualPct}% of ${money(sell.baseValue)}${sell.actualPct < sell.percent - 0.005 ? `: a little under the ${sell.percent}% asked for, because only whole shares can be sold` : ''}` : ''}</td><td className="r"><b>{money(sell.proceeds)}</b></td><td className={'r ' + (sell.gain >= 0 ? 'up' : 'down')}><b>{sell.proceeds > 0 ? signed(sell.gain) : '—'}</b></td><td colSpan={2}></td></tr></tfoot>
            </table>
            {sell.notes.map((n) => <div key={n} className="pf-note">{n}</div>)}
            {sell.missingPrice.length > 0 && <div className="pf-note">No price for {sell.missingPrice.join(', ')}, so {sell.missingPrice.length === 1 ? 'it is' : 'they are'} left out. Type a price in the Price column.</div>}
            {linked && linkedAcct && <div className="pf-note">Linked to <b>{linkedAcct.name}</b>: only the shares the account holds can be sold, less any sells already waiting. Mutual funds cannot be traded in the paper account, so they are not touched here.</div>}
            <div className="pf-actions">
              {linked ? (<>
                <button className="btn primary" disabled={!isActiveAcct || !sell.rows.some((r) => r.shares > 0)} onClick={sellOrders} title={isActiveAcct ? 'Sends paper market sell orders to the account, after you confirm' : 'Make the linked account active first'}>Sell these in the paper account</button>
                <span className="muted">Sends simulated market sell orders after you confirm. Claude can never send them.</span>
              </>) : (<>
                <button className="btn primary" disabled={!sell.rows.some((r) => r.shares > 0)} onClick={recordSells} title="Takes these shares out of your Holdings, after you have sold them">I sold these: remove them from my holdings</button>
                <span className="muted">The calculator only does the arithmetic. It does not sell anything, and Claude cannot either.</span>
              </>)}
            </div>
          </>)}

          {pf.items.length > 0 && tab === 'holdings' && (<>
            <table className="grid pf-table">
              <thead><tr><th>Holding</th><th className="r">Shares</th><th className="r">Total paid</th><th className="r">Avg cost</th><th className="r">Price</th><th className="r">Value now</th><th className="r">Gain / loss</th><th className="pf-w">Weight vs target</th><th></th></tr></thead>
              <tbody>
                {pf.items.map((it, i) => {
                  const h = hold.rows[i]
                  const cls = h.gain != null ? (h.gain >= 0 ? 'up' : 'down') : ''
                  return (
                    <tr key={it.id}>
                      <td className="pf-name"><b className="link" onClick={() => onSelect(it.symbol)} title="Open the chart">{it.symbol}</b> <span className="jr-badge">{KIND_LABEL[it.kind]}</span><div className="muted pf-sub">{nameOf(it)}</div></td>
                      {linked && !view!.items[i].noBuy ? (<>
                        <td className="r" title={`From the paper account “${linkedAcct?.name}”`}>{shares(view!.items[i].shares)}{eff && eff.pending[it.symbol] ? <div className="pf-sub muted">incl. {eff.pending[it.symbol]} waiting</div> : null}</td>
                        <td className="r" title={`From the paper account “${linkedAcct?.name}”`}>{money(view!.items[i].cost)}</td>
                      </>) : (<>
                        <td className="r"><NumCell value={it.shares} width={80} onCommit={(n) => fail2(window.api.portfolio.updateItem(it.id, { shares: n }))} /></td>
                        <td className="r"><NumCell value={it.cost} prefix="$" width={92} title="The total you paid for these shares, including any fees" onCommit={(n) => fail2(window.api.portfolio.updateItem(it.id, { cost: n }))} /></td>
                      </>)}
                      <td className="r">{h.avgCost != null ? money(h.avgCost) : <span className="muted">—</span>}</td>
                      <td className="r">{priceCell(it)}</td>
                      <td className="r">{h.value != null ? (it.shares > 0 ? money(h.value) : <span className="muted">—</span>) : <span className="muted">no price</span>}</td>
                      <td className={'r ' + cls}>{h.gain != null && (it.shares > 0 || it.cost > 0) ? <>{signed(h.gain)}{h.gainPct != null && <div className="pf-sub">{h.gainPct >= 0 ? '+' : ''}{h.gainPct.toFixed(2)}%</div>}</> : <span className="muted">—</span>}</td>
                      <td className="pf-w">{h.weight != null && hold.totalValue > 0 ? (
                        <div title={`Now ${h.weight.toFixed(1)}% · target ${h.targetPct}%`}>
                          <div className="pf-bar"><i style={{ width: `${Math.min(100, h.weight)}%` }} /><b style={{ left: `${Math.min(100, h.targetPct)}%` }} /></div>
                          <div className="pf-sub"><span>{h.weight.toFixed(1)}%</span> <span className="muted">of {h.targetPct}%</span>{h.drift != null && Math.abs(h.drift) >= 0.05 && <span className={h.drift > 0 ? ' warn' : ' muted'}> {h.drift > 0 ? '+' : ''}{h.drift.toFixed(1)} pts</span>}</div>
                        </div>) : <span className="muted">—</span>}</td>
                      <td><button className="icon-btn" title={`Remove ${it.symbol}`} onClick={() => fail2(window.api.portfolio.removeItem(it.id))}><X size={14} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr><td><b>Total</b></td><td></td><td className="r"><b>{money(hold.totalCost)}</b></td><td></td><td></td><td className="r"><b>{money(hold.totalValue)}</b></td><td className={'r ' + (hold.gain >= 0 ? 'up' : 'down')}><b>{signed(hold.gain)}</b>{hold.gainPct != null && <div className="pf-sub">{hold.gainPct >= 0 ? '+' : ''}{hold.gainPct.toFixed(2)}%</div>}</td><td colSpan={2}></td></tr></tfoot>
            </table>
            {linked && <div className="pf-note">Shares and cost for stocks and ETFs come from the paper account <b>{linkedAcct?.name}</b> and update as orders fill. Mutual funds cannot be held in a paper account, so type those yourself.</div>}
            {!linked && <div className="pf-note">Type the shares you own and the total you paid for them (the plan's “I bought these” button fills both in for you). Value uses {live ? 'the latest price' : 'the price you typed'}. Mutual funds are priced once a day after the market closes, and the price may be missing for some funds, so you can type one.{updated && live ? ` Prices updated ${new Date(updated).toLocaleTimeString()}.` : ''}</div>}
          </>)}
        </>)}
      </div></div>
    </div>
  )
}
