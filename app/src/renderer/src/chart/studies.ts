import * as I from './indicators'
import type { Candle, Num } from './indicators'

export interface Param { key: string; label: string; default: number; step?: number }
export interface Output {
  name: string
  kind: 'line' | 'histogram' | 'dots'
  color: string
  values: Num[]
  /** per-point colours for histograms (e.g. volume up/down) */
  colors?: string[]
  /** the two colours `colors` is made of (rising/falling), so each can be changed on its own */
  tones?: { up: string; down: string }
  /** plot offset in bars: +n draws n bars into the future, -n shifts back */
  shift?: number
  /** hold each value flat until the next one (pivot levels) */
  steps?: boolean
}
export interface StudyDef {
  id: string
  name: string
  category: 'Overlay' | 'Volume' | 'Momentum' | 'Trend' | 'Volatility'
  pane: 'overlay' | 'separate'
  params: Param[]
  /** horizontal reference lines in a separate pane */
  levels?: number[]
  /** fill between two named outputs */
  cloud?: { upper: string; lower: string; upColor: string; downColor: string }
  compute: (c: Candle[], p: Record<string, number>) => Output[]
}

const len = (d: number): Param => ({ key: 'length', label: 'Length', default: d })
const close = (c: Candle[]) => c.map((k) => k.close)

