import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Electron has no window.prompt(), so text input goes through this small in-app dialog.
export interface PromptOptions {
  title: string
  label?: string
  initial?: string
  placeholder?: string
  okLabel?: string
  /** return an error message to block submitting, or null when fine */
  validate?: (value: string) => string | null
}
interface Open extends PromptOptions { resolve: (v: string | null) => void }

let current: Open | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export function promptText(opts: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    current?.resolve(null)
    current = { ...opts, resolve }
    emit()
  })
}

export function DialogHost() {
  const d = useSyncExternalStore(subscribe, () => current, () => current)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { if (d) { setValue(d.initial ?? ''); setError(null); setTimeout(() => { input.current?.focus(); input.current?.select() }, 0) } }, [d])
  if (!d) return null

  const close = (v: string | null) => { d.resolve(v); current = null; emit() }
  const submit = () => {
    const v = value.trim()
    const err = d.validate?.(v) ?? null
    if (err) { setError(err); return }
    close(v)
  }
  return (
    <div className="dlg-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close(null)}>
      <div className="dlg" role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') close(null); if (e.key === 'Enter') submit() }}>
        <div className="dlg-title">{d.title}</div>
        {d.label && <label className="dlg-label">{d.label}</label>}
        <input ref={input} className="dlg-input" value={value} placeholder={d.placeholder} onChange={(e) => { setValue(e.target.value); setError(null) }} />
        {error && <div className="dlg-error">{error}</div>}
        <div className="dlg-actions">
          <button className="btn" onClick={() => close(null)}>Cancel</button>
          <button className="btn primary" onClick={submit}>{d.okLabel ?? 'OK'}</button>
        </div>
      </div>
    </div>
  )
}
