import { useEffect, useState } from 'react'
import { Copy, ExternalLink, X } from 'lucide-react'
import { toast } from '../toast'
import Logo from './Logo'

type About = Awaited<ReturnType<typeof window.api.about>>

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
