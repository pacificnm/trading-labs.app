import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { CandlestickChart, Wallet, ArrowLeftRight, ListChecks, Settings, Sparkles, BookOpen, Newspaper, Calculator, BarChart3, Building2, GraduationCap, ScanSearch, PieChart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import TitleBar from './components/TitleBar'
import StatusBar from './components/StatusBar'
import ChartView from './views/ChartView'
import AccountView from './views/AccountView'
import TradesView from './views/TradesView'
import ChartSettingsView from './views/ChartSettingsView'
import { DEFAULT_CHART_SETTINGS, type ChartSettings } from './chart/settings'
import { SYMBOL_VIEWS, type SymbolView } from './components/SymbolTabs'
import NewsView from './views/NewsView'
import MarketNewsView from './views/MarketNewsView'
import MarketView from './views/MarketView'
import CongressView from './views/CongressView'
import ScreenerView from './views/ScreenerView'
import StrategiesView from './views/StrategiesView'
import { chartSettingsFromSetup } from './chart/setup'
import type { ChartSetup } from '../../shared/strategies'
import QuoteView from './views/QuoteView'
import AnalystView from './views/AnalystView'
import FundamentalsView from './views/FundamentalsView'
import OptionsView from './views/OptionsView'
import ChatPanel from './components/ChatPanel'
import { chartBridge } from './chart/bridge'
import { chartKey, useChartData, useDrawings } from './chart/useChartData'
import { runTool } from './chart/tools'
import { toast, Toaster } from './toast'
import { DialogHost, promptText } from './dialog'
import AboutDialog from './components/AboutDialog'
import HelpView from './views/HelpView'
import type { WatchList } from '../../shared/watchlists'
import { DEFAULT_DISPLAY, resolveTz, setDisplay, type DisplaySettings } from './display'
import TradeTicket, { type Quote } from './components/TradeTicket'
import { draftLines, emptyDraft, tradeLines, type Draft } from './chart/orderDraft'
import type { TradeSnapshot, Side } from '../../shared/trade'
import JournalView from './views/JournalView'
import CalculatorView from './views/CalculatorView'
import { DEFAULT_CALC, type CalcState } from './chart/calcState'
import { DEFAULT_RULES, type Rules } from '../../shared/position'
import type { JournalItem } from '../../shared/journal'
import SettingsView from './views/SettingsView'
import { usePlan } from './fmpCaps'
import { INTERVALS, usableTimeframe } from './chart/timeframe'
import WatchlistView from './views/WatchlistView'
import PortfolioView from './views/PortfolioView'

type ViewId = SymbolView | 'account' | 'trades' | 'watch' | 'portfolio' | 'screener' | 'strategies' | 'congress' | 'market' | 'marketnews' | 'journal' | 'calculator' | 'settings' | 'chartSettings' | 'help'

const RIBBON: { id: ViewId; Icon: LucideIcon; label: string }[] = [
  { id: 'chart', Icon: CandlestickChart, label: 'Charts' },
  { id: 'account', Icon: Wallet, label: 'Account' },
  { id: 'trades', Icon: ArrowLeftRight, label: 'Active Trades' },
  { id: 'watch', Icon: ListChecks, label: 'Watchlists' },
  { id: 'portfolio', Icon: PieChart, label: 'Portfolio' },
  { id: 'market', Icon: BarChart3, label: 'Market Performance' },
  { id: 'congress', Icon: Building2, label: 'Senate & House Trades' },
  { id: 'marketnews', Icon: Newspaper, label: 'Market News' },
  { id: 'calculator', Icon: Calculator, label: 'Position Calculator' },
  { id: 'screener', Icon: ScanSearch, label: 'Stock Screener' },
  { id: 'strategies', Icon: GraduationCap, label: 'Trading Strategies' },
  { id: 'journal', Icon: BookOpen, label: 'Trading Journal' }
]

export default function App() {
  const [view, setView] = useState<ViewId>('chart')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [helpTopic, setHelpTopic] = useState('welcome')
  const openHelp = (topic?: string) => { if (topic) setHelpTopic(topic); setView('help') }
  // a newer GitHub release: say so once per version, then leave it to About
  useEffect(() => window.api.onUpdateAvailable((u) => {
    window.api.getSetting('updateSeen').then((seen) => {
      if (seen === u.latest) return
      window.api.setSetting('updateSeen', u.latest)
      toast.info(`Version ${u.latest} is available.`, { title: 'Update', duration: 0, action: { label: 'Open download page', onClick: () => window.api.openExternal(u.url) } })
    })
  }), [])
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'F1') { e.preventDefault(); setView('help') } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  const [symbol, setSymbol] = useState('AAPL')
  const [lists, setLists] = useState<WatchList[]>([])
  const [activeListId, setActiveListId] = useState<number | null>(null)
  const [live, setLive] = useState(false)
  const refreshLive = () => window.api.fmp.keyStatus().then((k) => setLive(k.source !== 'none'))
  useEffect(() => { refreshLive() }, [])
  const plan = usePlan()
  const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_CHART_SETTINGS)
  const [display, setDisplayState] = useState<DisplaySettings>(DEFAULT_DISPLAY)
  useEffect(() => { window.api.getSetting('display').then((d) => { if (d) { const v = { ...DEFAULT_DISPLAY, ...d }; setDisplay(v); setDisplayState(v) } }) }, [])
  const updateDisplay = (d: DisplaySettings) => { setDisplay(d); setDisplayState(d); window.api.setSetting('display', d) }
  const tz = resolveTz(display)

  // ---- paper trading: engine snapshot, order ticket draft, live quote, toasts ----
  const [snap, setSnap] = useState<TradeSnapshot | null>(null)
  const refreshTrading = useCallback(() => window.api.trade.snapshot().then(setSnap).catch(() => undefined), [])
  useEffect(() => {
    refreshTrading()
    const off = window.api.trade.onUpdate((events) => { refreshTrading(); events.forEach((e) => (/rejected/i.test(e.text) ? toast.error(e.text) : /expired/i.test(e.text) ? toast.warning(e.text) : /filled/i.test(e.text) ? toast.success(e.text, { title: 'Order filled' }) : toast.info(e.text))) })
    const t = setInterval(refreshTrading, 20_000)
    return () => { off(); clearInterval(t) }
  }, [])

  const [ticket, setTicketState] = useState<Draft | null>(null)
  const ticketRef = useRef<Draft | null>(null)
  const setTicket = (d: Draft | null) => { ticketRef.current = d; setTicketState(d) }
  // a half-built order must never be sent to a different account than the one it was built for
  const accountId = snap?.account.id
  const lastAccount = useRef<number | undefined>(undefined)
  useEffect(() => { if (lastAccount.current !== undefined && accountId !== undefined && lastAccount.current !== accountId && ticketRef.current) { setTicket(null); toast.info('Order ticket closed because you switched accounts.') } if (accountId !== undefined) lastAccount.current = accountId }, [accountId])
  const [quote, setQuote] = useState<Quote>({ last: null, change: null, changePct: null })
  useEffect(() => {
    setQuote({ last: null, change: null, changePct: null })
    if (!live) return
    let alive = true
    const load = async () => {
      const r = await window.api.fmp.quotes([symbol])
      if (!alive || !r.ok || !r.data[0]) return
      const q = r.data[0]
      setQuote({ last: Number(q['price']) || null, change: Number(q['change']) || 0, changePct: Number(q['changePercentage'] ?? q['changesPercentage']) || 0 })
    }
    load()
    const t = setInterval(load, ticket || snap?.positions.some((p) => p.symbol === symbol) ? 10_000 : 60_000)
    return () => { alive = false; clearInterval(t) }
  }, [symbol, live, !!ticket])

  // ---- position calculator: inputs and standing risk rules (both saved) ----
  const [calc, setCalcState] = useState<CalcState>(DEFAULT_CALC)
  const [rules, setRulesState] = useState<Rules>(DEFAULT_RULES)
  const calcRef = useRef(calc), rulesRef = useRef(rules)
  useEffect(() => {
    window.api.getSetting('calc').then((c) => { if (c) { calcRef.current = { ...DEFAULT_CALC, ...c }; setCalcState(calcRef.current) } })
    window.api.getSetting('riskRules').then((r) => { if (r) { rulesRef.current = { ...DEFAULT_RULES, ...r }; setRulesState(rulesRef.current) } })
  }, [])
  const updateCalc = (p: Partial<CalcState>) => { const next = { ...calcRef.current, ...p }; calcRef.current = next; setCalcState(next); window.api.setSetting('calc', next) }
  const updateRules = (r: Rules) => { rulesRef.current = r; setRulesState(r); window.api.setSetting('riskRules', r) }
  const ticketFromCalc = (p: { symbol: string; side: 'long' | 'short'; shares: number; entry: number; stop: number; target: number | null; note: string }) => {
    const r2 = (n: number) => String(Math.round(n * 100) / 100)
    setSymbol(p.symbol); setView('chart')
    setTicket({
      ...emptyDraft(p.side === 'long' ? 'buy' : 'sell_short'), qty: String(p.shares), type: 'limit', limit: r2(p.entry), tif: 'day', strategy: p.target != null ? 'bracket' : 'single',
      target: p.target != null ? r2(p.target) : '', protectStop: r2(p.stop), note: p.note, journal: true
    })
    toast.info(p.target != null ? 'Ticket filled from the calculator. Review it before sending.' : 'Ticket filled from the calculator. It has no target or stop attached, so add them if you want a bracket.')
  }

  /** Sets the chart up for a strategy (timeframe, chart type and studies); the toast offers to put the old chart back. */
  const applyChartSetup = (setup: ChartSetup, name: string, sym?: string) => {
    const prev = { symbol: symbolRef.current, settings: settingsRef.current }
    const { settings, dropped } = chartSettingsFromSetup(settingsRef.current, setup)
    updateChartSettings(settings)
    if (sym) { symbolRef.current = sym; setSymbol(sym) }
    setView('chart')
    toast.info(`Chart set up for “${name}”${dropped.length ? ` (skipped: ${dropped.join(', ')})` : ''}`, { action: { label: 'Undo', onClick: () => { updateChartSettings(prev.settings); symbolRef.current = prev.symbol; setSymbol(prev.symbol) } } })
    return dropped
  }

  const [journalFocus, setJournalFocus] = useState<number | null>(null)
  const [chatPrompt, setChatPrompt] = useState<{ text: string; n: number } | null>(null)
  const openJournal = (id?: number) => { if (id != null) setJournalFocus(id); setView('journal') }

  /** Turns a journal idea into a pre-filled order ticket on the chart. */
  const ticketFromEntry = (e: JournalItem) => {
    if (!e.symbol) return
    const short = e.direction === 'short'
    const bracket = e.plan_stop != null && e.plan_target != null
    setSymbol(e.symbol)
    setView('chart')
    setTicket({
      ...emptyDraft(short ? 'sell_short' : 'buy'), qty: String(e.plan_qty ?? 10), type: e.plan_entry != null ? 'limit' : 'market', limit: e.plan_entry != null ? String(e.plan_entry) : '',
      strategy: bracket ? 'bracket' : 'single', target: e.plan_target != null ? String(e.plan_target) : '', protectStop: e.plan_stop != null ? String(e.plan_stop) : '',
      tif: 'gtc', source: e.source, note: e.body.slice(0, 400) || undefined, journalId: e.id, journal: true
    })
    toast.info(`Ticket filled from “${e.title}”. Review it before sending.`)
  }

  const openTicket = (want: 'buy' | 'sell') => {
    const pos = snap?.positions.find((p) => p.symbol === symbol)
    const side: Side = want === 'buy' ? (pos && pos.qty < 0 ? 'buy_to_cover' : 'buy') : pos && pos.qty > 0 ? 'sell' : 'sell_short'
    const d = ticketRef.current
    setTicket(d ? { ...d, side } : { ...emptyDraft(side), qty: pos ? String(Math.abs(pos.qty)) : '10' })
  }

  useEffect(() => {
    window.api.getSetting('chart').then((s) => s && setChartSettings({ ...DEFAULT_CHART_SETTINGS, ...s }))
  }, [])
  const updateChartSettings = (s: ChartSettings) => {
    settingsRef.current = s
    setChartSettings(s)
    window.api.setSetting('chart', s)
  }
  // When the FMP plan turns out not to include what the chart (or a screen) is using, move to something it does include instead of showing an error.
  useEffect(() => {
    const cur = settingsRef.current
    const fit = usableTimeframe(cur.range, cur.interval)
    if (fit.range !== cur.range || fit.interval !== cur.interval) {
      updateChartSettings({ ...cur, ...fit })
      const label = (id: string) => INTERVALS.find((i) => i.id === id)?.label ?? id
      toast.info(`Your FMP plan has no ${label(cur.interval)} bars, so the chart switched to ${label(fit.interval)}.`, { title: 'Chart changed' })
    }
    if (!plan.hasScreen(view)) setView('chart')
  }, [plan.unavailable, chartSettings.range, chartSettings.interval])
  const chartData = useChartData(symbol, chartSettings, live)
  const drawingsState = useDrawings(symbol)

  // Claude's tools reach the live chart through this bridge (see chart/tools.ts).
  const settingsRef = useRef(chartSettings)
  const symbolRef = useRef(symbol)
  const viewRef = useRef<string>(view)
  settingsRef.current = chartSettings
  symbolRef.current = symbol
  viewRef.current = view
  const activeListRef = useRef<number | null>(null)
  const snapRef = useRef(snap)
  snapRef.current = snap
  const quoteRef = useRef(quote)
  quoteRef.current = quote
  const latest = useRef({ chartData, drawingsState, live })
  latest.current = { chartData, drawingsState, live }
  useEffect(() => {
    chartBridge.impl = {
      snapshot: () => {
        const { chartData: d, drawingsState: dr, live: lv } = latest.current
        return {
          view: viewRef.current, symbol: symbolRef.current, settings: settingsRef.current, candles: d.candles,
          ready: d.candles !== null && d.loadedKey === chartKey(symbolRef.current, settingsRef.current),
          loadError: d.error, sample: !lv, drawings: dr.drawings, drawingsReady: dr.ready
        }
      },
      setSymbol: (s) => { symbolRef.current = s; setSymbol(s) },
      updateSettings: (fn) => updateChartSettings(fn(settingsRef.current)),
      updateDrawings: (fn) => latest.current.drawingsState.update(fn),
      navigate: (v) => setView(v as ViewId),
      openJournal: (id) => openJournal(id),
      applyChartSetup: (setup, name, sym) => applyChartSetup(setup, name, sym),
      getCalc: () => calcRef.current,
      setCalc: (p) => updateCalc(p),
      getRules: () => rulesRef.current,
      activeListId: () => activeListRef.current,
      getTicket: () => ticketRef.current,
      setTicket: (d) => setTicket(d),
      trade: () => snapRef.current,
      lastPrice: () => quoteRef.current.last
    }
    const off = window.api.tools.onCall(async (c) => { window.api.tools.respond(c.callId, await runTool(c.name, c.input)) })
    return () => { off(); chartBridge.impl = null }
  }, [])

  // ---- watchlists ----
  const loadLists = useCallback(() => window.api.watchlists.lists().then(setLists), [])
  useEffect(() => { loadLists(); return window.api.watchlists.onChanged(loadLists) }, [loadLists])
  useEffect(() => { window.api.getSetting('wlActive').then((id) => typeof id === 'number' && setActiveListId(id)) }, [])
  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null
  const watch = activeList?.symbols ?? []
  activeListRef.current = activeList?.id ?? null
  const chooseList = (id: number) => { setActiveListId(id); window.api.setSetting('wlActive', id) }
  useEffect(() => { refreshTrading() }, [view])

  const openWatchlists = () => setView('watch')
  const toggleInList = async (listId: number, add: boolean) => {
    const list = lists.find((l) => l.id === listId)
    if (!list) return
    if (add) {
      const r = await window.api.watchlists.add(listId, symbol)
      if (r.ok) toast.success(`${symbol} added to ${list.name}`, { action: { label: 'View', onClick: () => { chooseList(listId); openWatchlists() } } })
      else toast.error(r.error)
    } else {
      await window.api.watchlists.removeSymbol(listId, symbol)
      toast.info(`${symbol} removed from ${list.name}`)
    }
    loadLists()
  }
  const createList = async (name: string, addSymbol?: string) => {
    const r = await window.api.watchlists.create(name)
    if (!r.ok) { toast.error(r.error); return }
    chooseList(r.id)
    if (addSymbol) await window.api.watchlists.add(r.id, addSymbol)
    toast.success(addSymbol ? `Created “${name}” with ${addSymbol}` : `Created watchlist “${name}”`)
    loadLists()
  }
  const newListDialog = async () => {
    const name = await promptText({ title: 'New watchlist', label: 'Name', placeholder: 'e.g. Tech, Earnings this week', okLabel: 'Create', validate: (v) => (v ? null : 'Give the list a name.') })
    if (name) createList(name)
  }
  const renameList = async (l: WatchList) => {
    const name = await promptText({ title: 'Rename watchlist', label: 'Name', initial: l.name, okLabel: 'Rename', validate: (v) => (v ? null : 'Give the list a name.') })
    if (!name || name === l.name) return
    const r = await window.api.watchlists.rename(l.id, name)
    if (r.ok) toast.success(`Renamed to “${name}”`); else toast.error(r.error)
    loadLists()
  }
  const deleteList = async (l: WatchList) => {
    if (!window.confirm(`Delete the watchlist “${l.name}” and its ${l.symbols.length} symbol${l.symbols.length === 1 ? '' : 's'}?`)) return
    const r = await window.api.watchlists.remove(l.id)
    if (r.ok) toast.info(`Deleted “${l.name}”`); else toast.error(r.error)
    loadLists()
  }
  const addSymbolTo = async (listId: number, sym: string) => {
    const r = await window.api.watchlists.add(listId, sym)
    if (!r.ok) toast.error(r.error)
    else if (!r.added) toast.info(`${r.symbol} is already on this list`)
    else toast.success(`${r.symbol} added`)
    loadLists()
  }
  const removeSymbolFrom = async (listId: number, sym: string) => {
    await window.api.watchlists.removeSymbol(listId, sym)
    toast.info(`${sym} removed`)
    loadLists()
  }

  const orderLines = useMemo(
    () => [...tradeLines(symbol, snap?.orders ?? [], snap?.positions ?? []), ...(ticket ? draftLines(ticket, symbol, quote.last) : [])],
    [symbol, snap, ticket, quote.last]
  )
  const moveOrderLine = async (id: string, price: number) => {
    const p = String(Math.round(price * 100) / 100)
    const d = ticketRef.current
    if (id.startsWith('draft:') && d) {
      if (id === 'draft:target') setTicket({ ...d, target: p })
      else if (id === 'draft:stop') setTicket({ ...d, protectStop: p })
      else setTicket({ ...d, ...(d.type === 'stop' ? { stop: p } : { limit: p }) })
    } else if (id.startsWith('order:')) {
      const o = snap?.orders.find((x) => x.id === Number(id.slice(6)))
      if (!o) return
      const r = await window.api.trade.modify(o.id, o.type === 'limit' ? { limit: price } : { stop: price })
      if (!r.ok) toast.error(r.errors.join(' '), { title: 'Could not move order' })
      else toast.success(`${o.side.replace(/_/g, ' ')} ${o.type.replace('_', ' ')} order moved to ${price.toFixed(2)}`)
      refreshTrading()
    }
  }

  const chatContext = useMemo(() => ({
    screen: view,
    symbol,
    timeZone: tz,
    chart: { range: chartSettings.range, interval: chartSettings.interval, type: chartSettings.type, scale: chartSettings.scale,
      studies: chartSettings.studies.filter((s) => s.visible).map((s) => ({ study: s.studyId, params: s.params })) },
    account: snap ? { name: snap.account.name, brokerage: snap.account.broker, kind: 'paper (simulated money)', type: snap.account.type, equity: snap.account.equity, cash: snap.account.cash, buyingPowerAvailable: snap.account.buyingPower, openPL: snap.account.unrealizedPl, realizedPL: snap.account.realizedPl } : null,
    positions: snap?.positions.map((p) => ({ symbol: p.symbol, qty: p.qty, avg: p.avg, last: p.mark, unrealizedPL: p.unrealized })) ?? [],
    workingOrders: snap?.orders.filter((o) => o.status === 'working' || o.status === 'pending').length ?? 0,
    watchlists: lists.map((l) => ({ name: l.name, symbols: l.symbols })),
    riskRules: rules
  }), [view, symbol, chartSettings, snap, lists, tz, rules])

  return (
    <div className="app">
      <TitleBar title={`${symbol} — Trading Lab`} onOpenSettings={() => setView('settings')} onOpenChartSettings={() => setView('chartSettings')} onOpenAbout={() => setAboutOpen(true)} onOpenHelp={() => openHelp()} />
      <div className="body">
        <nav className="ribbon">
          {RIBBON.filter((r) => plan.hasScreen(r.id)).map(({ id, Icon, label }) => (
            <button key={id} title={label} className={(id === 'chart' ? SYMBOL_VIEWS.includes(view) : view === id) ? 'active' : ''} onClick={() => setView(id)}>
              <Icon size={24} strokeWidth={1.5} />
            </button>
          ))}
          <span className="spacer" />
          <button title="Settings" className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}><Settings size={24} strokeWidth={1.5} /></button>
        </nav>

        <Group orientation="horizontal" className="workbench">
          <Panel defaultSize="75%" minSize="30%">
            {view === 'chart' && <ChartView symbol={symbol} settings={chartSettings} live={live} candles={chartData.candles} loading={chartData.loading} error={chartData.error} onReload={chartData.reload} dataKey={chartData.loadedKey} checkedAt={chartData.checkedAt} refreshError={chartData.refreshError}
              drawings={drawingsState.drawings} onDrawingsChange={(d) => drawingsState.update(() => d)}
              onSettingsChange={updateChartSettings} onSymbolChange={setSymbol} onNavigate={setView} onOpenSettings={() => setView('settings')}
              orderLines={orderLines} onOrderLineMove={moveOrderLine} onOpenTicket={openTicket} tz={tz} hour12={display.hour12} lists={lists} activeListId={activeList?.id ?? null} onActiveListChange={chooseList} onManageWatchlist={openWatchlists} onToggleInList={toggleInList} onCreateList={(name) => createList(name, symbol)}
              overlay={ticket && <TradeTicket symbol={symbol} draft={ticket} onChange={setTicket} quote={quote} snapshot={snap} live={live} onClose={() => setTicket(null)} />} />}
            {view === 'news' && <NewsView symbol={symbol} onNavigate={setView} live={live} />}
            {view === 'quote' && <QuoteView symbol={symbol} onNavigate={setView} live={live} />}
            {view === 'analyst' && <AnalystView symbol={symbol} onNavigate={setView} live={live} />}
            {view === 'fundamentals' && <FundamentalsView symbol={symbol} onNavigate={setView} live={live} />}
            {view === 'options' && <OptionsView symbol={symbol} onNavigate={setView} live={live} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} />}
            {view === 'screener' && <ScreenerView live={live} onSelectSymbol={(s) => { setSymbol(s); setView('chart') }} onAddToWatchlist={async (s) => { const l = activeList; if (!l) return; const r = await window.api.watchlists.add(l.id, s); if (!r.ok) toast.error(r.error); else if (!r.added) toast.info(`${r.symbol} is already on ${l.name}`); else toast.success(`${r.symbol} added to ${l.name}`); loadLists() }}
              onSaveAsWatchlist={async (name, symbols) => { const c = await window.api.watchlists.create(name); if (!c.ok) { toast.error(c.error); return } for (const s of symbols) await window.api.watchlists.add(c.id, s); chooseList(c.id); toast.success(`Saved ${symbols.length} symbols to “${name}”`, { action: { label: 'View', onClick: () => setView('watch') } }); loadLists() }}
              onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} onOpenSettings={() => setView('settings')} />}
            {view === 'strategies' && <StrategiesView symbol={symbol} chartSettings={chartSettings} onApplyChart={(setup, name) => applyChartSetup(setup, name)} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} />}
            {view === 'congress' && <CongressView live={live} symbol={symbol} onSelectSymbol={(s) => { setSymbol(s); setView('chart') }} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} onOpenSettings={() => setView('settings')} />}
            {view === 'market' && <MarketView live={live} onSelectSymbol={(s) => { setSymbol(s); setView('chart') }} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} onOpenSettings={() => setView('settings')} />}
            {view === 'marketnews' && <MarketNewsView live={live} lists={lists} activeListId={activeList?.id ?? null} snap={snap} onSelectSymbol={(s) => { setSymbol(s); setView('chart') }} onOpenSettings={() => setView('settings')} />}
            {view === 'calculator' && <CalculatorView calc={calc} onCalc={updateCalc} rules={rules} onRules={updateRules} snap={snap} live={live} chartSymbol={symbol} onOpenTicket={ticketFromCalc} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} onOpenJournal={openJournal} />}
            {view === 'portfolio' && <PortfolioView live={live} onSelect={(s) => { setSymbol(s); setView('chart') }} onOpenSettings={() => setView('settings')} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} />}
            {view === 'journal' && <JournalView symbol={symbol} focusId={journalFocus} onOpenChart={(s) => { setSymbol(s); setView('chart') }} onOpenTicket={ticketFromEntry} onAskClaude={(text) => setChatPrompt({ text, n: Date.now() })} />}
            {view === 'account' && <AccountView snap={snap} onReset={refreshTrading} />}
            {view === 'trades' && <TradesView snap={snap} onChanged={refreshTrading} onSelectSymbol={(s) => { setSymbol(s); setView('chart') }} />}
            {view === 'chartSettings' && <ChartSettingsView settings={chartSettings} onChange={updateChartSettings} />}
            {view === 'help' && <HelpView topicId={helpTopic} onTopic={setHelpTopic} onOpenView={(v) => setView(v as ViewId)} />}
            {view === 'settings' && <SettingsView onDataKeyChange={refreshLive} display={display} onDisplayChange={updateDisplay} />}
            {view === 'watch' && (
              <WatchlistView lists={lists} activeId={activeList?.id ?? null} onActiveChange={chooseList} selected={symbol} onSelect={(s) => { setSymbol(s); setView('chart') }} live={live}
                onAddSymbol={addSymbolTo} onRemoveSymbol={removeSymbolFrom} onCreate={newListDialog} onRename={renameList} onDelete={deleteList} />
            )}
          </Panel>
          <Separator className="sep sep-v" />
          <Panel defaultSize="25%" minSize="15%">
            <ChatPanel context={chatContext} symbol={symbol} externalPrompt={chatPrompt} onOpenSettings={() => setView('settings')} />
          </Panel>
        </Group>
      </div>
      <StatusBar symbol={symbol} account={snap ? { name: snap.account.name, broker: snap.account.broker } : null} onOpenAccount={() => setView('account')} equity={snap?.account.equity ?? null} buyingPower={snap?.account.buyingPower ?? null} openTrades={snap?.orders.filter((o) => o.status === 'working').length ?? 0} live={live} display={display} onOpenSettings={() => setView('settings')} />
      <Toaster />
      <DialogHost />
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
    </div>
  )
}
