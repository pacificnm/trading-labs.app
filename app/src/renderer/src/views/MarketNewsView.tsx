import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import NewsList, { mergeNews } from '../components/NewsList'
import type { NewsArticle } from '../../../shared/fmp'
import type { WatchList } from '../../../shared/watchlists'
import type { TradeSnapshot } from '../../../shared/trade'

type Tab = 'market' | 'watchlist' | 'positions'
const PAGE = 25

export default function MarketNewsView({ live, lists, activeListId, snap, onSelectSymbol, onOpenSettings }: {
  live: boolean; lists: WatchList[]; activeListId: number | null; snap: TradeSnapshot | null; onSelectSymbol: (s: string) => void; onOpenSettings: () => void
}) {
  const [tab, setTab] = useState<Tab>('market')
  const [listId, setListId] = useState<number | null>(activeListId)
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [more, setMore] = useState(true)
  const [filter, setFilter] = useState('')
  const page = useRef(0)
  const seq = useRef(0)

  const list = lists.find((l) => l.id === listId) ?? lists.find((l) => l.id === activeListId) ?? lists[0]
  const heldSymbols = useMemo(() => [...new Set([...(snap?.positions ?? []).map((p) => p.symbol), ...(snap?.orders ?? []).filter((o) => o.status === 'working' || o.status === 'pending').map((o) => o.symbol)])], [snap])
  const symbols = tab === 'watchlist' ? list?.symbols ?? [] : tab === 'positions' ? heldSymbols : []
  const key = tab + '|' + symbols.join(',')

  const load = useCallback(async (reset: boolean) => {
    if (!live) return
    if (tab !== 'market' && symbols.length === 0) { setItems([]); setMore(false); setLoading(false); return }
    const id = ++seq.current
    if (reset) page.current = 0
    setLoading(true); setError(null)
    const r = await window.api.fmp.news(tab === 'market' ? { general: true, limit: PAGE, page: page.current } : { symbols, limit: PAGE, page: page.current })
    if (id !== seq.current) return
    setLoading(false)
    if (!r.ok) { setError(r.error); return }
    setMore(r.data.length >= PAGE)
    setItems((prev) => mergeNews(prev, r.data, reset))
  }, [live, key])

  useEffect(() => { setItems([]); setMore(true); load(true) }, [key, live])
  useEffect(() => { if (!live) return; const t = setInterval(() => load(true), 5 * 60_000); return () => clearInterval(t) }, [load, live])

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? items.filter((a) => `${a.title} ${a.text} ${a.publisher} ${a.symbol}`.toLowerCase().includes(q)) : items
  }, [items, filter])

  const TABS: [Tab, string][] = [['market', 'Market'], ['watchlist', `Watchlist (${list?.symbols.length ?? 0})`], ['positions', `Positions & orders (${heldSymbols.length})`]]
  const emptyMsg = tab === 'watchlist' ? 'This watchlist is empty. Add symbols with the star next to the chart title.' : tab === 'positions' ? 'You have no open positions or working orders, so there is nothing to follow here yet.' : 'No news returned.'

  return (
    <div className="col">
      <div className="pane-title"><span>Market News</span></div>
      <div className="subtabs">
        {TABS.map(([id, l]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{l}</button>)}
        <span className="spacer" style={{ flex: 1 }} />
        {tab === 'watchlist' && lists.length > 1 && (
          <select className="tf-select" title="Watchlist" value={list?.id} onChange={(e) => setListId(Number(e.target.value))}>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        )}
      </div>
      <div className="pane-body pad screen">
        {!live ? (
          <div className="muted">Market news comes from Financial Modeling Prep. <a className="link" onClick={onOpenSettings}>Add your FMP key</a> to see it.</div>
        ) : (
          <>
            <div className="news-bar">
              <div className="search-box news-filter"><input style={{ textTransform: 'none' }} placeholder="Filter headlines…" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
              <span className="muted">{tab === 'market' ? 'Latest market-wide headlines' : `News for ${symbols.slice(0, 6).join(', ')}${symbols.length > 6 ? ` +${symbols.length - 6} more` : ''}`} · refreshes every 5 min</span>
              <span className="spacer" />
              <button className="btn small" disabled={loading} onClick={() => load(true)}><RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh</button>
            </div>
            {error && <div className="msg-error"><span>{error}</span><button onClick={() => load(true)}>Retry</button></div>}
            {loading && items.length === 0 && <div className="muted">Loading…</div>}
            {!loading && !error && shown.length === 0 && <div className="muted">{filter ? 'No headlines match your filter.' : emptyMsg}</div>}
            <NewsList items={shown} showSymbol={tab !== 'market' || shown.some((a) => a.symbol)} onSymbol={onSelectSymbol} />
            {items.length > 0 && more && !filter && <div className="news-more"><button className="btn" disabled={loading} onClick={() => { page.current += 1; load(false) }}>{loading ? 'Loading…' : 'Load more'}</button></div>}
          </>
        )}
      </div>
    </div>
  )
}
