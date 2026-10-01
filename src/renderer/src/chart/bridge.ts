import type { Candle } from './indicators'
import type { ChartSettings } from './settings'
import type { Drawing } from './drawings'
import type { Draft } from './orderDraft'
import type { CalcState } from './calcState'
import type { Rules } from '../../../shared/position'
import type { ChartSetup } from '../../../shared/strategies'
import type { TradeSnapshot } from '../../../shared/trade'

export interface ChartSnapshot {
  view: string
  symbol: string
  settings: ChartSettings
  candles: Candle[] | null
  /** true when `candles` belong to the symbol/range/interval currently selected */
  ready: boolean
  loadError: string | null
  sample: boolean
  drawings: Drawing[]
  drawingsReady: boolean
}

export interface ChartBridge {
  snapshot(): ChartSnapshot
  setSymbol(symbol: string): void
  /** applies synchronously so several tool calls in a row compose correctly */
  updateSettings(fn: (s: ChartSettings) => ChartSettings): void
  updateDrawings(fn: (d: Drawing[]) => Drawing[]): void
  navigate(view: string): void
  openJournal(id?: number): void
  /** returns anything that could not be applied */
  applyChartSetup(setup: ChartSetup, name: string, symbol?: string): string[]
  getCalc(): CalcState
  setCalc(patch: Partial<CalcState>): void
  getRules(): Rules
  activeListId(): number | null
  getTicket(): Draft | null
  setTicket(d: Draft | null): void
  trade(): TradeSnapshot | null
  lastPrice(): number | null
}

/** Lets tools (called by Claude) reach the live chart state that React owns. */
export const chartBridge: { impl: ChartBridge | null; screenshot: (() => string | null) | null } = { impl: null, screenshot: null }
