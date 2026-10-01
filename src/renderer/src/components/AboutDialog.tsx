import { useEffect, useState } from 'react'
import { Copy, ExternalLink, X } from 'lucide-react'
import { toast } from '../toast'

type About = Awaited<ReturnType<typeof window.api.about>>

const Logo = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" rx="14" fill="#1e1e1e" /><rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="#007acc" strokeWidth="2" />
    <g strokeWidth="2.4" strokeLinecap="round"><line x1="16" y1="26" x2="16" y2="47" stroke="#ef5350" /><line x1="27" y1="20" x2="27" y2="43" stroke="#26a69a" /><line x1="38" y1="15" x2="38" y2="38" stroke="#26a69a" /><line x1="49" y1="10" x2="49" y2="31" stroke="#26a69a" /></g>
    <rect x="12" y="31" width="8" height="12" rx="1.5" fill="#ef5350" /><rect x="23" y="25" width="8" height="14" rx="1.5" fill="#26a69a" /><rect x="34" y="19" width="8" height="14" rx="1.5" fill="#26a69a" /><rect x="45" y="14" width="8" height="12" rx="1.5" fill="#26a69a" />
    <line x1="9" y1="52" x2="55" y2="52" stroke="#007acc" strokeWidth="2" />
  </svg>
)

const platformName = (p: string) => ({ linux: 'Linux', darwin: 'macOS', win32: 'Windows' })[p] ?? p

export default function AboutDialog({ onClose }: { onClose: () => void }) {
  const [a, setA] = useState<About | null>(null)
  useEffect(() => { window.api.about().then(setA) }, [])
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])

  const details = a ? `${a.name} ${a.version} (${a.packaged ? 'packaged' : 'development'}) · Electron ${a.electron} · Chromium ${a.chromium} · Node ${a.node} · ${platformName(a.platform)} ${a.arch}` : ''
  return (
    <div className="dlg-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dlg about" role="dialog" aria-modal="true" aria-label="About Trading Lab">
        <button className="about-x" title="Close" onClick={onClose}><X size={16} /></button>
        <div className="about-head"><Logo /><div><div className="about-name">Trading Lab</div><div className="muted">{a ? `Version ${a.version}` : 'Loading…'}</div></div></div>
        {a?.description && <p className="about-desc">{a.description}</p>}
        {a && (
          <>
            <div className="about-grid">
              <span>Version</span><b>{a.version}</b>
              <span>Build</span><b>{a.packaged ? 'Installed / packaged' : 'Development'}</b>
              <span>Electron</span><b>{a.electron}</b>
              <span>Chromium</span><b>{a.chromium}</b>
              <span>Node.js</span><b>{a.node}</b>
              <span>System</span><b>{platformName(a.platform)} · {a.arch}</b>
              <span>Data folder</span><b className="about-path" title={a.dataFolder}>{a.dataFolder}</b>
              {a.license && <><span>License</span><b>{a.license}</b></>}
            </div>
            <div className="about-links">
              {a.repository
                ? <button className="btn primary" onClick={() => window.api.openExternal(a.repository)}><ExternalLink size={13} /> GitHub repository</button>
                : <span className="muted" title="Set the repository field in package.json">GitHub repository: not configured yet</span>}
              <button className="btn" onClick={() => { navigator.clipboard.writeText(details); toast.success('Version details copied') }}><Copy size={13} /> Copy version info</button>
            </div>
            <div className="about-credits muted">
              <div><b>Built with</b> Electron, React, and TradingView Lightweight Charts™ (<a className="link" onClick={() => window.api.openExternal('https://www.tradingview.com/')}>tradingview.com</a>).</div>
              <div><b>Data</b> from Financial Modeling Prep (market data, fundamentals, news, disclosures) and Cboe delayed quotes (options). <b>Assistant</b> powered by Anthropic Claude.</div>
              <div>Educational software. Nothing here is investment advice, and paper trades use simulated fills.</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