export const STUDIES: StudyDef[] = [
  { id: 'sma', name: 'Moving Average (SMA)', category: 'Overlay', pane: 'overlay', params: [len(20)],
    compute: (c, p) => [{ name: 'SMA', kind: 'line', color: '#f5a623', values: I.sma(close(c), p.length) }] },
  { id: 'ema', name: 'Exponential MA (EMA)', category: 'Overlay', pane: 'overlay', params: [len(20)],
    compute: (c, p) => [{ name: 'EMA', kind: 'line', color: '#4fc3f7', values: I.ema(close(c), p.length) }] },
  { id: 'wma', name: 'Weighted MA (WMA)', category: 'Overlay', pane: 'overlay', params: [len(20)],
    compute: (c, p) => [{ name: 'WMA', kind: 'line', color: '#ba68c8', values: I.wma(close(c), p.length) }] },
  { id: 'bb', name: 'Bollinger Bands', category: 'Volatility', pane: 'overlay', params: [len(20), { key: 'mult', label: 'StdDev', default: 2, step: 0.1 }],
    compute: (c, p) => {
      const cl = close(c), mid = I.sma(cl, p.length), sd = I.stdev(cl, p.length)
      return [
        { name: 'Upper', kind: 'line', color: '#2196f3', values: mid.map((m, i) => (m == null ? null : m + p.mult * sd[i]!)) },
        { name: 'Basis', kind: 'line', color: '#ff9800', values: mid },
        { name: 'Lower', kind: 'line', color: '#2196f3', values: mid.map((m, i) => (m == null ? null : m - p.mult * sd[i]!)) }
      ]
    } },
  { id: 'keltner', name: 'Keltner Channels', category: 'Volatility', pane: 'overlay', params: [len(20), { key: 'atrLen', label: 'ATR length', default: 10 }, { key: 'mult', label: 'Multiplier', default: 2, step: 0.1 }],
    compute: (c, p) => {
      const mid = I.ema(close(c), p.length), a = I.atr(c, p.atrLen)
      return [
        { name: 'Upper', kind: 'line', color: '#26a69a', values: mid.map((m, i) => (m == null || a[i] == null ? null : m + p.mult * a[i]!)) },
        { name: 'Basis', kind: 'line', color: '#9e9e9e', values: mid },
        { name: 'Lower', kind: 'line', color: '#26a69a', values: mid.map((m, i) => (m == null || a[i] == null ? null : m - p.mult * a[i]!)) }
      ]
    } },
  { id: 'donchian', name: 'Donchian Channels', category: 'Volatility', pane: 'overlay', params: [len(20)],
    compute: (c, p) => {
      const hi = I.highest(c.map((k) => k.high), p.length), lo = I.lowest(c.map((k) => k.low), p.length)
      return [
        { name: 'Upper', kind: 'line', color: '#42a5f5', values: hi },
        { name: 'Middle', kind: 'line', color: '#ff9800', values: hi.map((h, i) => (h == null ? null : (h + lo[i]!) / 2)) },
        { name: 'Lower', kind: 'line', color: '#42a5f5', values: lo }
      ]
    } },
  { id: 'vwap', name: 'VWAP', category: 'Overlay', pane: 'overlay', params: [],
    compute: (c) => [{ name: 'VWAP', kind: 'line', color: '#ffeb3b', values: I.vwap(c) }] },
  { id: 'psar', name: 'Parabolic SAR', category: 'Trend', pane: 'overlay', params: [{ key: 'step', label: 'Step', default: 0.02, step: 0.01 }, { key: 'max', label: 'Max', default: 0.2, step: 0.01 }],
    compute: (c, p) => [{ name: 'SAR', kind: 'dots', color: '#e0e0e0', values: I.parabolicSar(c, p.step, p.max) }] },
  { id: 'supertrend', name: 'Supertrend', category: 'Trend', pane: 'overlay', params: [{ key: 'length', label: 'ATR length', default: 10 }, { key: 'mult', label: 'Factor', default: 3, step: 0.1 }],
    compute: (c, p) => {
      const r = I.supertrend(c, p.length, p.mult)
      return [{ name: 'Supertrend', kind: 'line', color: '#26a69a', values: r.values, tones: { up: '#26a69a', down: '#ef5350' }, colors: r.up.map((u) => (u ? '#26a69a' : '#ef5350')) }]
    } },
  { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'Trend', pane: 'overlay',
    params: [{ key: 'conv', label: 'Conversion', default: 9 }, { key: 'base', label: 'Base', default: 26 }, { key: 'spanB', label: 'Leading span B', default: 52 }, { key: 'disp', label: 'Displacement', default: 26 }],
    cloud: { upper: 'Leading Span A', lower: 'Leading Span B', upColor: 'rgba(38,166,154,0.18)', downColor: 'rgba(239,83,80,0.18)' },
    compute: (c, p) => {
      const r = I.ichimoku(c, p.conv, p.base, p.spanB)
      return [
        { name: 'Conversion', kind: 'line', color: '#2962ff', values: r.tenkan },
        { name: 'Base', kind: 'line', color: '#b71c1c', values: r.kijun },
        { name: 'Lagging Span', kind: 'line', color: '#43a047', values: c.map((k) => k.close), shift: -p.disp },
        { name: 'Leading Span A', kind: 'line', color: '#66bb6a', values: r.spanA, shift: p.disp },
        { name: 'Leading Span B', kind: 'line', color: '#ef5350', values: r.spanB, shift: p.disp }
      ]
    } },
  ...([['pivots', 'Pivot Points (Classic)', false], ['pivots_fib', 'Pivot Points (Fibonacci)', true]] as const).map(([id, name, fib]): StudyDef => ({
    id, name, category: 'Overlay', pane: 'overlay', params: [{ key: 'period', label: 'Bars per period', default: 5 }],
    compute: (c, p) => {
      const r = I.pivots(c, p.period, fib)
      const colors = { P: '#ffeb3b', R1: '#ef5350', R2: '#ef5350', R3: '#ef5350', S1: '#26a69a', S2: '#26a69a', S3: '#26a69a' }
      return (Object.keys(r) as (keyof typeof r)[]).map((k) => ({ name: k, kind: 'line' as const, color: colors[k], values: r[k], steps: true }))
    }
  })),

  { id: 'volume', name: 'Volume', category: 'Volume', pane: 'separate', params: [],
    compute: (c) => [{ name: 'Volume', kind: 'histogram', color: '#26a69a', values: c.map((k) => k.volume), tones: { up: '#26a69a80', down: '#ef535080' }, colors: c.map((k) => (k.close >= k.open ? '#26a69a80' : '#ef535080')) }] },
  { id: 'obv', name: 'On Balance Volume', category: 'Volume', pane: 'separate', params: [],
    compute: (c) => [{ name: 'OBV', kind: 'line', color: '#26c6da', values: I.obv(c) }] },
  { id: 'mfi', name: 'Money Flow Index', category: 'Volume', pane: 'separate', params: [len(14)], levels: [20, 80],
    compute: (c, p) => [{ name: 'MFI', kind: 'line', color: '#7e57c2', values: I.mfi(c, p.length) }] },

  { id: 'rsi', name: 'Relative Strength Index (RSI)', category: 'Momentum', pane: 'separate', params: [len(14)], levels: [30, 70],
    compute: (c, p) => [{ name: 'RSI', kind: 'line', color: '#7e57c2', values: I.rsi(close(c), p.length) }] },
  { id: 'macd', name: 'MACD', category: 'Momentum', pane: 'separate',
    params: [{ key: 'fast', label: 'Fast', default: 12 }, { key: 'slow', label: 'Slow', default: 26 }, { key: 'signal', label: 'Signal', default: 9 }],
    compute: (c, p) => {
      const f = I.ema(close(c), p.fast), s = I.ema(close(c), p.slow)
      const macd = f.map((x, i) => (x == null || s[i] == null ? null : x - s[i]!))
      const sig = I.ema(macd, p.signal)
      const hist = macd.map((m, i) => (m == null || sig[i] == null ? null : m - sig[i]!))
      return [
        { name: 'Histogram', kind: 'histogram', color: '#26a69a', values: hist, tones: { up: '#26a69a', down: '#ef5350' }, colors: hist.map((h) => ((h ?? 0) >= 0 ? '#26a69a' : '#ef5350')) },
        { name: 'MACD', kind: 'line', color: '#2196f3', values: macd },
        { name: 'Signal', kind: 'line', color: '#ff9800', values: sig }
      ]
    } },
  { id: 'stoch', name: 'Stochastic', category: 'Momentum', pane: 'separate',
    params: [{ key: 'k', label: '%K length', default: 14 }, { key: 'smoothK', label: '%K smoothing', default: 3 }, { key: 'd', label: '%D smoothing', default: 3 }], levels: [20, 80],
    compute: (c, p) => {
      const hh = I.highest(c.map((k) => k.high), p.k), ll = I.lowest(c.map((k) => k.low), p.k)
      const raw = c.map((k, i) => (hh[i] == null ? null : hh[i] === ll[i] ? 50 : (100 * (k.close - ll[i]!)) / (hh[i]! - ll[i]!)))
      const k = I.sma(raw, p.smoothK)
      return [
        { name: '%K', kind: 'line', color: '#2196f3', values: k },
        { name: '%D', kind: 'line', color: '#ff9800', values: I.sma(k, p.d) }
      ]
    } },
  { id: 'cci', name: 'Commodity Channel Index', category: 'Momentum', pane: 'separate', params: [len(20)], levels: [-100, 100],
    compute: (c, p) => [{ name: 'CCI', kind: 'line', color: '#26a69a', values: I.cci(c, p.length) }] },
  { id: 'willr', name: 'Williams %R', category: 'Momentum', pane: 'separate', params: [len(14)], levels: [-80, -20],
    compute: (c, p) => {
      const hh = I.highest(c.map((k) => k.high), p.length), ll = I.lowest(c.map((k) => k.low), p.length)
      return [{ name: '%R', kind: 'line', color: '#ec407a', values: c.map((k, i) => (hh[i] == null ? null : hh[i] === ll[i] ? -50 : (-100 * (hh[i]! - k.close)) / (hh[i]! - ll[i]!))) }]
    } },
  { id: 'roc', name: 'Rate of Change', category: 'Momentum', pane: 'separate', params: [len(12)], levels: [0],
    compute: (c, p) => [{ name: 'ROC', kind: 'line', color: '#29b6f6', values: c.map((k, i) => (i < p.length ? null : (100 * (k.close - c[i - p.length].close)) / c[i - p.length].close)) }] },

  { id: 'adx', name: 'Average Directional Index (ADX)', category: 'Trend', pane: 'separate', params: [len(14)], levels: [25],
    compute: (c, p) => {
      const r = I.adx(c, p.length)
      return [
        { name: 'ADX', kind: 'line', color: '#f44336', values: r.adx },
        { name: '+DI', kind: 'line', color: '#26a69a', values: r.plus },
        { name: '-DI', kind: 'line', color: '#ef5350', values: r.minus }
      ]
    } },
  { id: 'atr', name: 'Average True Range (ATR)', category: 'Volatility', pane: 'separate', params: [len(14)],
    compute: (c, p) => [{ name: 'ATR', kind: 'line', color: '#ff7043', values: I.atr(c, p.length) }] }
]

export const studyById = (id: string) => STUDIES.find((s) => s.id === id)!
