import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Ruler, Search, Target } from 'lucide-react'
import PatternChart from './PatternChart'
import { CANDLE_PATTERNS, RARITY_NOTE, findPattern, type Bias, type CandlePattern } from '../../../shared/candlePatterns'
import { loadCandles } from '../data/fmp'
import { toast } from '../toast'

const BIASES: ('all' | Bias)[] = ['all', 'bullish', 'bearish', 'neutral']
const GROUPS: CandlePattern['group'][] = ['Single candle', 'Two candles', 'Three candles', 'Four or five candles']
const RARITY_CLASS = { common: 'closed', uncommon: 'open', rare: 'idea', 'very rare': 'note' } as const

type Measured = { symbol: string; bars: number; counts: Record<string, number> }
const seen = (m: Measured | null, p: CandlePattern) => (m ? m.counts[p.id] ?? 0 : null)
const oneIn = (m: Measured, n: number) => (n === 0 ? 'none in this window' : `about 1 in ${Math.round(m.bars / n)} bars`)
const badge = (b: Bias) => (b === 'bullish' ? 'closed' : b === 'bearish' ? 'down' : 'note')

function Detail({ p, symbol, measured, onBack, onAskClaude }: { p: CandlePattern; symbol: string; measured: Measured | null; onBack: () => void; onAskClaude: (t: string) => void }) {
  const show = () => onAskClaude(`Show me real examples of the "${p.name}" candlestick pattern (id ${p.id}) on the ${symbol} chart. Use find_candle_pattern to find them (it marks them on the chart), then use get_candles around the best one to explain what each candle did and what price did afterwards. If the pattern is not present in the loaded bars, say so and suggest a longer range or another symbol instead of forcing an example.`)
  const teach = () => onAskClaude(`Teach me the "${p.name}" candlestick pattern (id ${p.id}). Start from what it means about buyers and sellers, show one real example from the ${symbol} chart with find_candle_pattern, then ask me one question to check I understood. Be honest about how often it fails.`)
  return (
    <div className="pat-detail">
      <button className="btn small" onClick={onBack}><ArrowLeft size={12} /> All patterns</button>
      <div className="pat-top">
        <div className="pat-big"><PatternChart bars={p.example} size={p.size} big /></div>
        <div className="pat-info">
          <h3 className="pat-h">{p.name}</h3>
          <div className="st-meta"><span className={'jr-badge ' + badge(p.bias)}>{p.bias}</span><span className={'jr-badge ' + RARITY_CLASS[p.rarity]} title={RARITY_NOTE[p.rarity]}>{p.rarity}</span><span className="muted">{p.group} · {p.context}</span></div>
          <p className="st-sum">{p.summary}</p>
          <div className="st-actions"><button className="btn primary" onClick={show}><Target size={13} /> Claude, show me on {symbol}</button><button className="btn" onClick={teach}><BookOpen size={13} /> Teach me this</button></div>
        </div>
      </div>
      <section className="jr-sec"><h4>How often you will see it</h4><p className="pat-p">{RARITY_NOTE[p.rarity]} <span className="muted">(a rough guide, mostly worked out from simulated prices, and it varies by stock and time frame. Use <b>Measure</b> on the gallery for real counts.)</span></p>{measured && <p className="pat-p pat-meas">On {measured.symbol}, 5 years of daily bars: <b>{seen(measured, p)}</b> time{seen(measured, p) === 1 ? '' : 's'} in {measured.bars} bars ({oneIn(measured, seen(measured, p) ?? 0)}).</p>}</section>
      <section className="jr-sec"><h4>How to spot it</h4><ul className="pat-rules">{p.rules.map((r) => <li key={r}>{r}</li>)}</ul></section>
      <section className="jr-sec"><h4>What it says</h4><p className="pat-p">{p.story}</p></section>
      <section className="jr-sec"><h4>Confirmation</h4><p className="pat-p">{p.confirm}</p></section>
      <section className="jr-sec"><h4>Watch out</h4><p className="pat-p">{p.caution}</p></section>
    </div>
  )
}

export default function CandlePatterns({ symbol, onAskClaude }: { symbol: string; onAskClaude: (t: string) => void }) {
  const [bias, setBias] = useState<'all' | Bias>('all')
  const [sel, setSel] = useState<string | null>(null)
  const [measured, setMeasured] = useState<Measured | null>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const top = useRef<HTMLDivElement>(null)
  useEffect(() => { if (sel) top.current?.scrollIntoView({ block: 'start' }) }, [sel])
  const measure = async () => {
    setBusy(true)
    try {
      const c = await loadCandles(symbol, '5Y', '1day')
      setMeasured({ symbol, bars: c.length, counts: Object.fromEntries(CANDLE_PATTERNS.map((p) => [p.id, findPattern(p.id, c).length])) })
    } catch (e) { toast.error(`Could not load ${symbol} prices: ${(e as Error).message}`) }
    setBusy(false)
  }
  const term = q.trim().toLowerCase()
  const cur = CANDLE_PATTERNS.find((p) => p.id === sel)
  if (cur) return <div ref={top}><Detail p={cur} symbol={symbol} measured={measured} onBack={() => setSel(null)} onAskClaude={onAskClaude} /></div>
  return (
    <div className="pat-gallery">
      <div className="jr-filters pat-filters">{BIASES.map((b) => <button key={b} className={'tk-chip' + (bias === b ? ' on' : '')} onClick={() => setBias(b)}>{b === 'all' ? 'All patterns' : b}</button>)}
        <label className="pat-search"><Search size={12} /><input className="search" placeholder={`Search ${CANDLE_PATTERNS.length} patterns…`} value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <span className="spacer" /><button className="btn small" disabled={busy} onClick={measure} title="Counts every pattern in the last 5 years of daily bars for this symbol"><Ruler size={12} /> {busy ? 'Measuring…' : measured && measured.symbol === symbol ? `Re-measure ${symbol}` : `Measure how often on ${symbol}`}</button></div>
      {term && !CANDLE_PATTERNS.some((p) => (bias === 'all' || p.bias === bias) && `${p.name} ${p.summary} ${p.context}`.toLowerCase().includes(term)) && <p className="muted" style={{ padding: '8px 0' }}>No pattern matches “{q}”.</p>}
      {GROUPS.map((g) => {
        const items = CANDLE_PATTERNS.filter((p) => p.group === g && (bias === 'all' || p.bias === bias) && (!term || `${p.name} ${p.summary} ${p.context}`.toLowerCase().includes(term)))
        if (!items.length) return null
        return (
          <section key={g} className="jr-sec"><h4>{g}</h4>
            <div className="pat-grid">{items.map((p) => (
              <button key={p.id} className="pat-card" onClick={() => setSel(p.id)} title={p.summary}>
                <PatternChart bars={p.example} size={p.size} />
                <span className="pat-name">{p.name}</span>
                <span className="pat-tags"><span className={'jr-badge ' + badge(p.bias)}>{p.bias}</span><span className={'jr-badge ' + RARITY_CLASS[p.rarity]} title={RARITY_NOTE[p.rarity]}>{p.rarity}</span></span>
                {measured && <span className="pat-seen muted">{seen(measured, p)}× on {measured.symbol}</span>}
              </button>
            ))}</div>
          </section>
        )
      })}
    </div>
  )
}
