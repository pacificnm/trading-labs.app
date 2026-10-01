import { ExternalLink } from 'lucide-react'
import { formatDateTime } from '../display'
import type { NewsArticle } from '../../../shared/fmp'

export function ago(t: number): string {
  const s = Math.max(0, Date.now() / 1000 - t)
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  if (s < 86400 * 14) return `${Math.round(s / 86400)} d ago`
  return ''
}
const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }

/** Merge pages of articles: drop duplicates, newest first. */
export function mergeNews(prev: NewsArticle[], next: NewsArticle[], reset: boolean): NewsArticle[] {
  const seen = new Set<string>()
  return (reset ? next : [...prev, ...next]).filter((a) => (seen.has(a.url || a.title) ? false : (seen.add(a.url || a.title), true))).sort((a, b) => b.time - a.time)
}

/** The article rows shared by the per-symbol News screen and the Market News screen. */
export default function NewsList({ items, showSymbol, onSymbol }: { items: NewsArticle[]; showSymbol?: boolean; onSymbol?: (s: string) => void }) {
  return (
    <div className="news-list">
      {items.map((a) => (
        <article key={a.url || a.title} className="news-item" onClick={() => a.url && window.api.openExternal(a.url)}>
          <div className="news-main">
            <div className="news-title">{a.title}{a.url && <ExternalLink size={12} className="news-ext" />}</div>
            <div className="news-meta muted">
              {showSymbol && a.symbol && <button className="news-sym" title={`Open ${a.symbol} chart`} onClick={(e) => { e.stopPropagation(); onSymbol?.(a.symbol) }}>{a.symbol}</button>}
              <b>{a.publisher || host(a.url)}</b>
              <span>{ago(a.time) || formatDateTime(a.time)}</span>
              <span>{formatDateTime(a.time)}</span>
            </div>
            {a.text && <div className="news-text">{a.text}</div>}
          </div>
          {a.image && <img className="news-img" src={a.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
        </article>
      ))}
    </div>
  )
}
