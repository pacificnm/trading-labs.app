import { useEffect, useRef, useState } from 'react'
import { MousePointer2, TrendingUp, MoveUpRight, Minus, Ruler, Square, Trash2, PenLine, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SymbolTabs, { type SymbolView } from '../components/SymbolTabs'
import SymbolSearch from '../components/SymbolSearch'
import IndexTicker from '../components/IndexTicker'
import WatchlistDropdown from '../components/WatchlistDropdown'
import StarMenu from '../components/StarMenu'
import type { WatchList } from '../../../shared/watchlists'
import { availableRanges, allowedIntervals, coerceInterval, intervalInfo, type Interval, type Range } from '../chart/timeframe'
import Chart from '../components/Chart'
import type { ChartSettings } from '../chart/settings'
import type { Drawing, Tool } from '../chart/drawings'
import type { Candle } from '../chart/indicators'
import type { OrderLine } from '../chart/drawings'
import type { ReactNode } from 'react'

const TOOLS: { id: Tool; Icon: LucideIcon; label: string }[] = [
  { id: 'cursor', Icon: MousePointer2, label: 'Cursor (select / edit drawings)' },
  { id: 'trend', Icon: TrendingUp, label: 'Trendline' },
  { id: 'ray', Icon: MoveUpRight, label: 'Ray' },
  { id: 'hline', Icon: Minus, label: 'Horizontal line' },
  { id: 'fib', Icon: Ruler, label: 'Fibonacci retracement' },
  { id: 'rect', Icon: Square, label: 'Rectangle' }
]

interface Props {
  symbol: string
  settings: ChartSettings
  live: boolean
  candles: Candle[] | null
  loading: boolean
  error: string | null
  onReload: () => void
  drawings: Drawing[]
  onDrawingsChange: (d: Drawing[]) => void
  onSettingsChange: (s: ChartSettings) => void
  onSymbolChange: (s: string) => void
  onNavigate: (v: SymbolView) => void
  onOpenSettings: () => void
  orderLines: OrderLine[]
  onOrderLineMove: (id: string, price: number) => void
  onOpenTicket: (side: 'buy' | 'sell') => void
  tz: string
  hour12: boolean
  lists: WatchList[]
  activeListId: number | null
  onActiveListChange: (id: number) => void
  onManageWatchlist: () => void
  onToggleInList: (listId: number, add: boolean) => void
  onCreateList: (name: string) => void
  overlay?: ReactNode
}

export default function ChartView({ symbol, settings, live, candles, loading, error, onReload, drawings, onDrawingsChange: change, onSettingsChange, onSymbolChange, onNavigate, onOpenSettings, orderLines, onOrderLineMove, onOpenTicket, tz, hour12, lists, activeListId, onActiveListChange, onManageWatchlist, onToggleInList, onCreateList, overlay }: Props) {
  const [tool, setTool] = useState<Tool>('cursor')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const away = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [menuOpen])

  return (
    <div className="col">
      <div className="topbar">
        <SymbolSearch onSelect={onSymbolChange} live={live} />
        <WatchlistDropdown lists={lists} activeId={activeListId} onActiveChange={onActiveListChange} selected={symbol} live={live} onSelect={onSymbolChange} onManage={onManageWatchlist} />
        <IndexTicker onSelect={onSymbolChange} live={live} />
      </div>
      <div className="pane-title">
        <StarMenu symbol={symbol} lists={lists} onToggle={onToggleInList} onCreate={onCreateList} />
        <span>{symbol} — Chart</span>
        <span className="spacer" />
        <select className="tf-select" title="Length" value={settings.range}
          onChange={(e) => { const range = e.target.value as Range; onSettingsChange({ ...settings, range, interval: coerceInterval(range, settings.interval) }) }}>
          {availableRanges().map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select className="tf-select" title="Interval" value={settings.interval}
          onChange={(e) => onSettingsChange({ ...settings, interval: e.target.value as Interval })}>
          {allowedIntervals(settings.range).map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
        </select>
        <SymbolTabs view="chart" onNavigate={onNavigate} />
        <div className="title-menu" ref={menuRef}>
          <button className={'title-btn' + (menuOpen || tool !== 'cursor' ? ' active' : '')} title="Drawing tools" onClick={() => setMenuOpen(!menuOpen)}>
            <PenLine size={15} strokeWidth={1.5} />
          </button>
          {menuOpen && (
            <div className="dropdown right">
              {TOOLS.map(({ id, Icon, label }) => (
                <button key={id} className={tool === id ? 'checked' : ''} onClick={() => { setTool(id); setMenuOpen(false) }}>
                  <span className="item"><Icon size={15} strokeWidth={1.5} /> {label}</span>
                </button>
              ))}
              <hr />
              <button disabled={!drawings.some((d) => d.by === 'claude')} onClick={() => { change(drawings.filter((d) => d.by !== 'claude')); setMenuOpen(false) }}>
                <span className="item"><Sparkles size={15} strokeWidth={1.5} /> Remove Claude's drawings</span>
              </button>
              <button disabled={drawings.length === 0} onClick={() => { change([]); setMenuOpen(false) }}>
                <span className="item"><Trash2 size={15} strokeWidth={1.5} /> Remove all drawings</span>
              </button>
            </div>
          )}
        </div>
        <button className="tbtn buy" onClick={() => onOpenTicket('buy')}>Buy</button>
        <button className="tbtn sell" onClick={() => onOpenTicket('sell')}>Sell</button>
      </div>
      <div className="chart-wrap">
        <div className="chart-area">
          {!live && <button className="chart-note" onClick={onOpenSettings}>Sample data — add your FMP key in Settings</button>}
          {live && loading && <div className="chart-note">Loading…</div>}
          {live && error && <div className="chart-note err">{error} <button onClick={onReload}>Retry</button></div>}
          {candles && <Chart candles={candles} intraday={intervalInfo(settings.interval).intraday} tz={tz} hour12={hour12} settings={settings} tool={tool} onToolChange={setTool} drawings={drawings} onDrawingsChange={change} orderLines={orderLines} onOrderLineMove={onOrderLineMove} />}
        </div>
        {overlay}
      </div>
    </div>
  )
}
