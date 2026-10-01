import { useSyncExternalStore } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

type Kind = 'success' | 'error' | 'warning' | 'info'
export interface ToastOptions {
  title?: string
  /** ms before it disappears; 0 keeps it until dismissed. Errors linger longer by default. */
  duration?: number
  action?: { label: string; onClick: () => void }
}
interface Item { id: number; kind: Kind; text: string; title?: string; duration: number; action?: ToastOptions['action']; count: number; stamp: number }

const MAX_VISIBLE = 5
const DEFAULT_MS: Record<Kind, number> = { success: 4000, info: 4500, warning: 6500, error: 9000 }

// A tiny store so any code (React or not, e.g. Claude's tool handlers) can raise a toast.
let items: Item[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

function push(kind: Kind, text: string, opts: ToastOptions = {}): number {
  const same = items.find((t) => t.kind === kind && t.text === text)
  if (same) {
    // repeat of a message already on screen: bump a counter and restart its timer instead of stacking
    items = items.map((t) => (t === same ? { ...t, count: t.count + 1, stamp: Date.now() } : t))
    emit()
    return same.id
  }
  const item: Item = { id: ++seq, kind, text, title: opts.title, duration: opts.duration ?? DEFAULT_MS[kind], action: opts.action, count: 1, stamp: Date.now() }
  items = [...items, item].slice(-MAX_VISIBLE)
  emit()
  return item.id
}
const dismiss = (id: number) => { items = items.filter((t) => t.id !== id); emit() }

export const toast = {
  success: (text: string, o?: ToastOptions) => push('success', text, o),
  error: (text: string, o?: ToastOptions) => push('error', text, o),
  warning: (text: string, o?: ToastOptions) => push('warning', text, o),
  info: (text: string, o?: ToastOptions) => push('info', text, o),
  dismiss
}

const ICON = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info }

function ToastView({ t }: { t: Item }) {
  const Icon = ICON[t.kind]
  return (
    <div className={'toast ' + t.kind} role={t.kind === 'error' ? 'alert' : 'status'}>
      <Icon size={16} className="toast-icon" />
      <div className="toast-main">
        {t.title && <div className="toast-title">{t.title}</div>}
        <div className="toast-text">{t.text}{t.count > 1 && <span className="toast-count">×{t.count}</span>}</div>
        {t.action && <button className="toast-action" onClick={() => { t.action!.onClick(); dismiss(t.id) }}>{t.action.label}</button>}
      </div>
      <button className="toast-x" title="Dismiss" onClick={() => dismiss(t.id)}><X size={14} /></button>
      {/* the bar's CSS animation is the timer: hovering pauses it, finishing it dismisses the toast */}
      {t.duration > 0 && <div key={t.stamp} className="toast-bar" style={{ animationDuration: `${t.duration}ms` }} onAnimationEnd={() => dismiss(t.id)} />}
    </div>
  )
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => items)
  return <div className="toasts" aria-live="polite">{list.map((t) => <ToastView key={t.id} t={t} />)}</div>
}
