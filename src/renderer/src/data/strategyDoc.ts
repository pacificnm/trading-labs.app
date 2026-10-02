import type { StrategyDoc } from '../../../shared/strategies'

const FOOT = `

---
*Educational material, not investment advice. No strategy wins every time, and past behaviour of a pattern does not guarantee it will repeat. Practise on paper first and size every trade with the Position Calculator.*`

export type Built = Omit<StrategyDoc, 'source'>
export const doc = (d: Built): StrategyDoc => ({ ...d, body: d.body.trim() + FOOT, source: 'builtin' })


/**
 * A schematic drawn inside a lesson: a price path with annotated lines and labels, on a 0-100 grid (y up).
 * It is written into the markdown as a ```chartdiagram fenced block holding this JSON, and drawn by components/ChartDiagram.tsx.
 */
export interface Diagram {
  title?: string
  path: [number, number][]
  /** drawn on top of the path; the label sits at the b end */
  lines?: { a: [number, number]; b: [number, number]; label?: string; /** x of the label's right edge (default: the b end) */ lx?: number; /** put the label under the line instead of above it */ below?: boolean; style?: 'solid' | 'dashed'; tone?: 'line' | 'target' }[]
  notes?: { at: [number, number]; text: string }[]
}
export const diagram = (d: Diagram): string => '\n```chartdiagram\n' + JSON.stringify(d) + '\n```\n'
/** The same picture upside down (a bullish pattern becomes its bearish twin). `swap` renames labels, e.g. Resistance to Support. */
export const flip = (d: Diagram, title: string, swap: Record<string, string> = {}): Diagram => ({
  title,
  path: d.path.map(([x, y]) => [x, 100 - y]),
  lines: d.lines?.map((l) => ({ ...l, a: [l.a[0], 100 - l.a[1]] as [number, number], b: [l.b[0], 100 - l.b[1]] as [number, number], label: l.label ? swap[l.label] ?? l.label : l.label })),
  notes: d.notes?.map((n) => ({ at: [n.at[0], 100 - n.at[1]] as [number, number], text: swap[n.text] ?? n.text }))
})
