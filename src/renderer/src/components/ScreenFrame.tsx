import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import SymbolTabs, { type SymbolView } from './SymbolTabs'
import { ago } from './NewsList'
import { formatClock, resolveTz, tzAbbr } from '../display'

export default function ScreenFrame({ title, symbol, view, onNavigate, sample, loading, error, onRetry, wide, full, asOf, asOfLabel, onRefresh, refreshing, children }: {
  title: string; symbol: string; view: SymbolView; onNavigate: (v: SymbolView) => void
  /** true or a custom message shows the amber sample-data note */
  sample?: boolean | string; loading?: boolean; error?: string | null; onRetry?: () => void
  /** use the full width (card grids) instead of a readable single column */
  wide?: boolean
  /** no width cap at all (long lists such as news) */
  full?: boolean
  /** when the data was fetched (UTC seconds) and a way to refetch it, bypassing the cache */
  asOf?: number | null; asOfLabel?: string; onRefresh?: () => void; refreshing?: boolean; children: ReactNode
}) {
  return (
    <div className="col">
      <div className="pane-title">
        <span>{symbol} — {title}</span>
        <span className="spacer" />
        <SymbolTabs view={view} onNavigate={onNavigate} />
      </div>
      <div className="pane-body pad screen"><div className={'screen-inner' + (full ? ' full' : wide ? ' wide' : '')}>
        {sample && <div className="sample-note">{typeof sample === 'string' ? sample : 'Sample data — add your FMP key in File → Settings.'}</div>}
        {asOf != null && (
          <div className="asof muted">
            Data as of {formatClock(asOf, undefined, true)} {tzAbbr(resolveTz(), asOf)}{ago(asOf) ? ` · ${ago(asOf)}` : ''} · {asOfLabel ?? 'cached to limit FMP requests'}
            {onRefresh && <button className="btn small" disabled={refreshing} onClick={onRefresh}><RefreshCw size={12} className={refreshing ? 'spin' : ''} /> Refresh</button>}
          </div>
        )}
        {loading && <div className="muted">Loading…</div>}
        {error && <div className="msg-error"><span>{error}</span>{onRetry && <button onClick={onRetry}>Retry</button>}</div>}
        {children}
      </div></div>
    </div>
  )
}

export function KV({ data }: { data: Record<string, string | number> }) {
  return (
    <div className="kv">
      {Object.entries(data).map(([k, v]) => (
        <div key={k}><span className="muted">{k}</span><b>{v}</b></div>
      ))}
    </div>
  )
}

/** Horizontal marker showing where `value` sits between `low` and `high`. */
export function RangeBar({ label, low, high, value, fmt }: { label: string; low: number; high: number; value: number; fmt: (n: number) => string }) {
  const pos = Math.max(0, Math.min(100, ((value - low) / (high - low)) * 100))
  return (
    <div className="range">
      <div className="muted">{label}</div>
      <div className="range-row"><span>{fmt(low)}</span><div className="range-bar"><i style={{ left: `${pos}%` }} /></div><span>{fmt(high)}</span></div>
    </div>
  )
}
