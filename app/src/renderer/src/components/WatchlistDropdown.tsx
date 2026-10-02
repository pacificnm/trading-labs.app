import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ListChecks, Star } from 'lucide-react'
import { pick, pickStr } from '../data/fmp'
import type { WatchList } from '../../../shared/watchlists'

interface Q { price: number | null; pct: number | null }

/** Quick symbol switcher for the watchlist, with live prices when market data is connected. */
export default function WatchlistDropdown({ lists, activeId, onActiveChange, selected, live, onSelect, onManage }: {
  lists: WatchList[]; activeId: number | null; onActiveChange: (id: number) => void; selected: string; live: boolean; onSelect: (s: string) => void; onManage: () => void
}) {
  const active = lists.find((l) => l.id === activeId) ?? lists[0]
  const symbols = active?.symbols ?? []
  const [open, setOpen] = useState(false)
  const [quotes, setQuotes] = useState<Record<string, Q>>({})
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  // prices are fetched when the menu opens (the client caches them briefly)
  useEffect(() => {
    if (!open || !live || symbols.length === 0) return
    let alive = true
    window.api.fmp.quotes(symbols).then((r) => {
      if (alive && r.ok) setQuotes(Object.fromEntries(r.data.map((q) => [pickStr(q, 'symbol'), { price: pick(q, 'price'), pct: pick(q, 'changePercentage', 'changesPercentage') }])))
    })
    return () => { alive = false }
  }, [open, live, symbols.join(',')])

  const onList = lists.some((l) => l.symbols.includes(selected))
  return (
    <div className="wl-dd" ref={ref}>
      <button className={'wl-dd-btn' + (open ? ' open' : '')} title="Watchlist" onClick={() => setOpen(!open)}>
        <Star size={13} strokeWidth={1.5} fill={onList ? 'currentColor' : 'none'} className={onList ? 'wl-star' : ''} />
        <span className="wl-name">{active?.name ?? 'Watchlist'}</span>
        <span className="muted">{symbols.length}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="dropdown wl-menu">
          {lists.length > 1 && (
            <div className="wl-lists">
              {lists.map((l) => <button key={l.id} className={'tk-chip' + (l.id === active?.id ? ' on' : '')} onClick={() => onActiveChange(l.id)}>{l.name}</button>)}
            </div>
          )}
          {symbols.length === 0 && <div className="wl-empty muted">This list is empty. Use the star next to the chart title to add the current symbol.</div>}
          {symbols.map((s) => {
            const q = quotes[s]
            return (
              <button key={s} className={s === selected ? 'checked' : ''} onClick={() => { onSelect(s); setOpen(false) }}>
                <b>{s}</b>
                <span className="wl-q">
                  {q?.price != null && <span>{q.price.toFixed(2)}</span>}
                  {q?.pct != null && <span className={q.pct >= 0 ? 'up' : 'down'}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}%</span>}
                </span>
              </button>
            )
          })}
          <hr />
          <button onClick={() => { setOpen(false); onManage() }}><span className="item"><ListChecks size={14} strokeWidth={1.5} /> Manage watchlist…</span></button>
        </div>
      )}
    </div>
  )
}
