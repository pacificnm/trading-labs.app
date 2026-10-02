export type DrawingType = 'trend' | 'ray' | 'hline' | 'fib' | 'rect' | 'marker'
export type Tool = 'cursor' | DrawingType

export interface DrawingPoint { time: number; price: number }
export interface Drawing {
  id: string
  type: DrawingType
  p1: DrawingPoint
  p2: DrawingPoint
  color: string
  /** short text shown next to the drawing */
  label?: string
  /** who created it; Claude's drawings can be cleared separately */
  by?: 'user' | 'claude'
  /** marker only: which way the arrow points ('down' = sits above the bar) */
  direction?: 'up' | 'down'
}

export const DRAWING_COLORS: Record<DrawingType, string> = {
  trend: '#2196f3', ray: '#2196f3', hline: '#ffb300', fib: '#ab47bc', rect: '#42a5f5', marker: '#ffd54f'
}

export const FIB_LEVELS: { level: number; color: string }[] = [
  { level: 0, color: '#9e9e9e' },
  { level: 0.236, color: '#ef5350' },
  { level: 0.382, color: '#ff9800' },
  { level: 0.5, color: '#4caf50' },
  { level: 0.618, color: '#26a69a' },
  { level: 0.786, color: '#00bcd4' },
  { level: 1, color: '#9e9e9e' }
]

/** A horizontal price line for an order ticket draft, a working order or an open position. */
export interface OrderLine {
  id: string
  price: number
  label: string
  color: string
  style: 'draft' | 'working' | 'position'
  draggable: boolean
}
