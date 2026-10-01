import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { pick, pickStr } from '../data/fmp'
import { money, pct } from '../format'
import type { WatchList } from '../../../shared/watchlists'

interface Row { price: number | null; change: number | null; pct: number | null }

export default function WatchlistView({ lists, activeId, onActiveChange, selected, onSelect, live, onAddSymbol, onRemoveSymbol, onCreate, onRename, onDelete }: {
  lists: WatchList[]; activeId: number | null; onActiveChange: (id: number) => void; selected: string; onSelect: (s: string) => void; live: boolean
  onAddSymbol: (listId: number, symbol: string) => void; onRemoveSymbol: (listId: number, symbol: string) => void
  onCreate: () => void; onRename: (l: WatchList) => void; onDelete: (l: WatchList) => void
}) {
  const active = lists.find((l) => l.id === activeId) ?? lists[0]
  const symbols = active?.symbols ?? []
  const [q, setQ] = useState<Record<string, Row>>({})
  const [text, setText] = useState('')

  useEffect(() => {
    if (!live || symbols.length === 0) return
    const load = async () => {
      const r = await window.api.fmp.quotes(symbols)
      if (r.ok) setQ(Object.fromEntries(r.data.map((x) => [pickStr(x, 'symbol'), { price: pick(x, 'price'), change: pick(x, 'change'), pct: pick(x, 'changePercentage', 'changesPercentage') }])))
    }
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [live, symbols.join(',')])

  const add = () => { if (active && text.trim()) { onAddSymbol(active.id, text.trim()); setText('') } }

  return (
    <div className="col">
      <div className="pane-title"><span>Watchlists</span></div>
      <div className="subtabs wl-tabs">
        {lists.map((l) => (
          <button key={l.id} className={l.id === active?.id ? 'active' : ''} onClick={() => onActiveChange(l.id)} onDoubleClick={() => onRename(l)} title="Double-click to rename">
            {l.name} <span className="muted">{l.symbols.length}</span>
          </button>
        ))}
        <button className="wl-plus" title="New watchlist" onClick={onCreate}><Plus size={14} /></button>
        <span className="spacer" />
        {active && <>
          <button className="icon-btn" title="Rename this list" onClick={() => onRename(active)}><Pencil size={14} /></button>
          <button className="icon-btn" title="Delete this list" disabled={lists.length <= 1} onClick={() => onDelete(active)}><Trash2 size={14} /></button>
        </>}
      </div>
      <div className="wl-add">
        <input placeholder={`Add a symbol to ${active?.name ?? 'this list'} (e.g. AMZN) and press Enter`} value={text} onChange={(e) => setText(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn small" disabled={!text.trim()} onClick={add}>Add</button>
      </div>
      <div className="pane-body">
        {symbols.length === 0 && <div className="pad muted">This list is empty. Add a symbol above, or use the star next to the chart title.</div>}
        {symbols.length > 0 && (
          <table className="grid">
            <thead><tr><th>Symbol</th><th style={{ textAlign: 'right' }}>Last</th><th style={{ textAlign: 'right' }}>Change</th><th style={{ textAlign: 'right' }}>%</th><th></th></tr></thead>
            <tbody>
              {symbols.map((s) => {
                const r = q[s]
                const cls = r?.change != null ? (r.change >= 0 ? 'up' : 'down') : ''
                return (
                  <tr key={s} className={'wl-row' + (s === selected ? ' sel' : '')} onClick={() => onSelect(s)}>
                    <td><b>{s}</b></td>
                    <td style={{ textAlign: 'right' }}>{r?.price != null ? money(r.price) : '—'}</td>
                    <td className={cls} style={{ textAlign: 'right' }}>{r?.change != null ? r.change.toFixed(2) : '—'}</td>
                    <td className={cls} style={{ textAlign: 'right' }}>{r?.pct != null ? pct(r.pct) : '—'}</td>
                    <td><button className="icon-btn" title={`Remove ${s} from ${active!.name}`} onClick={(e) => { e.stopPropagation(); onRemoveSymbol(active!.id, s) }}><X size={14} /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
