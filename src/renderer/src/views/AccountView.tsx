import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, FlaskConical, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from '../toast'
import { promptText } from '../dialog'
import { money, type TradeSnapshot } from '../../../shared/trade'
import { ACCOUNT_TYPE_LABEL, BROKERS, type AccountInfo, type AccountType, type Transfer } from '../../../shared/accounts'

const parseMoney = (v: string) => Number(v.replace(/[$,\s]/g, ''))
const when = (t: number) => new Date(t * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

interface Form { name: string; broker: string; url: string; type: AccountType; balance: string }

function Fields({ f, onChange, withBalance }: { f: Form; onChange: (f: Form) => void; withBalance: boolean }) {
  const set = (p: Partial<Form>) => onChange({ ...f, ...p })
  return (
    <div className="jr-grid2">
      <label className="wide">Account name<input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Schwab IRA (paper)" /></label>
      <label>Account type<select value={f.type} onChange={(e) => set({ type: e.target.value as AccountType })}>{(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>)}</select></label>
      <label>Brokerage<input list="brokers" value={f.broker} onChange={(e) => set({ broker: e.target.value })} placeholder="e.g. Charles Schwab" /></label>
      <label>Link to the real account<input value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" /></label>
      {withBalance && <label>Starting balance<input value={f.balance} onChange={(e) => set({ balance: e.target.value })} placeholder="25000" /></label>}
      <datalist id="brokers">{BROKERS.map((b) => <option key={b} value={b} />)}</datalist>
    </div>
  )
}

export default function AccountView({ snap, onReset }: { snap: TradeSnapshot | null; onReset: () => void }) {
  const a = snap?.account
  const [list, setList] = useState<AccountInfo[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [creating, setCreating] = useState<Form | null>(null)
  const [form, setForm] = useState<Form>({ name: '', broker: '', url: '', type: 'margin', balance: '' })
  const [balance, setBalance] = useState('')

  const load = useCallback(() => { window.api.accounts.list(true).then((r) => setList(r.list)) }, [])
  useEffect(load, [load, snap?.at, a?.id])
  useEffect(() => { if (a) { setForm({ name: a.name, broker: a.broker, url: a.url, type: a.type, balance: '' }); setBalance(String(Math.round(a.cash * 100) / 100)); window.api.accounts.transfers(a.id).then(setTransfers) } }, [a?.id, a?.name, a?.broker, a?.url, a?.type, a?.cash])

  const pl = (n: number) => <span className={n >= 0 ? 'up' : 'down'}>{n >= 0 ? '+' : '-'}{money(Math.abs(n))}</span>
  const done = (r: { ok: boolean; error?: string }, msg: string) => { if (r.ok) toast.success(msg); else toast.error(r.error ?? 'That did not work.'); onReset(); load(); return r.ok }

  const switchTo = async (id: number) => { if (id === a?.id) return; setCreating(null); const r = await window.api.accounts.setActive(id); if (r.ok) toast.info(`Now trading ${list.find((x) => x.id === id)?.name ?? 'the account'}`); onReset() }
  const create = async () => {
    if (!creating) return
    const bal = parseMoney(creating.balance)
    if (!Number.isFinite(bal) || bal < 0) { toast.error('Enter the starting balance as a number, for example 25000.'); return }
    const r = await window.api.accounts.create({ name: creating.name, broker: creating.broker, url: creating.url, type: creating.type }, bal)
    if (done(r, `Created ${creating.name.trim()}`) && r.ok) { await window.api.accounts.setActive(r.data.id); setCreating(null); onReset() }
  }
  const saveDetails = async () => { if (a) done(await window.api.accounts.update(a.id, { name: form.name, broker: form.broker, url: form.url, type: form.type }), 'Account details saved') }
  const saveBalance = async () => {
    if (!a) return
    const v = parseMoney(balance)
    if (!Number.isFinite(v) || v < 0) { toast.error('Enter the cash balance as a number, for example 25000.'); return }
    done(await window.api.accounts.setBalance(a.id, v, 'Balance set to match the real account'), `Cash balance set to ${money(v)}`)
  }
  const reset = async () => {
    if (!a) return
    const input = await promptText({
      title: `Reset ${a.name}`, label: 'This deletes this account\'s positions, orders, trade history and balance changes. Other accounts are not touched. Starting balance:', initial: String(a.startingCash), okLabel: 'Reset',
      validate: (v) => (parseMoney(v) > 0 ? null : 'Enter a positive amount.')
    })
    if (input === null) return
    const cash = parseMoney(input)
    await window.api.trade.reset(cash)
    toast.success(`${a.name} reset to ${money(cash)}`)
    onReset()
  }
  const remove = async () => {
    if (!a || !window.confirm(`Delete “${a.name}”? Its positions, orders and history are deleted too. This cannot be undone.`)) return
    done(await window.api.accounts.remove(a.id), `Deleted ${a.name}`)
  }

  return (
    <div className="col">
      <div className="pane-title"><span>Accounts</span><span className="spacer" />
        <button className="btn small" onClick={() => setCreating({ name: '', broker: '', url: '', type: 'margin', balance: '100000' })}><Plus size={12} /> New account</button></div>
      <div className="jr">
        <div className="jr-list st-list">
          <div className="jr-rows">
            {list.map((x) => (
              <div key={x.id} className={'jr-row' + (!creating && x.id === a?.id ? ' sel' : '')} onClick={() => switchTo(x.id)}>
                <div className="jr-r1"><FlaskConical size={12} className="muted" /><b className="st-title">{x.name}</b></div>
                <div className="jr-r3 muted"><span>{x.broker || 'No brokerage set'}</span>{x.equity != null && <span>· {money(x.equity)}</span>}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="jr-pane">
          {creating ? (
            <div className="jr-detail st-detail">
              <h2 className="st-h">New paper account</h2>
              <p className="muted">Set this up to mirror one of your real accounts. It only ever holds simulated money.</p>
              <Fields f={creating} onChange={setCreating} withBalance />
              <div className="st-actions"><button className="btn primary" disabled={!creating.name.trim()} onClick={create}>Create account</button><button className="btn" onClick={() => setCreating(null)}>Cancel</button></div>
            </div>
          ) : !a ? <div className="pad muted">Loading…</div> : (
            <div className="jr-detail st-detail">
              <h2 className="st-h">{a.name}</h2>
              <div className="st-meta"><span className="jr-badge idea"><FlaskConical size={11} /> paper account</span><span className="muted">{a.broker ? `Mirrors a ${a.broker} account` : 'No brokerage set'}</span>
                {a.url && <button className="btn small" onClick={() => window.api.openExternal(a.url)}><ExternalLink size={12} /> Open {a.broker || 'account'}</button>}</div>
              <div className="cards">
                <div className="card"><div className="muted">Net liquidation (equity)</div><div className="big">{money(a.equity)}</div></div>
                <div className="card"><div className="muted">Buying power available</div><div className="big">{money(a.buyingPower)}</div></div>
                <div className="card"><div className="muted">Cash</div><div className="big">{money(a.cash)}</div></div>
                <div className="card"><div className="muted">Open P/L</div><div className="big">{pl(a.unrealizedPl)}</div></div>
                <div className="card"><div className="muted">Realized P/L</div><div className="big">{pl(a.realizedPl)}</div></div>
                <div className="card"><div className="muted">Total return</div><div className={'big ' + (a.totalReturnPct >= 0 ? 'up' : 'down')}>{a.totalReturnPct >= 0 ? '+' : ''}{a.totalReturnPct.toFixed(2)}%</div></div>
              </div>
              <p className="muted" style={{ maxWidth: 640 }}>Started with {money(a.startingCash)} (including any deposits or withdrawals below). {a.type === 'cash' ? 'This is a cash account: buying power is your cash, less the cost of orders still waiting to fill, and short selling is not allowed.' : 'This is a margin account: buying power is 2:1 (equity × 2 minus the market value of your positions), less the cost of orders still waiting to fill.'}{a.reserved > 0 ? ` ${money(a.reserved)} is set aside for working orders right now.` : ''} Fills are simulated from real 1-minute prices with no commissions or slippage. New orders go to this account; working orders in your other accounts keep filling.</p>

              <section className="jr-sec"><h4>Account details</h4>
                <Fields f={form} onChange={setForm} withBalance={false} />
                <button className="btn" disabled={!form.name.trim()} onClick={saveDetails}>Save details</button></section>

              <section className="jr-sec"><h4>Match my real balance</h4>
                <div className="jr-add"><input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Cash balance" style={{ maxWidth: 200 }} /><button className="btn" onClick={saveBalance}>Set cash balance</button></div>
                <p className="muted" style={{ maxWidth: 640 }}>Sets this account's cash to the number you enter. The difference is recorded as a deposit or withdrawal, so total return keeps measuring your trading, not money you added or took out. Positions are not changed.</p>
                {transfers.length > 0 && <div className="est-table-wrap"><table className="est-table"><tbody>{transfers.map((t) => <tr key={t.id}><td className="muted">{when(t.time)}</td><td>{t.amount >= 0 ? 'Deposit' : 'Withdrawal'}</td><td style={{ textAlign: 'right' }}>{pl(t.amount)}</td></tr>)}</tbody></table></div>}
              </section>

              <div className="st-actions">
                <button className="btn" onClick={reset}><RotateCcw size={13} /> Reset account…</button>
                <button className="btn" disabled={list.length < 2} title={list.length < 2 ? 'You need at least one account' : ''} onClick={remove}><Trash2 size={13} /> Delete account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
