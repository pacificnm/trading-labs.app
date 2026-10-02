import { useEffect, useRef, useState } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'
import { toast } from '../toast'
import Logo from './Logo'

// Frameless window: the bar is a drag region, interactive parts opt out via CSS.
export default function TitleBar({ title, onOpenSettings, onOpenChartSettings, onOpenAbout, onOpenHelp }: { title: string; onOpenSettings: () => void; onOpenChartSettings: () => void; onOpenAbout: () => void; onOpenHelp: () => void }) {
  const [maximized, setMaximized] = useState(false)
  const [open, setOpen] = useState<'file' | 'chart' | 'about' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const chartMenuRef = useRef<HTMLDivElement>(null)
  const aboutMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.win.isMaximized().then(setMaximized)
    return window.api.win.onMaximized(setMaximized)
  }, [])

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && !chartMenuRef.current?.contains(e.target as Node) && !aboutMenuRef.current?.contains(e.target as Node) && setOpen(null)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const backUp = async () => {
    const r = await window.api.backup.create()
    if (r.ok) toast.success(`${r.contents}. Saved to ${r.path} (${(r.size / 1024 / 1024).toFixed(1)} MB). API keys are not included.`, { title: 'Backup saved', duration: 12000 })
    else if (!r.canceled) toast.error(r.error ?? 'The backup could not be written.', { title: 'Backup failed' })
  }
  const restore = async () => {
    const r = await window.api.backup.restore()
    if (!r.ok && !r.canceled) toast.error(r.error ?? 'The backup could not be restored.', { title: 'Restore failed' })
  }
  const pick = (fn: () => void) => () => { setOpen(null); fn() }

  return (
    <header className="titlebar" onDoubleClick={() => window.api.win.toggleMaximize()}>
      <Logo size={20} />
      <div className="menus" onDoubleClick={(e) => e.stopPropagation()}>
        <div className="menu" ref={menuRef}>
          <button className={open === 'file' ? 'open' : ''} onClick={() => setOpen(open === 'file' ? null : 'file')} onMouseEnter={() => open && setOpen('file')}>File</button>
          {open === 'file' && (
            <div className="dropdown">
              <button onClick={pick(onOpenSettings)}>Settings</button>
              <hr />
              <button onClick={pick(backUp)}>Back Up Data…</button>
              <button onClick={pick(restore)}>Restore From Backup…</button>
              <hr />
              <button onClick={pick(() => window.api.quit())}>Exit<span className="hint">Alt+F4</span></button>
            </div>
          )}
        </div>
        <div className="menu" ref={chartMenuRef}>
          <button className={open === 'chart' ? 'open' : ''} onClick={() => setOpen(open === 'chart' ? null : 'chart')} onMouseEnter={() => open && setOpen('chart')}>Chart</button>
          {open === 'chart' && (
            <div className="dropdown">
              <button onClick={pick(onOpenChartSettings)}>Chart Settings…</button>
            </div>
          )}
        </div>
        <div className="menu" ref={aboutMenuRef}>
          <button className={open === 'about' ? 'open' : ''} onClick={() => setOpen(open === 'about' ? null : 'about')} onMouseEnter={() => open && setOpen('about')}>About</button>
          {open === 'about' && (
            <div className="dropdown">
              <button onClick={pick(onOpenHelp)}>Help Contents<span className="hint">F1</span></button>
              <hr />
              <button onClick={pick(onOpenAbout)}>About Trading Lab…</button>
            </div>
          )}
        </div>
      </div>
      <span className="title">{title}</span>
      <div className="controls" onDoubleClick={(e) => e.stopPropagation()}>
        <button title="Minimize" onClick={() => window.api.win.minimize()}><Minus size={16} strokeWidth={1.5} /></button>
        <button title={maximized ? 'Restore' : 'Maximize'} onClick={() => window.api.win.toggleMaximize()}>
          {maximized ? <Copy size={13} strokeWidth={1.5} /> : <Square size={12} strokeWidth={1.5} />}
        </button>
        <button title="Close" className="close" onClick={() => window.api.win.close()}><X size={16} strokeWidth={1.5} /></button>
      </div>
    </header>
  )
}
