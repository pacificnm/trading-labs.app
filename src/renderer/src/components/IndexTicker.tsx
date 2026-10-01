import { useEffect, useState } from 'react'
import { INDEX_QUOTES, type IndexQuote } from '../data/placeholder'
import { pick, pickStr } from '../data/fmp'

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const INDEX_SYMBOLS = INDEX_QUOTES.map((q) => q.symbol)

export default function IndexTicker({ onSelect, live }: { onSelect: (symbol: string) => void; live: boolean }) {
  const [quotes, setQuotes] = useState<IndexQuote[]>(INDEX_QUOTES)
  useEffect(() => {
    if (!live) { setQuotes(INDEX_QUOTES); return }
    const load = async () => {
      const r = await window.api.fmp.quotes(INDEX_SYMBOLS)
      if (!r.ok || r.data.length === 0) return
      const names = Object.fromEntries(INDEX_QUOTES.map((q) => [q.symbol, q.name]))
      setQuotes(r.data.map((q) => {
        const symbol = pickStr(q, 'symbol')
        return { symbol, name: names[symbol] ?? pickStr(q, 'name') ?? symbol, price: pick(q, 'price') ?? 0, change: pick(q, 'change') ?? 0, pct: pick(q, 'changePercentage', 'changesPercentage') ?? 0 }
      }))
    }
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [live])
  const items = quotes.map((q) => (
    <button key={q.symbol} className="tick" onClick={() => onSelect(q.symbol)} title={q.symbol}>
      <span className="tick-name">{q.name}</span>
      <span>{fmt(q.price)}</span>
      <span className={q.change >= 0 ? 'up' : 'down'}>
        {q.change >= 0 ? '▲' : '▼'} {fmt(Math.abs(q.change))} ({q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}%)
      </span>
    </button>
  ))
  // The list is rendered twice and translated by -50% for a seamless loop.
  return (
    <div className="marquee">
      <div className="marquee-track">{items}{items.map((el) => ({ ...el, key: el.key + '-dup' }))}</div>
    </div>
  )
}
