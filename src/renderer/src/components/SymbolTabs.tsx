import { CandlestickChart, Newspaper, Gauge, FileText, Landmark, Sigma } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SymbolView = 'chart' | 'news' | 'quote' | 'analyst' | 'fundamentals' | 'options'

const TABS: { id: SymbolView; Icon: LucideIcon; label: string }[] = [
  { id: 'chart', Icon: CandlestickChart, label: 'Chart' },
  { id: 'news', Icon: Newspaper, label: 'News' },
  { id: 'quote', Icon: Gauge, label: 'Quote Details' },
  { id: 'analyst', Icon: FileText, label: 'Analyst Reports' },
  { id: 'fundamentals', Icon: Landmark, label: 'Fundamentals' },
  { id: 'options', Icon: Sigma, label: 'Option Stats' }
]

export const SYMBOL_VIEWS = TABS.map((t) => t.id) as string[]

/** Launcher icons shared by every per-symbol screen's header. */
export default function SymbolTabs({ view, onNavigate }: { view: SymbolView; onNavigate: (v: SymbolView) => void }) {
  return (
    <div className="symbol-tabs">
      {TABS.map(({ id, Icon, label }) => (
        <button key={id} title={label} className={'title-btn' + (view === id ? ' active' : '')} onClick={() => onNavigate(id)}>
          <Icon size={15} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}
