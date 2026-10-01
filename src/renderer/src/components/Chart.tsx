import { useEffect, useRef } from 'react'
import {
  createChart, ColorType, CrosshairMode, PriceScaleMode, LineStyle, LineType,
  CandlestickSeries, BarSeries, LineSeries, AreaSeries, HistogramSeries,
  type IChartApi, type ISeriesApi, type SeriesType, type UTCTimestamp
} from 'lightweight-charts'
import type { ChartSettings } from '../chart/settings'
import { studyById } from '../chart/studies'
import { heikinAshi, type Candle } from '../chart/indicators'
import { CloudPrimitive, DrawingsPrimitive } from '../chart/primitives'
import { chartBridge } from '../chart/bridge'
import { chartFormatters } from '../display'
import { copyIndex, lineColor, recolour } from '../chart/colors'
import { DRAWING_COLORS, type Drawing, type DrawingPoint, type OrderLine, type Tool } from '../chart/drawings'

interface Props {
  candles: Candle[]
  intraday: boolean
  tz: string
  hour12: boolean
  settings: ChartSettings
  tool: Tool
  onToolChange: (t: Tool) => void
  drawings: Drawing[]
  onDrawingsChange: (d: Drawing[]) => void
  orderLines: OrderLine[]
  onOrderLineMove: (id: string, price: number) => void
}

