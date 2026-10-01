import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import NewsList, { mergeNews } from '../components/NewsList'
import ScreenFrame from '../components/ScreenFrame'
import type { SymbolView } from '../components/SymbolTabs'
import type { NewsArticle } from '../../../shared/fmp'

const PAGE = 20

export default function NewsView({ symbol, onNavigate, live }: { symbol: string; onNavigate: (v: SymbolView) => void; live: boolean }) {
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [more, setMore] = useState(true)
  const page = useRef(0)
  const seq = useRef(0)

  const load = useCallback(async (reset: boolean) => {
    if (!live) return
    const id = ++seq.current
    if (reset) page.current = 0
    setLoading(true); setError(null)
    const r = await window.api.fmp.news({ symbol, limit: PAGE, page: page.current })
    if (id !== seq.current) return
    setLoading(false)
    if (!r.ok) { setError(r.error); return }
    setMore(r.data.length >= PAGE)
    setItems((prev) => mergeNews(prev, r.data, reset))
  }, [symbol, live])

  useEffect(() => { setItems([]); setMore(true); load(true) }, [symbol, live])
  useEffect(() => { if (!live) return; const t = setInterval(() => load(true), 5 * 60_000); return () => clearInterval(t) }, [load, live])

  return (
    <ScreenFrame title="News" symbol={symbol} view="news" onNavigate={onNavigate} full loading={live && loading && items.length === 0} error={error} onRetry={() => load(true)}>
      {!live && <div className="muted">News comes from Financial Modeling Prep. Add your FMP key in File → Settings to see headlines for {symbol}.</div>}
      {live && (
        <div className="news-bar">
          <span className="muted">Latest headlines for <b>{symbol}</b> · refreshes every 5 minutes</span>
          <span className="spacer" />
          <button className="btn small" disabled={loading} onClick={() => load(true)}><RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh</button>
        </div>
      )}
      {live && !loading && !error && items.length === 0 && <div className="muted">No recent news for {symbol}. Index symbols and some ETFs have no company news.</div>}
      <NewsList items={items} />
      {live && items.length > 0 && more && <div className="news-more"><button className="btn" disabled={loading} onClick={() => { page.current += 1; load(false) }}>{loading ? 'Loading…' : 'Load more'}</button></div>}
    </ScreenFrame>
  )
}
