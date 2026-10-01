import { useMemo, useState } from 'react'
import { X, BookOpen, Sparkles, AlertTriangle, AlertCircle, Check } from 'lucide-react'
import { analyze, describeOrder, money, SIDE_LABEL, TYPE_LABEL, isBuy, opensPosition, type OrderType, type Side, type Strategy, type TradeSnapshot } from '../../../shared/trade'
import { toSpec, type Draft } from '../chart/orderDraft'
import { toast } from '../toast'
import { chartBridge } from '../chart/bridge'

export interface Quote { last: number | null; change: number | null; changePct: number | null }

const SIDES: Side[] = ['buy', 'sell', 'sell_short', 'buy_to_cover']
const TYPES: OrderType[] = ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop']
const STRATEGIES: [Strategy, string][] = [['single', 'Single order'], ['bracket', '1st triggers OCO (bracket)'], ['oco', 'OCO (exit orders)']]
const r2 = (n: number) => String(Math.round(n * 100) / 100)

function Num({ value, onChange, step = 0.01, min = 0, width }: { value: string; onChange: (v: string) => void; step?: number; min?: number; width?: number }) {
  return <input className="tk-in" style={width ? { width } : undefined} type="number" min={min} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
}

export default function TradeTicket({ symbol, draft, onChange, quote, snapshot, live, onClose }: {
  symbol: string; draft: Draft; onChange: (d: Draft) => void; quote: Quote; snapshot: TradeSnapshot | null; live: boolean; onClose: () => void
}) {
  const [step, setStep] = useState<'edit' | 'review'>('edit')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string[] | null>(null)
  const [riskDollars, setRiskDollars] = useState('')
  const set = (patch: Partial<Draft>) => { setError(null); onChange({ ...draft, ...patch }) }

  const spec = useMemo(() => toSpec(draft, symbol), [draft, symbol])
  const position = snapshot?.positions.find((p) => p.symbol === symbol)
  const a = useMemo(() => {
    const reserved = (snapshot?.orders ?? []).filter((o) => o.status === 'working' && (o.side === 'buy' || o.side === 'sell_short')).reduce((s, o) => s + o.qty * (o.limit_price ?? o.stop_price ?? 0), 0)
    return analyze(spec, { last: quote.last, positionQty: position?.qty ?? 0, buyingPower: snapshot?.account.buyingPower ?? 0, reserved })
  }, [spec, quote.last, position, snapshot])

  const buy = isBuy(draft.side)
  const long = draft.side === 'buy' || draft.side === 'sell'
  const entry = a.entry
  const hasStopLeg = draft.strategy !== 'single'
  const sideColor = buy ? 'buy' : 'sell'

  const setQtyFromRisk = (risk: number) => {
    if (entry != null && a.stopPrice != null && Math.abs(entry - a.stopPrice) > 0) set({ qty: String(Math.max(1, Math.floor(risk / Math.abs(entry - a.stopPrice)))) })
  }
  const equity = snapshot?.account.equity ?? 0
  const pctChips = (pcts: number[], sign: 1 | -1, apply: (v: string) => Partial<Draft>) =>
    pcts.map((p) => <button key={p} className="tk-chip" disabled={entry == null} onClick={() => set(apply(r2(entry! * (1 + (sign * p) / 100))))}>{sign > 0 ? '+' : '−'}{p}%</button>)

  const send = async () => {
    setSending(true); setError(null)
    // grab the chart while the draft lines are still on it, for the journal
    const shot = draft.journal && !draft.journalId ? chartBridge.screenshot?.() ?? null : null
    const r = await window.api.trade.place(spec)
    setSending(false)
    if (!r.ok) { setError(r.errors); setStep('edit'); toast.error(r.errors[0], { title: 'Order rejected' }); return }
    // an immediate fill is announced by the engine's own "filled" toast
    if (!r.filledNow) toast.success(describeOrder(spec)[0].split('  —')[0], { title: 'Order placed' })
    try {
      if (draft.journalId) {
        // Claude's idea (or an entry the user opened in the ticket): link the orders to it
        const extra = draft.journalNote.trim()
        const cur = await window.api.journal.get(draft.journalId)
        await window.api.journal.update(draft.journalId, { order_ids: r.orderIds, status: 'taken', ...(extra ? { body: `${cur?.body ?? ''}${cur?.body ? '\n\n' : ''}**My notes:** ${extra}` } : {}) })
        toast.success('Orders linked to your journal entry', { action: { label: 'Open journal', onClick: () => window.api.journal.get(draft.journalId!).then(() => chartBridge.impl?.openJournal(draft.journalId)) } })
      } else if (draft.journal && opensPosition(spec.side)) {
        const claude = draft.source === 'claude'
        const e = await window.api.journal.create({
          kind: 'trade', status: 'taken', source: draft.source, symbol, direction: spec.side === 'buy' ? 'long' : 'short',
          title: `${SIDE_LABEL[spec.side]} ${symbol}${spec.strategy === 'bracket' ? ' (bracket)' : ''}`,
          body: [claude ? draft.note : '', draft.journalNote.trim()].filter(Boolean).join('\n\n'),
          plan_entry: a.entry, plan_stop: a.stopPrice, plan_target: a.targetPrice, plan_qty: spec.qty, order_ids: r.orderIds, image: shot
        })
        toast.info('Recorded in your trading journal', { action: { label: 'Open journal', onClick: () => chartBridge.impl?.openJournal(e.id) } })
      }
    } catch { toast.warning('The order was placed, but saving the journal entry failed.') }
    onClose()
  }

  if (!live) return (
    <div className="ticket">
      <div className="tk-head"><b>Order ticket</b><span className="spacer" /><button className="tk-x" onClick={onClose}><X size={15} /></button></div>
      <div className="tk-body"><div className="msg-error"><AlertCircle size={14} /> <span>Trading needs live prices to simulate fills. Add your FMP key in File → Settings.</span></div></div>
    </div>
  )

  return (
    <div className="ticket">
      <div className="tk-head">
        <b className={sideColor}>{SIDE_LABEL[draft.side]}</b> <b>{symbol}</b>
        {quote.last != null && <span className="tk-last">{money(quote.last)} {quote.changePct != null && <span className={quote.changePct >= 0 ? 'up' : 'down'}>{quote.changePct >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%</span>}</span>}
        <span className="spacer" />
        <button className="tk-x" title="Close (discard)" onClick={onClose}><X size={15} /></button>
      </div>

      <div className="tk-body">
        {draft.source === 'claude' && (
          <div className="tk-claude"><Sparkles size={13} /> <span><b>Claude set this up.</b> Review every field before sending; you decide whether to place it.{draft.note && <><br /><span className="muted">{draft.note}</span></>}</span></div>
        )}

        {step === 'edit' ? (
          <>
            <div className="tk-grid">
              <label>Action</label>
              <select className={'tk-in ' + sideColor} value={draft.side} onChange={(e) => set({ side: e.target.value as Side })}>
                {SIDES.map((s) => <option key={s} value={s}>{SIDE_LABEL[s]}</option>)}
              </select>

              <label>Quantity</label>
              <div className="tk-row">
                <Num value={draft.qty} onChange={(v) => set({ qty: v })} step={1} min={1} width={90} />
                {position && (draft.side === 'sell' || draft.side === 'buy_to_cover') && (
                  <>{[25, 50, 100].map((p) => <button key={p} className="tk-chip" onClick={() => set({ qty: String(Math.max(1, Math.floor((Math.abs(position.qty) * p) / 100))) })}>{p === 100 ? 'All' : p + '%'}</button>)}</>
                )}
              </div>

              <label>Order type</label>
              <select className="tk-in" value={draft.type} onChange={(e) => set({ type: e.target.value as OrderType })}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>

              {(draft.type === 'limit' || draft.type === 'stop_limit') && (<>
                <label>Limit price</label>
                <div className="tk-row"><Num value={draft.limit} onChange={(v) => set({ limit: v })} width={100} />{quote.last != null && <button className="tk-chip" onClick={() => set({ limit: r2(quote.last!) })}>Last</button>}</div>
              </>)}
              {(draft.type === 'stop' || draft.type === 'stop_limit') && (<>
                <label>Stop price</label>
                <div className="tk-row"><Num value={draft.stop} onChange={(v) => set({ stop: v })} width={100} />{quote.last != null && <button className="tk-chip" onClick={() => set({ stop: r2(quote.last!) })}>Last</button>}</div>
              </>)}
              {draft.type === 'trailing_stop' && (<>
                <label>Trail by</label>
                <div className="tk-row"><Num value={draft.trailAmount} onChange={(v) => set({ trailAmount: v })} width={90} />
                  <select className="tk-in" style={{ width: 52 }} value={draft.trailUnit} onChange={(e) => set({ trailUnit: e.target.value as '$' | '%' })}><option>$</option><option>%</option></select></div>
              </>)}

              <label>Time in force</label>
              <select className="tk-in" value={draft.tif} onChange={(e) => set({ tif: e.target.value as 'day' | 'gtc' })}>
                <option value="day">DAY — until today's close</option><option value="gtc">GTC — good till cancelled</option>
              </select>

              <label>Strategy</label>
              <select className="tk-in" value={draft.strategy} onChange={(e) => set({ strategy: e.target.value as Strategy })}>
                {STRATEGIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {hasStopLeg && (
              <div className="tk-legs">
                {draft.strategy === 'bracket' && (
                  <div className="tk-grid">
                    <label className="up">Profit target</label>
                    <div className="tk-col">
                      <Num value={draft.target} onChange={(v) => set({ target: v })} width={100} />
                      <div className="tk-row">
                        {pctChips([2, 5, 10], long ? 1 : -1, (v) => ({ target: v }))}
                        {entry != null && a.stopPrice != null && [1, 2, 3].map((r) => (
                          <button key={r} className="tk-chip" onClick={() => set({ target: r2(entry + (long ? 1 : -1) * r * Math.abs(entry - a.stopPrice!)) })}>{r}R</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="tk-grid">
                  <label className="down">Stop loss</label>
                  <div className="tk-col">
                    <select className="tk-in" value={draft.protectType} onChange={(e) => set({ protectType: e.target.value as Draft['protectType'] })}>
                      <option value="stop">Stop</option><option value="stop_limit">Stop limit</option><option value="trailing_stop">Trailing stop</option>
                    </select>
                    {draft.protectType !== 'trailing_stop' ? (
                      <>
                        <div className="tk-row"><span className="muted tk-mini">stop</span><Num value={draft.protectStop} onChange={(v) => set({ protectStop: v })} width={90} />
                          {draft.protectType === 'stop_limit' && <><span className="muted tk-mini">limit</span><Num value={draft.protectLimit} onChange={(v) => set({ protectLimit: v })} width={90} /></>}</div>
                        <div className="tk-row">{pctChips([1, 2, 5], long ? -1 : 1, (v) => ({ protectStop: v, ...(draft.protectType === 'stop_limit' && !draft.protectLimit ? { protectLimit: v } : {}) }))}</div>
                      </>
                    ) : (
                      <div className="tk-row"><Num value={draft.protectTrail} onChange={(v) => set({ protectTrail: v })} width={90} />
                        <select className="tk-in" style={{ width: 52 }} value={draft.protectTrailUnit} onChange={(e) => set({ protectTrailUnit: e.target.value as '$' | '%' })}><option>$</option><option>%</option></select></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {draft.strategy === 'bracket' && a.stopPrice != null && entry != null && (
              <div className="tk-size">
                <span className="muted">Size to risk</span>
                {[0.5, 1, 2].map((p) => <button key={p} className="tk-chip" onClick={() => setQtyFromRisk((equity * p) / 100)}>{p}% of equity</button>)}
                <Num value={riskDollars} onChange={(v) => { setRiskDollars(v); const n = parseFloat(v); if (n > 0) setQtyFromRisk(n) }} width={70} min={0} step={10} /><span className="muted">$</span>
              </div>
            )}

            <div className="tk-summary">
              <div><span>Buying power</span><b>{snapshot ? money(snapshot.account.buyingPower) : '—'}</b></div>
              {position && <div><span>Position</span><b>{position.qty > 0 ? 'Long' : 'Short'} {Math.abs(position.qty)} @ {position.avg.toFixed(2)}</b></div>}
              <div><span>Est. {buy ? 'cost' : 'proceeds'}</span><b>{a.notional != null ? money(a.notional) : '—'}</b></div>
              {a.risk != null && <div><span>Risk</span><b className="down">{money(a.risk)}{equity > 0 && <span className="muted"> ({((a.risk / equity) * 100).toFixed(2)}% of equity)</span>}</b></div>}
              {a.reward != null && <div><span>Reward</span><b className="up">{money(a.reward)}</b></div>}
              {a.rr != null && <div><span>Reward : risk</span><b>{a.rr.toFixed(2)} : 1</b></div>}
            </div>

            {opensPosition(draft.side) && (
              <div className="tk-journal">
                {draft.journalId
                  ? <div className="tk-jhead"><BookOpen size={13} /> Linked to journal entry #{draft.journalId}. Sending links the orders to it.</div>
                  : <label className="tk-jhead"><input type="checkbox" checked={draft.journal} onChange={(e) => set({ journal: e.target.checked })} /> <BookOpen size={13} /> Record in trading journal</label>}
                {(draft.journal || draft.journalId) && (
                  <textarea className="tk-in" rows={2} value={draft.journalNote} onChange={(e) => set({ journalNote: e.target.value })}
                    placeholder={draft.journalId ? 'Add your own notes to the entry (optional)' : 'Why this trade? What would prove you wrong?'} />
                )}
              </div>
            )}

            {a.warnings.map((w, i) => <div key={i} className="tk-warn"><AlertTriangle size={13} /> <span>{w}</span></div>)}
            {a.errors.map((w, i) => <div key={i} className="tk-err"><AlertCircle size={13} /> <span>{w}</span></div>)}
            {error && error.map((w, i) => <div key={'e' + i} className="tk-err"><AlertCircle size={13} /> <span>{w}</span></div>)}

            <div className="tk-actions">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className={'btn tk-go ' + sideColor} disabled={a.errors.length > 0} onClick={() => setStep('review')}>Review order</button>
            </div>
          </>
        ) : (
          <>
            <div className="tk-review">
              <div className="muted">Confirm order</div>
              {describeOrder(spec).map((l, i) => <div key={i} className="tk-line">{l}</div>)}
              <div className="tk-review-sum">
                {a.notional != null && <div><span>Est. {buy ? 'cost' : 'proceeds'}</span><b>{money(a.notional)}</b></div>}
                {a.risk != null && <div><span>Max risk at stop</span><b className="down">{money(a.risk)}</b></div>}
                {a.reward != null && <div><span>Reward at target</span><b className="up">{money(a.reward)}</b></div>}
              </div>
              <div className="muted tk-fine">Paper trading: fills are simulated from real 1-minute prices. No commissions or slippage.</div>
            </div>
            {a.warnings.map((w, i) => <div key={i} className="tk-warn"><AlertTriangle size={13} /> <span>{w}</span></div>)}
            <div className="tk-actions">
              <button className="btn" disabled={sending} onClick={() => setStep('edit')}>Back</button>
              <button className={'btn tk-go ' + sideColor} disabled={sending} onClick={send}><Check size={14} /> {sending ? 'Sending…' : 'Send order'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