export default function Chart({ candles, intraday, tz, hour12, settings, tool, onToolChange, drawings, onDrawingsChange, orderLines, onOrderLineMove }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const live = useRef({ tool, onToolChange, drawings, onDrawingsChange, orderLines, onOrderLineMove })
  live.current = { tool, onToolChange, drawings, onDrawingsChange, orderLines, onOrderLineMove }
  const api = useRef<{ chart: IChartApi; prim: DrawingsPrimitive } | null>(null)

  useEffect(() => {
    const s = settings
    const fmt = chartFormatters(intraday, tz, hour12)
    const chart = createChart(el.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#1e1e1e' }, textColor: '#cccccc', panes: { separatorColor: '#3c3c3c' } },
      grid: { vertLines: { visible: s.grid, color: '#2a2a2a' }, horzLines: { visible: s.grid, color: '#2a2a2a' } },
      crosshair: { mode: s.crosshair === 'magnet' ? CrosshairMode.Magnet : CrosshairMode.Normal },
      rightPriceScale: { mode: s.scale === 'log' ? PriceScaleMode.Logarithmic : s.scale === 'percent' ? PriceScaleMode.Percentage : PriceScaleMode.Normal },
      localization: { timeFormatter: fmt.crosshair },
      timeScale: { borderColor: '#3c3c3c', timeVisible: intraday, secondsVisible: false, tickMarkFormatter: fmt.tick }
    })

    const t = (k: Candle) => k.time as UTCTimestamp
    const up = s.upColor, down = s.downColor
    const candleOpts = { upColor: up, downColor: down, wickUpColor: up, wickDownColor: down, borderVisible: false }
    let main: ISeriesApi<SeriesType>
    if (s.type === 'line') {
      main = chart.addSeries(LineSeries, { color: '#2196f3', lineWidth: 2 })
      main.setData(candles.map((k) => ({ time: t(k), value: k.close })))
    } else if (s.type === 'area') {
      main = chart.addSeries(AreaSeries, { lineColor: '#2196f3', topColor: '#2196f366', bottomColor: '#2196f305' })
      main.setData(candles.map((k) => ({ time: t(k), value: k.close })))
    } else if (s.type === 'bars') {
      main = chart.addSeries(BarSeries, { upColor: up, downColor: down })
      main.setData(candles.map((k) => ({ time: t(k), open: k.open, high: k.high, low: k.low, close: k.close })))
    } else {
      const data = (s.type === 'heikin' ? heikinAshi(candles) : candles).map((k) => ({ time: t(k), open: k.open, high: k.high, low: k.low, close: k.close }))
      main = chart.addSeries(CandlestickSeries, s.type === 'hollow'
        ? { ...candleOpts, upColor: 'transparent', borderVisible: true, borderUpColor: up, borderDownColor: down }
        : candleOpts)
      main.setData(data)
    }

    // Studies with a positive shift (Ichimoku) plot into the future, so extend the time axis with whitespace.
    const N = candles.length
    let future = 0
    for (const inst of s.studies) {
      if (!inst.visible) continue
      const d = studyById(inst.studyId)
      const p = Object.fromEntries(d.params.map((x) => [x.key, inst.params[x.key] ?? x.default]))
      if (d.id === 'ichimoku') future = Math.max(future, p.disp)
    }
    const step = N > 1 ? candles[N - 1].time - candles[N - 2].time : 86400
    const times = [...candles.map((k) => k.time), ...Array.from({ length: future }, (_, i) => candles[N - 1].time + (i + 1) * step)]

    let pane = 0
    for (const inst of s.studies) {
      if (!inst.visible) continue
      const def = studyById(inst.studyId)
      const params = Object.fromEntries(def.params.map((p) => [p.key, inst.params[p.key] ?? p.default]))
      const paneIndex = def.pane === 'overlay' ? 0 : ++pane
      const label = def.params.length ? `${def.id.toUpperCase()} ${def.params.map((p) => params[p.key]).join(' ')}` : def.id.toUpperCase()
      let first = true
      const byName = new Map<string, { series: ISeriesApi<SeriesType>; points: { time: number; value: number | null }[] }>()
      const copy = copyIndex(s.studies, inst.uid)
      let outIdx = 0
      for (const out of def.compute(candles, params)) {
        const color = lineColor(out, inst, copy, outIdx++)
        const barColors = recolour(out, inst)
        const shift = out.shift ?? 0
        const points = times.map((time, j) => {
          const src = j - shift
          const v = src >= 0 && src < N ? out.values[src] : null
          return v == null ? { time: time as UTCTimestamp } : { time: time as UTCTimestamp, value: v, ...(barColors ? { color: barColors[src] } : {}) }
        })
        const common = { lastValueVisible: def.pane === 'separate', priceLineVisible: false, title: first ? label : '' }
        let series: ISeriesApi<SeriesType>
        if (out.kind === 'histogram') {
          series = chart.addSeries(HistogramSeries, { ...common, color, ...(def.id === 'volume' ? { priceFormat: { type: 'volume' as const } } : {}) }, paneIndex)
        } else if (out.kind === 'dots') {
          series = chart.addSeries(LineSeries, { ...common, color, lineVisible: false, pointMarkersVisible: true, pointMarkersRadius: 1.5, crosshairMarkerVisible: false }, paneIndex)
        } else {
          series = chart.addSeries(LineSeries, { ...common, color, lineWidth: 1, crosshairMarkerVisible: false, ...(out.steps ? { lineType: LineType.WithSteps } : {}), ...(def.id === 'obv' ? { priceFormat: { type: 'volume' as const } } : {}) }, paneIndex)
        }
        series.setData(points as never)
        byName.set(out.name, { series, points: points.map((p) => ({ time: p.time as number, value: 'value' in p ? (p.value as number) : null })) })
        if (first && def.levels) for (const price of def.levels) series.createPriceLine({ price, color: '#555555', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false })
        first = false
      }
      if (def.cloud) {
        const a = byName.get(def.cloud.upper), b = byName.get(def.cloud.lower)
        if (a && b) a.series.attachPrimitive(new CloudPrimitive(a.points, b.points, def.cloud.upColor, def.cloud.downColor))
      }
    }

    const panes = chart.panes()
    panes.forEach((p, i) => p.setStretchFactor(i === 0 ? 4 : 1))
    chart.timeScale().fitContent()

    // ---- drawing tools ----
    const prim = new DrawingsPrimitive()
    prim.setTimes(candles.map((k) => k.time))
    main.attachPrimitive(prim)
    api.current = { chart, prim }
    const container = el.current!
    const lock = (on: boolean) => chart.applyOptions({ handleScroll: !on, handleScale: !on })
    const local = (e: MouseEvent) => { const r = container.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const inPane = (x: number, y: number) => x >= 0 && x <= chart.timeScale().width() && y >= 0 && y <= chart.panes()[0].getHeight()
    const toPoint = (x: number, y: number): DrawingPoint | null => {
      const logical = chart.timeScale().coordinateToLogical(x)
      const price = main.coordinateToPrice(y)
      if (logical == null || price == null) return null
      // fractional bar index -> time, extrapolating past either end of the data
      const i = Math.max(0, Math.min(N - 2, Math.floor(logical)))
      return { time: candles[i].time + (logical - i) * (candles[i + 1].time - candles[i].time), price }
    }
    const commit = (list: Drawing[]) => { prim.drawings = list; live.current.onDrawingsChange(list) }

    type Drag = { id: string; part: 'p1' | 'p2' | 'body'; start: { x: number; y: number }; orig: Drawing; moved: boolean }
    let drag: Drag | null = null
    let lineDrag: { id: string; price: number } | null = null
    const snapPrice = (p: number) => Math.round(p * 100) / 100
    let downAt: { x: number; y: number } | null = null

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const { x, y } = local(e)
      if (!inPane(x, y)) return
      const tl = live.current.tool
      if (tl === 'cursor') {
        const ol = prim.pickOrderLine(x, y)
        if (ol) { e.stopPropagation(); lock(true); lineDrag = { id: ol.id, price: ol.price }; return }
        const hit = prim.pick(x, y)
        prim.selectedId = hit?.id ?? null
        prim.refresh()
        if (hit) {
          e.stopPropagation()
          lock(true)
          drag = { id: hit.id, part: hit.part, start: { x, y }, orig: prim.drawings.find((d) => d.id === hit.id)!, moved: false }
        }
        return
      }
      const pt = toPoint(x, y)
      if (!pt) return
      e.stopPropagation()
      if (tl === 'hline') {
        commit([...prim.drawings, { id: crypto.randomUUID(), type: 'hline', p1: pt, p2: pt, color: DRAWING_COLORS.hline }])
        live.current.onToolChange('cursor')
      } else if (!prim.draft) {
        prim.draft = { id: crypto.randomUUID(), type: tl, p1: pt, p2: pt, color: DRAWING_COLORS[tl] }
        downAt = { x, y }
        prim.refresh()
      } else {
        finish(pt)
      }
    }
    const finish = (pt: DrawingPoint) => {
      const d = prim.draft!
      prim.draft = null
      downAt = null
      if (d.p1.time === pt.time && d.p1.price === pt.price) { prim.refresh(); return }
      commit([...prim.drawings, { ...d, p2: pt }])
      live.current.onToolChange('cursor')
    }
    const onMove = (e: MouseEvent) => {
      const { x, y } = local(e)
      if (lineDrag) {
        const p = main.coordinateToPrice(y)
        if (p != null) {
          lineDrag.price = snapPrice(p)
          prim.orderLines = live.current.orderLines.map((l) => (l.id === lineDrag!.id ? { ...l, price: lineDrag!.price } : l))
          prim.refresh()
        }
        return
      }
      if (drag) {
        const g = prim.geo(drag.orig)
        const upd = (part: 'p1' | 'p2', px: number, py: number) => toPoint(px, py)
        if (g) {
          const dx = x - drag.start.x, dy = y - drag.start.y
          let next = drag.orig
          if (drag.part === 'body') {
            const a = upd('p1', g.x1 + dx, g.y1 + dy), b = upd('p2', g.x2 + dx, g.y2 + dy)
            if (a && b) next = { ...drag.orig, p1: a, p2: b }
          } else {
            const pt = toPoint(x, y)
            if (pt) next = { ...drag.orig, [drag.part]: pt }
          }
          drag.moved = true
          prim.drawings = prim.drawings.map((d) => (d.id === drag!.id ? next : d))
          prim.refresh()
        }
        return
      }
      if (prim.draft && inPane(x, y)) {
        const pt = toPoint(x, y)
        if (pt) { prim.draft = { ...prim.draft, p2: pt }; prim.refresh() }
      }
      container.style.cursor = live.current.tool !== 'cursor' ? 'crosshair' : inPane(x, y) && prim.pickOrderLine(x, y) ? 'ns-resize' : inPane(x, y) && prim.pick(x, y) ? 'pointer' : ''
    }
    const onUp = (e: MouseEvent) => {
      if (lineDrag) {
        const { id, price } = lineDrag
        lineDrag = null
        lock(live.current.tool !== 'cursor')
        live.current.onOrderLineMove(id, price)
        return
      }
      if (drag) {
        if (drag.moved) commit([...prim.drawings])
        drag = null
        lock(live.current.tool !== 'cursor')
        return
      }
      // click-drag drawing: releasing far from the start finishes the shape
      if (prim.draft && downAt) {
        const { x, y } = local(e)
        if (Math.hypot(x - downAt.x, y - downAt.y) > 8) { const pt = toPoint(x, y); if (pt) finish(pt) }
        downAt = null
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Escape') { prim.draft = null; prim.selectedId = null; prim.refresh(); live.current.onToolChange('cursor') }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && prim.selectedId) {
        commit(prim.drawings.filter((d) => d.id !== prim.selectedId))
        prim.selectedId = null
      }
    }
    container.addEventListener('mousedown', onDown, true)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('keydown', onKey)
    lock(live.current.tool !== 'cursor')

    const shot = (): string | null => {
      const src = chart.takeScreenshot()
      const scale = Math.min(1, 1200 / src.width)
      const out = document.createElement('canvas')
      out.width = Math.round(src.width * scale); out.height = Math.round(src.height * scale)
      out.getContext('2d')!.drawImage(src, 0, 0, out.width, out.height)
      return out.toDataURL('image/png').split(',')[1]
    }
    chartBridge.screenshot = shot

    return () => {
      if (chartBridge.screenshot === shot) chartBridge.screenshot = null
      container.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('keydown', onKey)
      api.current = null
      chart.remove()
    }
  }, [candles, settings, intraday, tz, hour12])

  // Push external state (drawings from the DB, tool changes) into the live chart.
  useEffect(() => {
    const a = api.current
    if (!a) return
    a.prim.drawings = drawings
    a.prim.orderLines = orderLines
    a.prim.refresh()
  }, [drawings, orderLines, candles, settings])

  useEffect(() => {
    const a = api.current
    if (!a) return
    a.chart.applyOptions({ handleScroll: tool === 'cursor', handleScale: tool === 'cursor' })
    if (tool === 'cursor') a.prim.draft = null
    a.prim.refresh()
  }, [tool])

  return <div ref={el} style={{ width: '100%', height: '100%' }} />
}
