import { useEffect, useState } from 'react'
import { toast } from '../toast'
import { formatDateTime, localTz, resolveTz, tzAbbr, MARKET_TZ, type DisplaySettings, type TzMode } from '../display'
import { isMarketOpen } from '../../../shared/nytime'
import type { KeyStatus } from '../../../shared/chat'
import type { FmpTestRow } from '../../../shared/fmp'
import { CAPS, fillGrain } from '../../../shared/fmpCaps'
import { usePlan } from '../fmpCaps'

export default function SettingsView({ onDataKeyChange, display, onDisplayChange }: { onDataKeyChange: () => void; display: DisplaySettings; onDisplayChange: (d: DisplaySettings) => void }) {
  const plan = usePlan()
  const [status, setStatus] = useState<KeyStatus | null>(null)
  const [key, setKey] = useState('')
  const [fmp, setFmp] = useState<KeyStatus | null>(null)
  const [fmpKey, setFmpKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [tests, setTests] = useState<FmpTestRow[] | null>(null)
  const [mcp, setMcp] = useState<{ ok: boolean; count?: number; transport?: string; sample?: string[]; error?: string } | null>(null)
  const [testErr, setTestErr] = useState<string | null>(null)
  const [cache, setCache] = useState<{ entries: number; bytes: number; oldest: number | null } | null>(null)
  const refreshCache = () => window.api.fmp.cacheStats().then(setCache)
  useEffect(() => { refreshCache() }, [])
  const refreshFmp = () => window.api.fmp.keyStatus().then(setFmp)
  useEffect(() => { refreshFmp() }, [])
  const saveFmp = async () => { await window.api.fmp.setKey(fmpKey.trim()); setFmpKey(''); setTests(null); await refreshFmp(); onDataKeyChange(); toast.success('FMP API key saved', { title: 'Market data', duration: 5000 }) }
  const clearFmp = async () => { await window.api.fmp.clearKey(); setTests(null); await refreshFmp(); onDataKeyChange(); toast.info('FMP API key removed. The app will show sample data.') }
  const runTest = async () => {
    setTesting(true); setTests(null); setTestErr(null)
    const r = await window.api.fmp.test()
    if (r.ok) {
      // options are not an FMP product; check the separate delayed options feed alongside
      const oc = await window.api.options.chain('AAPL', true)
      const optRow: FmpTestRow = oc.ok
        ? { name: 'Options chain (Cboe, delayed)', path: 'cdn.cboe.com options/AAPL.json', ok: true, detail: `${oc.data.contracts.length} contracts, ${oc.data.expirations.length} expirations` }
        : { name: 'Options chain (Cboe, delayed)', path: 'cdn.cboe.com options/AAPL.json', ok: false, detail: oc.error }
      const rowsAll = [...r.data, optRow]
      setTests(rowsAll)
      const good = rowsAll.filter((t) => t.ok).length
      const notInPlan = rowsAll.filter((t) => t.status === 'plan').length
      if (good === rowsAll.length) toast.success(`All ${good} data feeds responded`, { title: 'Connection OK' })
      else if (notInPlan > 0) toast.info(`${good} of ${rowsAll.length} data feeds responded. ${notInPlan} ${notInPlan === 1 ? 'is' : 'are'} not in your FMP plan, so the features that need ${notInPlan === 1 ? 'it' : 'them'} are hidden.`, { title: 'Connected' })
      else toast.warning(`${good} of ${rowsAll.length} data feeds responded. Expand the list below for details.`, { title: 'Partly connected' })
    } else { setTestErr(r.error); toast.error(r.error, { title: 'Connection failed' }) }
    setMcp(await window.api.fmp.mcpStatus())
    setTesting(false)
  }
  const refresh = () => window.api.chat.keyStatus().then(setStatus)
  useEffect(() => { refresh() }, [])

  const save = async () => { await window.api.chat.setKey(key.trim()); setKey(''); refresh(); toast.success('Anthropic API key saved') }
  const clear = async () => { await window.api.chat.clearKey(); refresh(); toast.info('Anthropic API key removed') }

  return (
    <>
      <div className="pane-title">Settings</div>
      <div className="pane-body pad settings">
        <section>
          <h3>Time &amp; display</h3>
          <label>Show times in
            <select value={display.tzMode} onChange={(e) => onDisplayChange({ ...display, tzMode: e.target.value as TzMode })}>
              <option value="market">Market time — New York ({tzAbbr(MARKET_TZ)})</option>
              <option value="local">My local time — {localTz()} ({tzAbbr(localTz())})</option>
              <option value="custom">Another time zone…</option>
            </select>
          </label>
          {display.tzMode === 'custom' && (
            <label>Time zone
              <select value={display.customTz} onChange={(e) => onDisplayChange({ ...display, customTz: e.target.value })}>
                {(typeof Intl.supportedValuesOf === 'function' ? ['UTC', ...Intl.supportedValuesOf('timeZone')] : ['UTC', MARKET_TZ, localTz()]).map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
          )}
          <label>Clock
            <select value={display.hour12 ? '12' : '24'} onChange={(e) => onDisplayChange({ ...display, hour12: e.target.value === '12' })}>
              <option value="24">24-hour (14:30)</option><option value="12">12-hour (2:30 PM)</option>
            </select>
          </label>
          <div className="muted" style={{ marginTop: 6 }}>
            Now: {formatDateTime(Date.now() / 1000, display)} · US market {isMarketOpen(Math.floor(Date.now() / 1000)) ? 'open' : 'closed'} (regular hours 09:30–16:00 New York time; holidays are not tracked).
            {resolveTz(display) !== MARKET_TZ && <><br />Intraday charts show bars in this zone. Daily, weekly and monthly bars are dates and are unaffected.</>}
          </div>
        </section>
        <section>
          <h3>Anthropic API key (Claude chat)</h3>
          <div className="muted" style={{ marginBottom: 8 }}>
            {status?.source === 'stored' && (status.encrypted ? 'A key is saved (encrypted with your system keyring).' : 'A key is saved. Encryption is unavailable on this system, so it is stored unencrypted in the local database.')}
            {status?.source === 'env' && 'Using the ANTHROPIC_API_KEY environment variable.'}
            {status?.source === 'none' && 'No key configured.'}
          </div>
          <label>
            <input type="password" className="search" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && key.trim() && save()} />
          </label>
          <div className="btn-row">
            <button className="btn primary" disabled={!key.trim()} onClick={save}>Save key</button>
            {status?.source === 'stored' && <button className="btn" onClick={clear}>Remove saved key</button>}
          </div>
        </section>
        <section>
          <h3>Market data key (Financial Modeling Prep)</h3>
          <div className="muted" style={{ marginBottom: 8 }}>
            {fmp?.source === 'stored' && (fmp.encrypted ? 'A key is saved (encrypted with your system keyring).' : 'A key is saved. Encryption is unavailable on this system, so it is stored unencrypted in the local database.')}
            {fmp?.source === 'env' && 'Using the FMP_API_KEY environment variable.'}
            {fmp?.source === 'none' && 'No key configured. The app shows sample data until you add one.'}
          </div>
          <label>
            <input type="password" className="search" placeholder="FMP API key" value={fmpKey} onChange={(e) => setFmpKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fmpKey.trim() && saveFmp()} />
          </label>
          <div className="btn-row">
            <button className="btn primary" disabled={!fmpKey.trim()} onClick={saveFmp}>Save key</button>
            <button className="btn" disabled={testing || fmp?.source === 'none'} onClick={runTest}>{testing ? 'Testing…' : 'Test connection'}</button>
            {fmp?.source === 'stored' && <button className="btn" onClick={clearFmp}>Remove saved key</button>}
          </div>
          <div className="muted" style={{ marginTop: 10 }}>
            Data cache: {cache ? `${cache.entries} saved response${cache.entries === 1 ? '' : 's'} (${(cache.bytes / 1e6).toFixed(1)} MB)` : '…'}. Responses are kept between sessions and reused while fresh (seconds for live prices,
            hours for analyst and company data), so screens don't refetch from FMP each time. If FMP is unreachable, the last saved copy is shown.
            <button className="btn small" style={{ marginLeft: 8 }} onClick={async () => { await window.api.fmp.clearCache(); refreshCache(); toast.success('Data cache cleared') }}>Clear cache</button>
          </div>
          {testErr && <div className="msg-error" style={{ marginTop: 10 }}><span>{testErr}</span></div>}
          {mcp && (
            <div className="test-list">
              <div className="test-row">
                <span className={mcp.ok ? 'up' : 'down'}>{mcp.ok ? '✓' : '✗'}</span>
                <span className="name">Claude data tools (MCP)</span>
                <span className="path">financialmodelingprep.com/mcp</span>
                {mcp.ok
                  ? <details><summary>{mcp.count} tools via {mcp.transport}</summary><div className="fields">{mcp.sample?.join(', ')}{(mcp.count ?? 0) > 12 ? ', …' : ''}</div></details>
                  : <span className="muted">{mcp.error}</span>}
              </div>
            </div>
          )}
          {fmp && fmp.source !== 'none' && plan.caps && (
            <div className="plan-box">
              <h4>What your FMP plan includes</h4>
              <div className="muted">Checked {new Date(plan.caps.checkedAt * 1000).toLocaleString()}. It is checked again when you save a key or click Test connection, and automatically if something turns out not to be in your plan.</div>
              <div className="plan-grid">
                {CAPS.map((c) => {
                  const missing = plan.caps!.unavailable.includes(c.id)
                  return <div key={c.id} className={'plan-item' + (missing ? ' off' : '')} title={missing ? `Not included: ${c.lost}` : ''}><span className={missing ? 'down' : 'up'}>{missing ? '✗' : '✓'}</span> {c.label}{missing && <span className="muted"> · {c.lost}</span>}</div>
                })}
              </div>
              {(() => { const g = fillGrain(plan.caps.unavailable); return <div className="muted">{g ? `Limit and stop orders are filled against ${g.label} bars.` : 'There are no intraday bars on this plan, so only plain market orders can be filled.'}</div> })()}
              <label className="plan-toggle"><input type="checkbox" checked={plan.hideMissing} onChange={(e) => plan.setHideMissing(e.target.checked)} /> Hide features my plan does not include</label>
            </div>
          )}
          {tests && (
            <div className="test-list">
              {tests.map((t) => (
                <div key={t.name} className="test-row">
                  <span className={t.ok ? 'up' : 'down'}>{t.ok ? '✓' : '✗'}</span>
                  <span className="name">{t.name}</span>
                  <span className="path">{t.path}</span>
                  {t.fields ? <details><summary>{t.detail}</summary><div className="fields">{t.fields.join(', ')}</div></details> : <span className="muted">{t.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
