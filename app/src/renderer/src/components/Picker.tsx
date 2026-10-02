import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface PickerOption { id: string; label: string; desc?: string }

/** Small dropdown that opens upward (used in the chat input toolbar). */
export default function Picker({ options, value, onChange, disabled, title, prefix }: {
  options: PickerOption[]; value: string; onChange: (id: string) => void; disabled?: boolean; title?: string; prefix?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  const current = options.find((o) => o.id === value)
  return (
    <div className="picker" ref={ref}>
      <button className="picker-btn" title={title} disabled={disabled} onClick={() => setOpen(!open)}>
        {prefix && <span className="muted">{prefix}</span>}
        <span>{current?.label ?? value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="picker-menu">
          {options.map((o) => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false) }}>
              <span className="check">{o.id === value && <Check size={13} />}</span>
              <span className="opt"><b>{o.label}</b>{o.desc && <span className="muted">{o.desc}</span>}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
