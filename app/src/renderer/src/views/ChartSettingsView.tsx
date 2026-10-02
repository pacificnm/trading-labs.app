import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { STUDIES, studyById } from '../chart/studies'
import { copyIndex, lineColor, studyOutputs, toneColors } from '../chart/colors'
import type { ChartSettings, ChartType, ScaleMode } from '../chart/settings'

const TYPES: [ChartType, string][] = [
  ['candles', 'Candles'], ['hollow', 'Hollow candles'], ['bars', 'Bars'], ['line', 'Line'], ['area', 'Area'], ['heikin', 'Heikin Ashi']
]
const SCALES: [ScaleMode, string][] = [['normal', 'Normal'], ['log', 'Logarithmic'], ['percent', 'Percentage']]
const CATEGORIES = ['Overlay', 'Trend', 'Momentum', 'Volatility', 'Volume'] as const

export default function ChartSettingsView({ settings, onChange }: { settings: ChartSettings; onChange: (s: ChartSettings) => void }) {
  const [filter, setFilter] = useState('')
  const set = (patch: Partial<ChartSettings>) => onChange({ ...settings, ...patch })

  const addStudy = (studyId: string) =>
    set({ studies: [...settings.studies, { uid: crypto.randomUUID(), studyId, params: {}, visible: true }] })
  const patchStudy = (uid: string, fn: (s: ChartSettings['studies'][number]) => ChartSettings['studies'][number]) =>
    set({ studies: settings.studies.map((s) => (s.uid === uid ? fn(s) : s)) })

  /** value null removes the override and goes back to the default colour */
  const setColor = (uid: string, key: string, value: string | null) =>
    patchStudy(uid, (inst) => {
      const colors = { ...(inst.colors ?? {}) }
      if (value === null) delete colors[key]; else colors[key] = value
      return { ...inst, colors: Object.keys(colors).length ? colors : undefined }
    })

  const q = filter.trim().toLowerCase()
  const matches = (name: string) => !q || name.toLowerCase().includes(q)

  return (
    <>
      <div className="pane-title">Chart Settings</div>
      <div className="pane-body pad settings">
        <section>
          <h3>Appearance</h3>
          <label>Chart type
            <select value={settings.type} onChange={(e) => set({ type: e.target.value as ChartType })}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>Price scale
            <select value={settings.scale} onChange={(e) => set({ scale: e.target.value as ScaleMode })}>
              {SCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>Crosshair
            <select value={settings.crosshair} onChange={(e) => set({ crosshair: e.target.value as 'normal' | 'magnet' })}>
              <option value="normal">Free</option><option value="magnet">Magnet (snap to OHLC)</option>
            </select>
          </label>
          <label>Up color <input type="color" value={settings.upColor} onChange={(e) => set({ upColor: e.target.value })} /></label>
          <label>Down color <input type="color" value={settings.downColor} onChange={(e) => set({ downColor: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={settings.grid} onChange={(e) => set({ grid: e.target.checked })} /> Grid lines</label>
        </section>

        <section>
          <h3>Active studies</h3>
          {settings.studies.length === 0 && <div className="muted">None. Add one from the list.</div>}
          {settings.studies.map((inst) => {
            const def = studyById(inst.studyId)
            return (
              <div key={inst.uid} className="study">
                <div className="study-head">
                  <span>{def.name}{def.params.length > 0 && <span className="muted"> · {def.params.map((p) => inst.params[p.key] ?? p.default).join(', ')}</span>}</span>
                  <span className="spacer" />
                  <button title={inst.visible ? 'Hide' : 'Show'} onClick={() => patchStudy(inst.uid, (s) => ({ ...s, visible: !s.visible }))}>
                    {inst.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button title="Remove" onClick={() => set({ studies: settings.studies.filter((s) => s.uid !== inst.uid) })}><Trash2 size={15} /></button>
                </div>
                {def.params.length > 0 && (
                  <div className="study-params">
                    {def.params.map((p) => (
                      <label key={p.key}>{p.label}
                        <input type="number" step={p.step ?? 1} min={p.step ? 0.001 : 1} value={inst.params[p.key] ?? p.default}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (v > 0) patchStudy(inst.uid, (s) => ({ ...s, params: { ...s.params, [p.key]: v } }))
                          }} />
                      </label>
                    ))}
                  </div>
                )}
                <div className="study-colors">
                  <span className="muted">Colors</span>
                  {studyOutputs(def).flatMap((out, oi) => {
                    const copy = copyIndex(settings.studies, inst.uid)
                    const one = (key: string, label: string, value: string) => (
                      <label key={key} className="swatch" title={inst.colors?.[key] ? 'Custom color. Click the arrow to restore the default.' : 'Default color'}>
                        <input type="color" value={value.slice(0, 7)} onChange={(e) => setColor(inst.uid, key, e.target.value)} />
                        <span>{label}</span>
                        {inst.colors?.[key] && <button type="button" className="swatch-reset" title="Restore default" onClick={(e) => { e.preventDefault(); setColor(inst.uid, key, null) }}><RotateCcw size={11} /></button>}
                      </label>
                    )
                    const t = toneColors(out, inst)
                    return t ? [one(`${out.name}:up`, `${out.name} (rising)`, t.up), one(`${out.name}:down`, `${out.name} (falling)`, t.down)] : [one(out.name, out.name, lineColor(out, inst, copy, oi))]
                  })}
                  {inst.colors && <button className="btn small" onClick={() => patchStudy(inst.uid, (x) => ({ ...x, colors: undefined }))}>Reset colors</button>}
                </div>
              </div>
            )
          })}
        </section>

        <section>
          <h3>Add study</h3>
          <input className="search" placeholder="Search studies…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          {CATEGORIES.map((cat) => {
            const items = STUDIES.filter((s) => s.category === cat && matches(s.name))
            if (!items.length) return null
            return (
              <div key={cat}>
                <div className="cat">{cat}</div>
                {items.map((s) => (
                  <div key={s.id} className="row add" onClick={() => addStudy(s.id)}>
                    <span>{s.name}</span><Plus size={14} />
                  </div>
                ))}
              </div>
            )
          })}
        </section>
      </div>
    </>
  )
}
