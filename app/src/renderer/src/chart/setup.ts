import { STUDIES } from './studies'
import { RANGES, INTERVALS, coerceInterval, type Interval, type Range } from './timeframe'
import type { ChartSettings, ChartType } from './settings'
import type { ChartSetup } from '../../../shared/strategies'

const TYPES: ChartType[] = ['candles', 'hollow', 'bars', 'line', 'area', 'heikin']

/** Applies a strategy's chart setup on top of the current settings. Unknown studies/parameters are dropped and reported. */
export function chartSettingsFromSetup(current: ChartSettings, setup: ChartSetup): { settings: ChartSettings; dropped: string[] } {
  const dropped: string[] = []
  const range = (RANGES.some((r) => r.id === setup.range) ? setup.range : current.range) as Range
  const wanted = (INTERVALS.some((i) => i.id === setup.interval) ? setup.interval : current.interval) as Interval
  const interval = coerceInterval(range, wanted)
  const studies = setup.studies.flatMap((s) => {
    const def = STUDIES.find((d) => d.id === s.study)
    if (!def) { dropped.push(`study "${s.study}"`); return [] }
    const params: Record<string, number> = {}
    for (const [k, v] of Object.entries(s.params ?? {})) {
      if (def.params.some((p) => p.key === k) && typeof v === 'number' && v > 0) params[k] = v
      else dropped.push(`${s.study} parameter "${k}"`)
    }
    return [{ uid: crypto.randomUUID(), studyId: def.id, params, visible: true }]
  })
  const type = (TYPES.includes(setup.type as ChartType) ? setup.type : current.type) as ChartType
  return { settings: { ...current, range, interval, type, studies }, dropped }
}

/** The reverse: describe the chart the user has now, to save as a strategy's setup. */
export function setupFromSettings(s: ChartSettings): ChartSetup {
  return { range: s.range, interval: s.interval, type: s.type, studies: s.studies.filter((x) => x.visible).map((x) => ({ study: x.studyId, ...(Object.keys(x.params).length ? { params: x.params } : {}) })) }
}

export const describeSetup = (c: ChartSetup) => {
  const range = RANGES.find((r) => r.id === c.range)?.label ?? c.range, interval = INTERVALS.find((i) => i.id === c.interval)?.label ?? c.interval
  const studies = c.studies.map((s) => { const d = STUDIES.find((x) => x.id === s.study); const p = Object.values(s.params ?? {}); return d ? `${d.name.replace(/ \(.*\)/, '')}${p.length ? ` (${p.join(', ')})` : ''}` : s.study })
  return { range, interval, studies }
}
