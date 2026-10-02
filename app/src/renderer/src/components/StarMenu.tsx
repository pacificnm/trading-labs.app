import { useEffect, useRef, useState } from 'react'
import { Check, Plus, Star } from 'lucide-react'
import type { WatchList } from '../../../shared/watchlists'

/** The star next to the chart title: choose which watchlists the current symbol belongs to. */
export default function StarMenu({ symbol, lists, onToggle, onCreate }: {
  symbol: string; lists: WatchList[]; onToggle: (listId: number, add: boolean) => void; onCreate: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  const inAny = lists.some((l) => l.symbols.includes(symbol))
  const create = () => { if (name.trim()) { onCreate(name.trim()); setName('') } }
  return (
    <div className="title-menu" ref={ref}>
      <button className={'title-btn watch-btn' + (inAny ? ' on' : '')} title={`Add ${symbol} to a watchlist`} onClick={() => setOpen(!open)}>
        <Star size={15} strokeWidth={1.5} fill={inAny ? 'currentColor' : 'none'} />
      </button>
      {open && (
        <div className="dropdown star-menu">
          <div className="star-head">Add <b>{symbol}</b> to…</div>
          {lists.map((l) => {
            const on = l.symbols.includes(symbol)
            return (
              <button key={l.id} onClick={() => onToggle(l.id, !on)}>
                <span className="item"><span className={'star-check' + (on ? ' on' : '')}>{on && <Check size={12} />}</span> {l.name}</span>
                <span className="hint">{l.symbols.length}</span>
              </button>
            )
          })}
          <hr />
          <div className="star-new">
            <Plus size={13} />
            <input value={name} placeholder="New watchlist…" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') create() }} />
            <button className="btn small" disabled={!name.trim()} onClick={create}>Create</button>
          </div>
        </div>
      )}
    </div>
  )
}
