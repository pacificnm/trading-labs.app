import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { KNOWN_SYMBOLS } from '../data/placeholder'

export default function SymbolSearch({ onSelect, live }: { onSelect: (symbol: string) => void; live: boolean }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  const q = text.trim().toUpperCase()
  const [remote, setRemote] = useState<[string, string][]>([])
  useEffect(() => {
    if (!live || !q) { setRemote([]); return }
    const t = setTimeout(async () => {
      const r = await window.api.fmp.search(q)
      if (r.ok) setRemote(r.data.map((h) => [h.symbol, `${h.name}${h.exchange ? ` · ${h.exchange}` : ''}`]))
    }, 250)
    return () => clearTimeout(t)
  }, [q, live])
  const results = useMemo(() => {
    if (!q) return []
    if (live && remote.length) return remote
    const hits = KNOWN_SYMBOLS.filter(([s, n]) => s.startsWith(q) || n.toUpperCase().includes(q)).slice(0, 8)
    // any typed ticker is allowed; the data feed will validate it later
    return hits.some(([s]) => s === q) ? hits : [...hits, [q, 'Go to symbol'] as [string, string]]
  }, [q, live, remote])

  useEffect(() => {
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])

  const pick = (symbol: string) => { onSelect(symbol); setText(''); setOpen(false); setIdx(0) }

  return (
    <div className="search-box" ref={box}>
      <Search size={14} strokeWidth={1.5} />
      <input
        placeholder="Search symbol…"
        value={text}
        spellCheck={false}
        onChange={(e) => { setText(e.target.value); setOpen(true); setIdx(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(Math.min(idx + 1, results.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(Math.max(idx - 1, 0)) }
          else if (e.key === 'Enter' && results[idx]) pick(results[idx][0])
          else if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur() }
        }}
      />
      {open && results.length > 0 && (
        <div className="dropdown search-results">
          {results.map(([s, n], i) => (
            <button key={s} className={i === idx ? 'checked' : ''} onMouseEnter={() => setIdx(i)} onClick={() => pick(s)}>
              <b>{s}</b><span className="hint">{n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
