import type { Diagram } from '../data/strategyDoc'

const W = 200, H = 110
const sx = (x: number) => 10 + x * 1.8
const sy = (y: number) => 98 - y * 0.9

/** Draws a ```chartdiagram block from a lesson. Bad JSON shows a muted note instead of breaking the page. */
export default function ChartDiagram({ source }: { source: string }) {
  let d: Diagram
  try { d = JSON.parse(source) as Diagram; if (!Array.isArray(d.path) || d.path.length < 2) throw new Error('no path') }
  catch { return <div className="muted cdiagram-err">(This diagram could not be drawn.)</div> }
  return (
    <figure className="cdiagram">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={d.title ?? 'Chart pattern diagram'}>
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} className="cd-frame" />
        {d.title && <text x="6" y="9" className="cd-title">{d.title}</text>}
        {d.lines?.map((l, i) => (
          <g key={i} className={'cd-line ' + (l.tone ?? 'line')}>
            <line x1={sx(l.a[0])} y1={sy(l.a[1])} x2={sx(l.b[0])} y2={sy(l.b[1])} strokeDasharray={l.style === 'dashed' ? '3 2' : undefined} />
            {l.label && <text x={sx(l.lx ?? l.b[0])} y={sy(l.lx != null ? l.a[1] + (l.b[1] - l.a[1]) * ((l.lx - l.a[0]) / (l.b[0] - l.a[0])) : l.b[1]) + (l.below ? 6 : -2)} textAnchor="end" className="cd-label">{l.label}</text>}
          </g>
        ))}
        <polyline className="cd-price" points={d.path.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} />
        {d.notes?.map((n, i) => <text key={i} x={sx(n.at[0])} y={sy(n.at[1])} textAnchor="middle" className="cd-note">{n.text}</text>)}
      </svg>
    </figure>
  )
}
