import { toast } from '../toast'
import { promptText } from '../dialog'
import { money, type TradeSnapshot } from '../../../shared/trade'

export default function AccountView({ snap, onReset }: { snap: TradeSnapshot | null; onReset: () => void }) {
  const a = snap?.account
  const pl = (n: number) => <span className={n >= 0 ? 'up' : 'down'}>{n >= 0 ? '+' : '-'}{money(Math.abs(n))}</span>
  const reset = async () => {
    const input = await promptText({
      title: 'Reset paper account', label: 'This deletes all positions, orders and trade history. Starting balance:', initial: String(a?.startingCash ?? 100000), okLabel: 'Reset',
      validate: (v) => (Number(v.replace(/[$,\s]/g, '')) > 0 ? null : 'Enter a positive amount.')
    })
    if (input === null) return
    const cash = Number(input.replace(/[$,\s]/g, ''))
    await window.api.trade.reset(cash)
    toast.success(`Paper account reset to ${money(cash)}`)
    onReset()
  }
  return (
    <>
      <div className="pane-title">Account</div>
      <div className="pane-body pad">
        {!a ? <span className="muted">Loading…</span> : (
          <>
            <div className="cards">
              <div className="card"><div className="muted">Net liquidation (equity)</div><div className="big">{money(a.equity)}</div></div>
              <div className="card"><div className="muted">Buying power</div><div className="big">{money(a.buyingPower)}</div></div>
              <div className="card"><div className="muted">Cash</div><div className="big">{money(a.cash)}</div></div>
              <div className="card"><div className="muted">Open P/L</div><div className="big">{pl(a.unrealizedPl)}</div></div>
              <div className="card"><div className="muted">Realized P/L</div><div className="big">{pl(a.realizedPl)}</div></div>
              <div className="card"><div className="muted">Total return</div><div className={'big ' + (a.totalReturnPct >= 0 ? 'up' : 'down')}>{a.totalReturnPct >= 0 ? '+' : ''}{a.totalReturnPct.toFixed(2)}%</div></div>
            </div>
            <p className="muted" style={{ maxWidth: 640 }}>Paper account started with {money(a.startingCash)}. Buying power uses 2:1 margin (equity × 2 minus the market value of your positions). Fills are simulated from real 1-minute prices with no commissions or slippage.</p>
            <button className="btn" onClick={reset}>Reset account…</button>
          </>
        )}
      </div>
    </>
  )
}
