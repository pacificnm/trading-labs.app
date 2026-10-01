import type { Sketch } from '../../../shared/candlePatterns'

const UP = '#26a69a', DOWN = '#ef5350'

// Draws a pattern example. Bars before the last `size` are context (dimmed); the pattern itself is highlighted and,
// in the large view, numbered.
export default function PatternChart({ bars, size, big = false }: { bars: Sketch[]; size: number; big?: boolean }) {
  const n = bars.length
  const W = big ? 360 : 120, H = big ? 220 : 80, padX = big ? 18 : 8, padT = big ? 12 : 6, padB = big ? 26 : 6
  let lo = Infinity, hi = -Infinity
  for (const b of bars) { lo = Math.min(lo, b[2]); hi = Math.max(hi, b[1]) }
  const y = (v: number) => padT + ((hi - v) / (hi - lo || 1)) * (H - padT - padB)
  const slot = (W - padX * 2) / n, cw = Math.min(big ? 30 : 12, slot * 0.62)
  const x = (i: number) => padX + slot * (i + 0.5)
  const first = n - size
  return (
    <svg className={'pat-chart' + (big ? ' big' : '')} viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden>
      <rect x={padX + slot * first} y={0} width={slot * size} height={H} className="pat-hl" />
      {bars.map((b, i) => {
        const col = b[3] >= b[0] ? UP : DOWN, inPat = i >= first
        const top = y(Math.max(b[0], b[3])), h = Math.max(1.5, Math.abs(y(b[0]) - y(b[3])))
        return (
          <g key={i} opacity={inPat ? 1 : 0.4}>
            <line x1={x(i)} x2={x(i)} y1={y(b[1])} y2={y(b[2])} stroke={col} strokeWidth={big ? 2 : 1.4} strokeLinecap="round" />
            <rect x={x(i) - cw / 2} y={top} width={cw} height={h} rx={1.5} fill={col} />
            {big && inPat && size > 1 && <text x={x(i)} y={H - 8} textAnchor="middle" className="pat-num">{i - first + 1}</text>}
          </g>
        )
      })}
    </svg>
  )
}
