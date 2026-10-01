import type { IChartApi, ISeriesApi, ISeriesPrimitive, SeriesAttachedParameter, SeriesType, Time } from 'lightweight-charts'
import { FIB_LEVELS, type Drawing, type DrawingPoint, type OrderLine } from './drawings'

type Target = {
  useMediaCoordinateSpace: <T>(cb: (s: { context: CanvasRenderingContext2D; mediaSize: { width: number; height: number } }) => T) => T
}

abstract class BasePrimitive implements ISeriesPrimitive<Time> {
  protected chart!: IChartApi
  protected series!: ISeriesApi<SeriesType>
  private req?: () => void
  private view = { zOrder: () => this.zOrder, renderer: () => ({ draw: (t: Target) => this.draw(t) }) }
  protected zOrder: 'bottom' | 'normal' | 'top' = 'normal'
  attached(p: SeriesAttachedParameter<Time>): void { this.chart = p.chart; this.series = p.series; this.req = p.requestUpdate }
  detached(): void { this.req = undefined }
  paneViews() { return [this.view as never] }
  refresh(): void { this.req?.() }
  /** Candle times of the main series; drawings interpolate between them so they survive interval changes. */
  protected times: number[] = []
  setTimes(times: number[]): void { this.times = times }
  protected x(time: number): number | null {
    const t = this.times
    if (t.length < 2) return this.chart.timeScale().timeToCoordinate(time as Time)
    let lo = 0, hi = t.length - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t[m] <= time) lo = m; else hi = m }
    // beyond either end, extrapolate with the edge bar spacing
    const a = time > t[hi] ? hi - 1 : time < t[lo] ? 0 : lo
    const b = a + 1
    return this.chart.timeScale().logicalToCoordinate((a + (time - t[a]) / (t[b] - t[a])) as never)
  }
  protected y(price: number): number | null { return this.series.priceToCoordinate(price) }
  protected abstract draw(t: Target): void
}

export interface CloudPoint { time: number; value: number | null }

/** Fills the area between two line series (Ichimoku cloud). Attach to the upper series. */
export class CloudPrimitive extends BasePrimitive {
  constructor(private a: CloudPoint[], private b: CloudPoint[], private upColor: string, private downColor: string) {
    super()
    this.zOrder = 'bottom'
  }
  protected draw(t: Target): void {
    t.useMediaCoordinateSpace(({ context: ctx }) => {
      for (let i = 0; i < this.a.length - 1; i++) {
        const a0 = this.a[i], a1 = this.a[i + 1], b0 = this.b[i], b1 = this.b[i + 1]
        if (a0.value == null || a1.value == null || b0.value == null || b1.value == null) continue
        const x0 = this.x(a0.time), x1 = this.x(a1.time)
        const ya0 = this.y(a0.value), ya1 = this.y(a1.value), yb0 = this.y(b0.value), yb1 = this.y(b1.value)
        if (x0 == null || x1 == null || ya0 == null || ya1 == null || yb0 == null || yb1 == null) continue
        ctx.fillStyle = a0.value + a1.value >= b0.value + b1.value ? this.upColor : this.downColor
        ctx.beginPath()
        ctx.moveTo(x0, ya0); ctx.lineTo(x1, ya1); ctx.lineTo(x1, yb1); ctx.lineTo(x0, yb0)
        ctx.closePath()
        ctx.fill()
      }
    })
  }
}

export type HitPart = 'p1' | 'p2' | 'body'
export interface Hit { id: string; part: HitPart }
interface Geo { x1: number; y1: number; x2: number; y2: number }

const HANDLE_R = 5
const TOL = 6

