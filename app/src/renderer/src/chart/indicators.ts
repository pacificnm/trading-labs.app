export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }
export type Num = number | null

export function sma(v: Num[], n: number): Num[] {
  return v.map((_, i) => {
    if (i < n - 1) return null
    let sum = 0
    for (let j = i - n + 1; j <= i; j++) { if (v[j] == null) return null; sum += v[j]! }
    return sum / n
  })
}

// Starts at the first run of n non-null values (seeded with their SMA).
export function ema(v: Num[], n: number): Num[] {
  const out: Num[] = new Array(v.length).fill(null)
  const k = 2 / (n + 1)
  let prev: number | null = null
  let count = 0, sum = 0
  for (let i = 0; i < v.length; i++) {
    if (v[i] == null) continue
    if (prev == null) {
      sum += v[i]!; count++
      if (count === n) { prev = sum / n; out[i] = prev }
    } else { prev = v[i]! * k + prev * (1 - k); out[i] = prev }
  }
  return out
}

// Wilder's smoothing (RMA)
export function rma(v: Num[], n: number): Num[] {
  const out: Num[] = new Array(v.length).fill(null)
  let prev: number | null = null
  let count = 0, sum = 0
  for (let i = 0; i < v.length; i++) {
    if (v[i] == null) continue
    if (prev == null) {
      sum += v[i]!; count++
      if (count === n) { prev = sum / n; out[i] = prev }
    } else { prev = (prev * (n - 1) + v[i]!) / n; out[i] = prev }
  }
  return out
}

export function wma(v: Num[], n: number): Num[] {
  const denom = (n * (n + 1)) / 2
  return v.map((_, i) => {
    if (i < n - 1) return null
    let s = 0
    for (let j = 0; j < n; j++) { const x = v[i - n + 1 + j]; if (x == null) return null; s += x * (j + 1) }
    return s / denom
  })
}

export function stdev(v: Num[], n: number): Num[] {
  const m = sma(v, n)
  return v.map((_, i) => {
    if (m[i] == null) return null
    let s = 0
    for (let j = i - n + 1; j <= i; j++) s += (v[j]! - m[i]!) ** 2
    return Math.sqrt(s / n)
  })
}

export const highest = (v: number[], n: number): Num[] =>
  v.map((_, i) => (i < n - 1 ? null : Math.max(...v.slice(i - n + 1, i + 1))))
export const lowest = (v: number[], n: number): Num[] =>
  v.map((_, i) => (i < n - 1 ? null : Math.min(...v.slice(i - n + 1, i + 1))))

export function trueRange(c: Candle[]): number[] {
  return c.map((k, i) => (i === 0 ? k.high - k.low : Math.max(k.high - k.low, Math.abs(k.high - c[i - 1].close), Math.abs(k.low - c[i - 1].close))))
}

export const atr = (c: Candle[], n: number): Num[] => rma(trueRange(c), n)

export function rsi(close: number[], n: number): Num[] {
  const gain = close.map((x, i) => (i === 0 ? 0 : Math.max(x - close[i - 1], 0)))
  const loss = close.map((x, i) => (i === 0 ? 0 : Math.max(close[i - 1] - x, 0)))
  const ag = rma(gain.slice(1), n), al = rma(loss.slice(1), n)
  return [null, ...ag.map((g, i) => (g == null || al[i] == null ? null : al[i] === 0 ? 100 : 100 - 100 / (1 + g / al[i]!)))]
}

export function vwap(c: Candle[]): number[] {
  let pv = 0, vol = 0
  return c.map((k) => { pv += ((k.high + k.low + k.close) / 3) * k.volume; vol += k.volume; return vol ? pv / vol : k.close })
}

export function obv(c: Candle[]): number[] {
  let acc = 0
  return c.map((k, i) => { if (i > 0) acc += k.close > c[i - 1].close ? k.volume : k.close < c[i - 1].close ? -k.volume : 0; return acc })
}

export function adx(c: Candle[], n: number): { adx: Num[]; plus: Num[]; minus: Num[] } {
  const pdm: number[] = [0], mdm: number[] = [0]
  for (let i = 1; i < c.length; i++) {
    const up = c[i].high - c[i - 1].high, dn = c[i - 1].low - c[i].low
    pdm.push(up > dn && up > 0 ? up : 0)
    mdm.push(dn > up && dn > 0 ? dn : 0)
  }
  const tr = rma(trueRange(c), n), p = rma(pdm, n), m = rma(mdm, n)
  const plus = tr.map((t, i) => (t && p[i] != null ? (100 * p[i]!) / t : null))
  const minus = tr.map((t, i) => (t && m[i] != null ? (100 * m[i]!) / t : null))
  const dx = plus.map((pv, i) => (pv == null || minus[i] == null || pv + minus[i]! === 0 ? null : (100 * Math.abs(pv - minus[i]!)) / (pv + minus[i]!)))
  return { adx: rma(dx, n), plus, minus }
}

