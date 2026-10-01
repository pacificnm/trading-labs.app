import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { INTERVAL_CAP, SCREEN_CAPS, missingAll, type CapId, type FmpCaps } from '../../shared/fmpCaps'
import { INTERVALS, setBlockedIntervals, type Interval } from './chart/timeframe'

interface Plan {
  /** the last plan check, or null if none has run */
  caps: FmpCaps | null
  /** capabilities to leave out right now (empty when the user chose to show everything) */
  unavailable: ReadonlySet<CapId>
  hideMissing: boolean
  setHideMissing: (v: boolean) => void
  /** false when the plan lacks everything this screen needs */
  hasScreen: (id: string) => boolean
}

const Ctx = createContext<Plan>({ caps: null, unavailable: new Set(), hideMissing: true, setHideMissing: () => undefined, hasScreen: () => true })
export const usePlan = () => useContext(Ctx)

/** Keeps the renderer in step with what the FMP plan includes, so screens, tabs and chart intervals the plan cannot serve are left out instead of erroring. */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [caps, setCaps] = useState<FmpCaps | null>(null)
  const [hideMissing, setHide] = useState(true)
  useEffect(() => {
    window.api.fmp.caps().then(setCaps)
    window.api.getSetting('hideMissingFeatures').then((v) => { if (typeof v === 'boolean') setHide(v) })
    return window.api.fmp.onCapsChanged(setCaps)
  }, [])
  const setHideMissing = useCallback((v: boolean) => { setHide(v); window.api.setSetting('hideMissingFeatures', v) }, [])

  const unavailable = useMemo<ReadonlySet<CapId>>(() => new Set(hideMissing && caps ? caps.unavailable : []), [caps, hideMissing])
  // set during render, before children read it, so the first paint already has the right interval list
  useMemo(() => setBlockedIntervals(INTERVALS.filter((i) => { const c = INTERVAL_CAP[i.id]; return c && unavailable.has(c) }).map((i) => i.id as Interval)), [unavailable])
  const value = useMemo<Plan>(() => ({ caps, unavailable, hideMissing, setHideMissing, hasScreen: (id) => !missingAll(unavailable, SCREEN_CAPS[id] ?? []) }), [caps, unavailable, hideMissing, setHideMissing])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