function distToSegment(px: number, py: number, g: Geo, ray: boolean): number {
  let { x1, y1, x2, y2 } = g
  if (ray) { const d = Math.hypot(x2 - x1, y2 - y1) || 1; x2 = x1 + ((x2 - x1) / d) * 1e5; y2 = y1 + ((y2 - y1) / d) * 1e5 }
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** Renders and hit-tests user drawings (trendlines, rays, horizontal lines, Fibonacci, rectangles). */
export class DrawingsPrimitive extends BasePrimitive {
  drawings: Drawing[] = []
  selectedId: string | null = null
  draft: Drawing | null = null
  orderLines: OrderLine[] = []
  constructor() { super(); this.zOrder = 'top' }

  /** The draggable order line under (px, py), if any. */
  pickOrderLine(px: number, py: number): OrderLine | null {
    for (const l of this.orderLines) {
      if (!l.draggable) continue
      const y = this.y(l.price)
      if (y != null && Math.abs(py - y) <= 5 && px >= 0 && px <= this.paneWidth()) return l
    }
    return null
  }

  private paneWidth(): number { return this.chart.timeScale().width() }

  geo(d: Drawing): Geo | null {
    const y1 = this.y(d.p1.price), y2 = this.y(d.p2.price)
    if (y1 == null || y2 == null) return null
    if (d.type === 'hline') return { x1: 0, y1, x2: this.paneWidth(), y2: y1 }
    if (d.type === 'marker') { const x = this.x(d.p1.time); return x == null ? null : { x1: x, y1, x2: x, y2: y1 } }
    const x1 = this.x(d.p1.time), x2 = this.x(d.p2.time)
    return x1 == null || x2 == null ? null : { x1, y1, x2, y2 }
  }

  private fibLines(d: Drawing, g: Geo) {
    return FIB_LEVELS.map((f) => {
      const price = d.p2.price + (d.p1.price - d.p2.price) * f.level
      return { ...f, price, y: this.y(price) }
    }).filter((l): l is typeof l & { y: number } => l.y != null)
  }

  pick(px: number, py: number): Hit | null {
    const all = [...this.drawings].reverse()
    // handles of the selected drawing win over everything else
    const sel = all.find((d) => d.id === this.selectedId)
    if (sel && sel.type !== 'hline' && sel.type !== 'marker') {
      const g = this.geo(sel)
      if (g) {
        if (Math.hypot(px - g.x1, py - g.y1) <= HANDLE_R + 3) return { id: sel.id, part: 'p1' }
        if (Math.hypot(px - g.x2, py - g.y2) <= HANDLE_R + 3) return { id: sel.id, part: 'p2' }
      }
    }
    for (const d of all) {
      const g = this.geo(d)
      if (!g) continue
      let hit = false
      if (d.type === 'trend' || d.type === 'ray') hit = distToSegment(px, py, g, d.type === 'ray') <= TOL
      else if (d.type === 'hline') hit = Math.abs(py - g.y1) <= TOL
      else if (d.type === 'marker') hit = Math.abs(px - g.x1) <= 40 && (d.direction === 'up' ? py >= g.y1 && py <= g.y1 + 34 : py <= g.y1 && py >= g.y1 - 34)
      else if (d.type === 'rect') hit = px >= Math.min(g.x1, g.x2) && px <= Math.max(g.x1, g.x2) && py >= Math.min(g.y1, g.y2) && py <= Math.max(g.y1, g.y2)
      else if (d.type === 'fib') {
        const xa = Math.min(g.x1, g.x2), xb = Math.max(g.x1, g.x2)
        hit = px >= xa - TOL && px <= xb + TOL && this.fibLines(d, g).some((l) => Math.abs(py - l.y) <= TOL)
      }
      if (hit) return { id: d.id, part: 'body' }
    }
    return null
  }

  protected draw(t: Target): void {
    t.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const all = this.draft ? [...this.drawings, this.draft] : this.drawings
      for (const d of all) this.drawOne(ctx, d, mediaSize.width, d.id === this.selectedId)
      for (const l of this.orderLines) this.drawOrderLine(ctx, l, mediaSize.width)
    })
  }

  private drawOrderLine(ctx: CanvasRenderingContext2D, l: OrderLine, width: number): void {
    const y = this.y(l.price)
    if (y == null) return
    ctx.save()
    ctx.strokeStyle = l.color
    ctx.lineWidth = l.style === 'position' ? 1.5 : 1.25
    ctx.setLineDash(l.style === 'draft' ? [6, 4] : l.style === 'position' ? [2, 3] : [])
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
    ctx.setLineDash([])
    ctx.font = '11px sans-serif'
    const w = ctx.measureText(l.label).width + 12
    const x = width - w - 6
    ctx.fillStyle = l.color
    ctx.beginPath(); ctx.roundRect(x, y - 9, w, 18, 3); ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.fillText(l.label, x + 6, y + 0.5)
    ctx.restore()
  }

  private drawOne(ctx: CanvasRenderingContext2D, d: Drawing, width: number, selected: boolean): void {
    const g = this.geo(d)
    if (!g) return
    ctx.save()
    ctx.strokeStyle = d.color
    ctx.fillStyle = d.color
    ctx.lineWidth = selected ? 2 : 1.5
    ctx.font = '11px sans-serif'
    const line = (xa: number, ya: number, xb: number, yb: number) => { ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke() }
    const text = (t: string, x: number, y: number, align: CanvasTextAlign = 'left') => {
      ctx.save(); ctx.textAlign = align; ctx.lineWidth = 3; ctx.strokeStyle = '#1e1e1e'; ctx.lineJoin = 'round'
      ctx.strokeText(t, x, y); ctx.fillStyle = d.color; ctx.fillText(t, x, y); ctx.restore()
    }
    const label = d.label ?? ''

    if (d.type === 'trend') { line(g.x1, g.y1, g.x2, g.y2); if (label) text(label, Math.max(g.x1, g.x2) - 4, (g.x1 > g.x2 ? g.y1 : g.y2) - 6, 'right') }
    else if (d.type === 'marker') {
      const down = d.direction !== 'up'   // 'down' arrow sits above the bar
      const tipY = g.y1 + (down ? -4 : 4), baseY = g.y1 + (down ? -14 : 14)
      ctx.beginPath(); ctx.moveTo(g.x1, tipY); ctx.lineTo(g.x1 - 6, baseY); ctx.lineTo(g.x1 + 6, baseY); ctx.closePath(); ctx.fill()
      if (label) text(label, g.x1, down ? baseY - 6 : baseY + 14, 'center')
    } else if (d.type === 'ray') {
      const dist = Math.hypot(g.x2 - g.x1, g.y2 - g.y1) || 1
      line(g.x1, g.y1, g.x1 + ((g.x2 - g.x1) / dist) * 1e4, g.y1 + ((g.y2 - g.y1) / dist) * 1e4)
      if (label) text(label, g.x2 + (g.x2 >= g.x1 ? 6 : -6), g.y2 - 6, g.x2 >= g.x1 ? 'left' : 'right')
    } else if (d.type === 'hline') {
      line(0, g.y1, width, g.y1)
      text(`${label ? label + '  ' : ''}${d.p1.price.toFixed(2)}`, 8, g.y1 - 4)
    } else if (d.type === 'rect') {
      ctx.globalAlpha = 0.12
      ctx.fillRect(Math.min(g.x1, g.x2), Math.min(g.y1, g.y2), Math.abs(g.x2 - g.x1), Math.abs(g.y2 - g.y1))
      ctx.globalAlpha = 1
      ctx.strokeRect(Math.min(g.x1, g.x2), Math.min(g.y1, g.y2), Math.abs(g.x2 - g.x1), Math.abs(g.y2 - g.y1))
      if (label) text(label, Math.min(g.x1, g.x2) + 4, Math.min(g.y1, g.y2) + 13)
    } else if (d.type === 'fib') {
      const xa = Math.min(g.x1, g.x2), xb = Math.max(g.x1, g.x2)
      const lines = this.fibLines(d, g)
      if (label && lines.length) text(label, xa + 4, Math.min(...lines.map((l) => l.y)) - 16)
      ctx.lineWidth = 1
      lines.forEach((l, i) => {
        const next = lines[i + 1]
        if (next) { ctx.globalAlpha = 0.07; ctx.fillStyle = l.color; ctx.fillRect(xa, Math.min(l.y, next.y), xb - xa, Math.abs(next.y - l.y)) }
        ctx.globalAlpha = 1
        ctx.strokeStyle = l.color; ctx.fillStyle = l.color
        line(xa, l.y, xb, l.y)
        ctx.fillText(`${l.level} (${l.price.toFixed(2)})`, xa + 4, l.y - 3)
      })
      ctx.strokeStyle = '#9e9e9e'; ctx.setLineDash([4, 4])
      line(g.x1, g.y1, g.x2, g.y2)
    }

    if (selected && d.type !== 'hline' && d.type !== 'marker') {
      ctx.setLineDash([]); ctx.fillStyle = '#1e1e1e'; ctx.strokeStyle = d.color; ctx.lineWidth = 2
      for (const [hx, hy] of [[g.x1, g.y1], [g.x2, g.y2]]) { ctx.beginPath(); ctx.arc(hx, hy, HANDLE_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke() }
    }
    ctx.restore()
  }
}

export type { DrawingPoint }
