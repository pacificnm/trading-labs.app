import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, Ticket, BookmarkPlus, RefreshCw } from 'lucide-react'
import { calculate, type Binding, type Rules } from '../../../shared/position'
import { money } from '../../../shared/trade'
import type { TradeSnapshot } from '../../../shared/trade'
import { DEFAULT_CALC, fetchAtr, fetchLast, toInput, type CalcState } from '../chart/calcState'
import { toast } from '../toast'

const BIND_TEXT: Record<Binding, string> = { risk: 'your risk budget', position: 'your max position size', total: 'your max total invested', buyingPower: 'your buying power' }
const d = (n: number | null, digits = 2) => (n == null || !Number.isFinite(n) ? '—' : n.toFixed(digits))

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div className="cx-row"><label>{label}{hint && <span className="muted"> {hint}</span>}</label><div className="cx-field">{children}</div></div>
}

export default function CalculatorView({ calc, onCalc, rules, onRules, snap, live, chartSymbol, onOpenTicket, onAskClaude, onOpenJournal }: {
  calc: CalcState; onCalc: (p: Partial<CalcState>) => void; rules: Rules; onRules: (r: Rules) => void; snap: TradeSnapshot | null; live: boolean; chartSymbol: string
  onOpenTicket: (p: { symbol: string; side: 'long' | 'short'; shares: number; entry: number; stop: number; target: number | null; note: string }) => void
  onAskClaude: (text: string) => void; onOpenJournal: (id: number) => void
}) {
  const symbol = (calc.symbol || chartSymbol).toUpperCase()
  const [last, setLast] = useState<number | null>(null)
  const [atr, setAtr] = useState<number | null>(null)
  const [updated, setUpdated] = useState<number | null>(null)
  const [symText, setSymText] = useState(symbol)
  useEffect(() => setSymText(symbol), [symbol])

  const loadLast = async () => { const p = await fetchLast(symbol, live); setLast(p); setUpdated(Date.now()) }
  useEffect(() => { setLast(null); loadLast(); const t = setInterval(loadLast, 15_000); return () => clearInterval(t) }, [symbol, live])
  useEffect(() => { setAtr(null); let alive = true; fetchAtr(symbol, live).then((a) => alive && setAtr(a)); return () => { alive = false } }, [symbol, live])

  const equity = snap?.account.equity ?? 0
  const invested = useMemo(() => (snap?.positions ?? []).reduce((s, p) => s + Math.abs(p.qty * (p.mark ?? p.avg)), 0), [snap])
  const ctx = { last, atr, equity, buyingPower: snap?.account.buyingPower ?? null, investedNow: invested }
  const input = useMemo(() => toInput(calc, ctx), [calc, last, atr, equity, snap, invested])
  const r = useMemo(() => calculate(input, rules), [input, rules])
  const set = (p: Partial<CalcState>) => onCalc(p)
  const setRule = (p: Partial<Rules>) => onRules({ ...rules, ...p })
  const num = (s: string, fallback: number) => { const v = parseFloat(s); return Number.isFinite(v) ? v : fallback }

  const summary = () => `${symbol} ${calc.side}: entry ${d(r.entry)}, stop ${d(r.stop)}, target ${d(r.target)}, ${r.shares} shares ($${d(r.positionValue, 0)} = ${d(r.pctOfAccount, 1)}% of the account), risk $${d(r.risk, 0)} (${d(r.riskPct)}%), reward $${d(r.reward, 0)}, reward:risk ${d(r.rr)}.`
  const usedPct = (v: number, cap: number) => Math.max(0, Math.min(100, cap > 0 ? (v / cap) * 100 : 0))

  const saveIdea = async () => {
    const e = await window.api.journal.create({
      kind: 'trade', status: 'idea', source: 'user', symbol, direction: calc.side, title: `${symbol} ${calc.side} plan`, plan_entry: r.entry, plan_stop: r.stop, plan_target: r.target, plan_qty: r.shares,
      body: `Sized with the calculator. ${summary()}\n\nRisk budget $${d(r.riskBudget, 0)}${r.binding && r.binding !== 'risk' ? `; limited by ${BIND_TEXT[r.binding]}` : ''}.`
    })
    toast.success('Saved to your trading journal as an idea', { action: { label: 'Open journal', onClick: () => onOpenJournal(e.id) } })
  }
  const askClaude = () => onAskClaude(`Please sanity-check my position sizing. ${summary()} Rules: max ${rules.maxRiskPct}% risk per trade, max ${rules.maxPositionPct}% of the account per position, max total invested ${rules.maxTotalMode === 'percent' ? rules.maxTotalPct + '% of the account' : '$' + rules.maxTotalDollars}. Use get_risk_rules, get_account and the chart tools to check my stop against the real chart (support, ATR) and tell me whether the size, stop and target make sense, and what you would change.`)

  const ready = r.ok && r.shares > 0
  return (
    <div className="col">
      <div className="pane-title"><span>Position calculator</span><span className="spacer" />
        <button className="btn small" onClick={askClaude}><Sparkles size={12} /> Ask Claude to check</button></div>
      <div className="pane-body pad screen"><div className="screen-inner wide">
        {!live && <div className="sample-note">Sample prices — add your FMP key in File → Settings for live valuation.</div>}
        <div className="card-grid rows-auto">
          <section className="card-x">
            <div className="card-x-head"><h4>Setup</h4><span className="muted">{last != null ? `live price ${money(last)}` : 'loading price…'}</span></div>
            <Row label="Symbol"><input value={symText} onChange={(e) => setSymText(e.target.value.toUpperCase())} onBlur={() => set({ symbol: symText.trim() })} onKeyDown={(e) => e.key === 'Enter' && set({ symbol: symText.trim() })} />
              <button className="icon-btn" title="Refresh price" onClick={loadLast}><RefreshCw size={13} /></button></Row>
            <Row label="Direction"><div className="seg"><button className={calc.side === 'long' ? 'on' : ''} onClick={() => set({ side: 'long' })}>Long</button><button className={calc.side === 'short' ? 'on' : ''} onClick={() => set({ side: 'short' })}>Short</button></div></Row>
            <Row label="Entry price" hint={calc.followLive ? '(live)' : ''}>
              <input type="number" step="0.01" value={calc.followLive ? (last != null ? String(last) : '') : calc.entry} disabled={calc.followLive} onChange={(e) => set({ entry: e.target.value })} />
              <label className="cx-check"><input type="checkbox" checked={calc.followLive} onChange={(e) => set({ followLive: e.target.checked, entry: e.target.checked ? calc.entry : last != null ? String(last) : calc.entry })} /> follow live price</label>
            </Row>
            <Row label="Account"><select value={calc.accountBasis} onChange={(e) => set({ accountBasis: e.target.value as 'paper' | 'custom' })}><option value="paper">Paper account ({money(equity)})</option><option value="custom">Custom amount</option></select>
              {calc.accountBasis === 'custom' && <input type="number" value={calc.customAccount} onChange={(e) => set({ customAccount: e.target.value })} />}</Row>
            <Row label="Risk per trade"><select value={calc.riskMode} onChange={(e) => set({ riskMode: e.target.value as 'percent' | 'dollars' })}><option value="percent">% of account</option><option value="dollars">Dollars</option></select>
              {calc.riskMode === 'percent' ? <input type="number" step="0.1" value={calc.riskPct} onChange={(e) => set({ riskPct: e.target.value })} /> : <input type="number" step="10" value={calc.riskDollars} onChange={(e) => set({ riskDollars: e.target.value })} />}
              <span className="muted">= {money(r.riskBudgetRequested)}</span></Row>
            <Row label="Win rate" hint="for expected value"><input type="number" min="0" max="100" value={calc.winRate} onChange={(e) => set({ winRate: e.target.value })} /><span className="muted">%</span></Row>
            <Row label="Commission" hint="round trip"><input type="number" min="0" step="0.5" value={calc.commission} onChange={(e) => set({ commission: e.target.value })} /><span className="muted">$</span></Row>
          </section>

          <section className="card-x">
            <div className="card-x-head"><h4>Stop &amp; target</h4><span className="muted">{atr != null ? `ATR(14) = ${money(atr)}` : 'ATR unavailable'}</span></div>
            <Row label="Stop loss"><select value={calc.stopMode} onChange={(e) => set({ stopMode: e.target.value as CalcState['stopMode'] })}><option value="atr">ATR multiple</option><option value="percent">% from entry</option><option value="price">Price</option></select>
              {calc.stopMode === 'atr' && <><input type="number" step="0.25" value={calc.stopAtr} onChange={(e) => set({ stopAtr: e.target.value })} /><span className="muted">× ATR</span></>}
              {calc.stopMode === 'percent' && <><input type="number" step="0.25" value={calc.stopPct} onChange={(e) => set({ stopPct: e.target.value })} /><span className="muted">%</span></>}
              {calc.stopMode === 'price' && <input type="number" step="0.01" value={calc.stopPrice} onChange={(e) => set({ stopPrice: e.target.value })} />}</Row>
            <div className="cx-resolved">Stop at <b className="down">{d(r.stop)}</b>{r.stopPct != null && <> · {d(r.stopPct)}% away</>}{r.stopAtr != null && <> · {d(r.stopAtr, 1)} ATR</>}{r.riskPerShare != null && <> · {money(r.riskPerShare)} risk per share</>}</div>
            <Row label="Profit target"><select value={calc.targetMode} onChange={(e) => set({ targetMode: e.target.value as CalcState['targetMode'] })}><option value="r">Multiple of risk (R)</option><option value="percent">% from entry</option><option value="price">Price</option><option value="none">No target</option></select>
              {calc.targetMode === 'r' && <><input type="number" step="0.25" value={calc.targetR} onChange={(e) => set({ targetR: e.target.value })} /><span className="muted">R</span></>}
              {calc.targetMode === 'percent' && <><input type="number" step="0.5" value={calc.targetPct} onChange={(e) => set({ targetPct: e.target.value })} /><span className="muted">%</span></>}
              {calc.targetMode === 'price' && <input type="number" step="0.01" value={calc.targetPrice} onChange={(e) => set({ targetPrice: e.target.value })} />}</Row>
            <div className="cx-resolved">{r.target != null ? <>Target at <b className="up">{d(r.target)}</b>{r.entry > 0 && <> · {d((Math.abs(r.target - r.entry) / r.entry) * 100)}% away</>}</> : 'No target set'}</div>
            <div className="muted note">{calc.followLive ? 'Entry follows the live price, so percent, ATR and R-based levels and the share count update as the price moves.' : 'Entry is fixed. Switch on “follow live price” to keep the numbers current.'}</div>
          </section>

          <section className="card-x calc-result">
            <div className="card-x-head"><h4>Result</h4>{r.binding && ready && <span className="muted">limited by {BIND_TEXT[r.binding]}</span>}</div>
            <div className="cx-big"><b>{r.shares.toLocaleString()}</b><span>shares</span><em>{money(r.positionValue)} · {d(r.pctOfAccount, 1)}% of account</em></div>
            <div className="cx-stats">
              <div><span>Risk if stopped</span><b className="down">{money(r.risk)}</b><em>{d(r.riskPct)}% of account</em></div>
              <div><span>Reward at target</span><b className="up">{r.reward != null ? money(r.reward) : '—'}</b><em>{r.rr != null ? `${d(r.rr)} : 1` : ''}</em></div>
              <div><span>Break-even win rate</span><b>{r.breakEvenWinRate != null ? `${d(r.breakEvenWinRate * 100, 0)}%` : '—'}</b><em>needed to not lose</em></div>
              <div><span>Expected value</span><b className={r.ev == null ? '' : r.ev >= 0 ? 'up' : 'down'}>{r.ev != null ? money(r.ev) : '—'}</b><em>{r.evR != null ? `${r.evR >= 0 ? '+' : ''}${d(r.evR)}R per trade` : ''}</em></div>
            </div>
            {r.errors.map((e, i) => <div key={i} className="tk-err">{e}</div>)}
            {r.warnings.map((w, i) => <div key={i} className="tk-warn">{w}</div>)}
            <div className="cx-actions">
              <button className="btn primary" disabled={!ready || r.stop == null} onClick={() => onOpenTicket({ symbol, side: calc.side, shares: r.shares, entry: r.entry, stop: r.stop!, target: r.target, note: `From the position calculator. ${summary()}` })}><Ticket size={13} /> Open order ticket</button>
              <button className="btn" disabled={!ready} onClick={saveIdea}><BookmarkPlus size={13} /> Save to journal</button>
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-head"><h4>Your limits</h4><span className="muted">saved automatically</span></div>
            <Row label="Max risk per trade"><input type="number" step="0.1" min="0" value={rules.maxRiskPct} onChange={(e) => setRule({ maxRiskPct: num(e.target.value, rules.maxRiskPct) })} /><span className="muted">% = {money((equity * rules.maxRiskPct) / 100)}</span></Row>
            <Row label="Max per position"><input type="number" step="1" min="0" value={rules.maxPositionPct} onChange={(e) => setRule({ maxPositionPct: num(e.target.value, rules.maxPositionPct) })} /><span className="muted">% = {money(r.maxPositionDollars)}</span></Row>
            <Row label="Max total invested"><select value={rules.maxTotalMode} onChange={(e) => setRule({ maxTotalMode: e.target.value as 'percent' | 'dollars' })}><option value="percent">% of account</option><option value="dollars">Dollars</option></select>
              {rules.maxTotalMode === 'percent' ? <input type="number" step="5" min="0" value={rules.maxTotalPct} onChange={(e) => setRule({ maxTotalPct: num(e.target.value, rules.maxTotalPct) })} /> : <input type="number" step="1000" min="0" value={rules.maxTotalDollars} onChange={(e) => setRule({ maxTotalDollars: num(e.target.value, rules.maxTotalDollars) })} />}
              <span className="muted">= {money(r.maxTotalDollars)}</span></Row>
            <div className="cx-usage"><div className="cx-usage-head"><span>Invested now</span><b>{money(invested)} of {money(r.maxTotalDollars)}</b></div>
              <div className="cx-bar"><i style={{ width: `${usedPct(invested, r.maxTotalDollars)}%` }} /><i className="add" style={{ width: `${Math.min(100 - usedPct(invested, r.maxTotalDollars), usedPct(r.positionValue, r.maxTotalDollars))}%` }} /></div>
              <div className="muted">{money(r.remainingTotalDollars)} of room left. The lighter part is this trade.</div></div>
          </section>

          <section className="card-x">
            <div className="card-x-head"><h4>What if I risk…</h4><span className="muted">same stop, other risk levels</span></div>
            <table className="grid"><thead><tr><th>Risk</th><th style={{ textAlign: 'right' }}>Shares</th><th style={{ textAlign: 'right' }}>Position</th><th style={{ textAlign: 'right' }}>Max loss</th></tr></thead>
              <tbody>{r.whatIf.map((w) => <tr key={w.riskPct} className={Math.abs(w.riskPct - (calc.riskMode === 'percent' ? num(calc.riskPct, 0) : -1)) < 1e-9 ? 'sel' : ''}><td>{w.riskPct}%</td><td style={{ textAlign: 'right' }}>{w.shares.toLocaleString()}</td><td style={{ textAlign: 'right' }}>{money(w.value)}</td><td style={{ textAlign: 'right' }} className="down">{money(w.risk)}</td></tr>)}</tbody></table>
            <div className="muted note">Sizes are still capped by your limits, so a bigger risk does not always mean more shares.</div>
          </section>

          <section className="card-x">
            <div className="card-x-head"><h4>Scenarios</h4><span className="muted">profit or loss if price moves</span></div>
            <table className="grid"><thead><tr><th>Move</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>P/L</th><th style={{ textAlign: 'right' }}>% of account</th></tr></thead>
              <tbody>{[...r.scenarios].map((s) => <tr key={s.label}><td>{s.label}</td><td style={{ textAlign: 'right' }}>{money(s.price)}</td><td style={{ textAlign: 'right' }} className={s.pl >= 0 ? 'up' : 'down'}>{s.pl >= 0 ? '+' : '-'}{money(Math.abs(s.pl))}</td><td style={{ textAlign: 'right' }} className="muted">{input.account > 0 ? d((s.pl / input.account) * 100) : '—'}%</td></tr>)}</tbody></table>
            <div className="muted note">Gaps can jump past a stop, so a real loss can exceed the planned risk.</div>
          </section>
        </div>
      </div></div>
    </div>
  )
}
export { DEFAULT_CALC }