export function mfi(c: Candle[], n: number): Num[] {
  const tp = c.map((k) => (k.high + k.low + k.close) / 3)
  return c.map((_, i) => {
    if (i < n) return null
    let pos = 0, neg = 0
    for (let j = i - n + 1; j <= i; j++) { const f = tp[j] * c[j].volume; if (tp[j] > tp[j - 1]) pos += f; else if (tp[j] < tp[j - 1]) neg += f }
    return neg === 0 ? 100 : 100 - 100 / (1 + pos / neg)
  })
}

export function cci(c: Candle[], n: number): Num[] {
  const tp = c.map((k) => (k.high + k.low + k.close) / 3)
  const m = sma(tp, n)
  return tp.map((x, i) => {
    if (m[i] == null) return null
    let dev = 0
    for (let j = i - n + 1; j <= i; j++) dev += Math.abs(tp[j] - m[i]!)
    dev /= n
    return dev === 0 ? 0 : (x - m[i]!) / (0.015 * dev)
  })
}

export function parabolicSar(c: Candle[], step: number, max: number): Num[] {
  const out: Num[] = new Array(c.length).fill(null)
  if (c.length < 2) return out
  let up = c[1].close >= c[0].close
  let sar = up ? c[0].low : c[0].high
  let ep = up ? c[1].high : c[1].low
  let af = step
  out[1] = sar
  for (let i = 2; i < c.length; i++) {
    sar = sar + af * (ep - sar)
    if (up) {
      sar = Math.min(sar, c[i - 1].low, c[i - 2].low)
      if (c[i].low < sar) { up = false; sar = ep; ep = c[i].low; af = step }
      else if (c[i].high > ep) { ep = c[i].high; af = Math.min(af + step, max) }
    } else {
      sar = Math.max(sar, c[i - 1].high, c[i - 2].high)
      if (c[i].high > sar) { up = true; sar = ep; ep = c[i].high; af = step }
      else if (c[i].low < ep) { ep = c[i].low; af = Math.min(af + step, max) }
    }
    out[i] = sar
  }
  return out
}

export function heikinAshi(c: Candle[]): Candle[] {
  const out: Candle[] = []
  c.forEach((k, i) => {
    const close = (k.open + k.high + k.low + k.close) / 4
    const open = i === 0 ? (k.open + k.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2
    out.push({ ...k, open, close, high: Math.max(k.high, open, close), low: Math.min(k.low, open, close) })
  })
  return out
}

export function supertrend(c: Candle[], n: number, mult: number): { values: Num[]; up: boolean[] } {
  const a = atr(c, n)
  const values: Num[] = new Array(c.length).fill(null)
  const up: boolean[] = new Array(c.length).fill(true)
  let fu = 0, fl = 0, dir = 1, started = false
  for (let i = 0; i < c.length; i++) {
    if (a[i] == null) continue
    const hl2 = (c[i].high + c[i].low) / 2
    const bu = hl2 + mult * a[i]!, bl = hl2 - mult * a[i]!
    if (!started) { fu = bu; fl = bl; dir = 1; started = true }
    else {
      const pc = c[i - 1].close
      fu = bu < fu || pc > fu ? bu : fu
      fl = bl > fl || pc < fl ? bl : fl
      if (dir === -1 && c[i].close > fu) dir = 1
      else if (dir === 1 && c[i].close < fl) dir = -1
    }
    values[i] = dir === 1 ? fl : fu
    up[i] = dir === 1
  }
  return { values, up }
}

export function ichimoku(c: Candle[], conv: number, base: number, spanB: number) {
  const hi = c.map((k) => k.high), lo = c.map((k) => k.low)
  const mid = (n: number): Num[] => { const h = highest(hi, n), l = lowest(lo, n); return h.map((x, i) => (x == null ? null : (x + l[i]!) / 2)) }
  const tenkan = mid(conv), kijun = mid(base)
  return {
    tenkan, kijun,
    spanA: tenkan.map((t, i) => (t == null || kijun[i] == null ? null : (t + kijun[i]!) / 2)),
    spanB: mid(spanB)
  }
}

/** Pivot levels for each block of `period` bars, computed from the previous block's H/L/C. */
export function pivots(c: Candle[], period: number, fib: boolean): Record<'P' | 'R1' | 'R2' | 'R3' | 'S1' | 'S2' | 'S3', Num[]> {
  const keys = ['P', 'R1', 'R2', 'R3', 'S1', 'S2', 'S3'] as const
  const out = Object.fromEntries(keys.map((k) => [k, new Array(c.length).fill(null) as Num[]])) as Record<(typeof keys)[number], Num[]>
  for (let start = period; start < c.length; start += period) {
    const prev = c.slice(start - period, start)
    const H = Math.max(...prev.map((k) => k.high)), L = Math.min(...prev.map((k) => k.low)), C = prev[prev.length - 1].close
    const P = (H + L + C) / 3, r = H - L
    const lv = fib
      ? { P, R1: P + 0.382 * r, R2: P + 0.618 * r, R3: P + r, S1: P - 0.382 * r, S2: P - 0.618 * r, S3: P - r }
      : { P, R1: 2 * P - L, R2: P + r, R3: H + 2 * (P - L), S1: 2 * P - H, S2: P - r, S3: L - 2 * (H - P) }
    for (let i = start; i < Math.min(start + period, c.length); i++) for (const k of keys) out[k][i] = lv[k]
  }
  return out
}
