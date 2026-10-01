import { STUDIES, type Output, type StudyDef } from './studies'
import type { StudyInstance } from './settings'
import type { Candle } from './indicators'

/** Colours given to the 2nd, 3rd... copy of the same study (an SMA 50 and an SMA 200 should not look alike). */
export const DUP_PALETTE = ['#ba68c8', '#81c784', '#ff7043', '#fff176', '#4dd0e1', '#f06292']

const dummy: Candle[] = Array.from({ length: 260 }, (_, i) => { const b = 100 + Math.sin(i / 9) * 8 + i * 0.05; return { time: 1_700_000_000 + i * 86400, open: b, high: b + 2, low: b - 2, close: b + 0.6, volume: 1000 + i } })
const cache = new Map<string, Output[]>()
/** The outputs (names and default colours) a study draws, found by running it once on dummy data. */
export function studyOutputs(def: StudyDef): Output[] {
  let o = cache.get(def.id)
  if (!o) { o = def.compute(dummy, Object.fromEntries(def.params.map((p) => [p.key, p.default]))); cache.set(def.id, o) }
  return o
}

/** Which copy of its study this instance is (0 for the first). */
export const copyIndex = (studies: StudyInstance[], uid: string) => {
  const me = studies.find((s) => s.uid === uid)
  return me ? studies.filter((s) => s.studyId === me.studyId).findIndex((s) => s.uid === uid) : 0
}

/** The colour actually drawn for one output: the user's override, else a copy-specific default, else the study's own. */
export function lineColor(out: Output, inst: StudyInstance, copy: number, outIndex: number): string {
  const o = inst.colors?.[out.name]
  if (o) return o
  return copy > 0 && out.kind === 'line' && !out.tones ? DUP_PALETTE[(copy - 1 + outIndex) % DUP_PALETTE.length] : out.color
}

const alphaOf = (c: string) => (c.length === 9 ? c.slice(7) : '')
/** Up and down colours of a two-tone output (histogram bars, Supertrend), with overrides applied. Alpha of the default is kept. */
export function toneColors(out: Output, inst: StudyInstance): { up: string; down: string } | null {
  if (!out.tones) return null
  const pick = (k: 'up' | 'down') => { const o = inst.colors?.[`${out.name}:${k}`]; return o ? o.slice(0, 7) + alphaOf(out.tones![k]) : out.tones![k] }
  return { up: pick('up'), down: pick('down') }
}

/** Recolour a per-point colour array using the two tones. */
export function recolour(out: Output, inst: StudyInstance): string[] | undefined {
  const t = toneColors(out, inst)
  if (!out.colors || !t || !out.tones) return out.colors
  return out.colors.map((c) => (c === out.tones!.up ? t.up : c === out.tones!.down ? t.down : c))
}

export const defOf = (id: string) => STUDIES.find((s) => s.id === id)!
export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
