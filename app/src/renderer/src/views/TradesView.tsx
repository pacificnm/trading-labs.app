import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from '../toast'
import { formatDateTime } from '../display'
import { money, SIDE_LABEL, TYPE_LABEL, type OrderRow, type TradeSnapshot } from '../../../shared/trade'

const when = (t: number | null) => (t ? formatDateTime(t) : '')
const priceText = (o: OrderRow) =>
  o.type === 'market' ? 'MKT' : o.type === 'limit' ? `LMT ${o.limit_price!.toFixed(2)}` : o.type === 'stop' ? `STP ${o.stop_price!.toFixed(2)}`
  : o.type === 'stop_limit' ? `STP ${o.stop_price!.toFixed(2)} / LMT ${o.limit_price!.toFixed(2)}` : `TRAIL ${o.trail_unit === '%' ? o.trail_amount + '%' : '$' + o.trail_amount}`
const ROLE: Record<string, string> = { entry: 'Entry', target: 'Target', stop: 'Stop', oco_a: 'OCO', oco_b: 'OCO', single: '' }

export default function TradesView({ snap, onChanged, onSelectSymbol }: { snap: TradeSnapshot | null; onChanged: () => void; onSelectSymbol: (s: string) => void }) {
  const [tab, setTab] = useState<'positions' | 'working' | 'history' | 'fills'>('positions')
  if (!snap) return (<><div className="pane-title">Active Trades</div><div className="pane-body pad muted">Loading…</div></>)
  const working = snap.orders.filter((o) => o.status === 'working' || o.status === 'pending')
  const history = snap.orders.filter((o) => o.status !== 'working' && o.status !== 'pending')

  const cancel = async (id: number) => {
    const r = await window.api.trade.cancel(id)
    if (r.ok) toast.success('Order cancelled'); else toast.error(r.errors.join(' '), { title: 'Could not cancel' })
    onChanged()
  }
  const close = async (symbol: string) => {
    if (!window.confirm(`Close your ${symbol} position at market? This also cancels its working orders.`)) return
    const r = await window.api.trade.close(symbol)
    if (r.ok) toast.info(`Closing ${symbol} at market…`); else toast.error(r.errors.join(' '), { title: `Could not close ${symbol}` })
    onChanged()
  }
  const pl = (n: number | null) => (n == null ? '—' : <span className={n >= 0 ? 'up' : 'down'}>{n >= 0 ? '+' : '-'}{money(Math.abs(n))}</span>)

  return (
    <div className="col">
      <div className="pane-title"><span>Active Trades</span></div>
      {snap.fillBars === null && <div className="pad muted">Your FMP plan has no intraday price bars, so only market orders can be filled (while the market is open). Limit, stop, bracket and OCO orders are not available.</div>}
      {snap.fillBars && snap.fillBars.seconds > 60 && <div className="pad muted">Working orders are filled against {snap.fillBars.label} bars, because your FMP plan has no 1-minute bars. Fills are less exact than with 1-minute data.</div>}
      <div className="subtabs">
        {([['positions', `Positions (${snap.positions.length})`], ['working', `Working orders (${working.length})`], ['history', 'Order history'], ['fills', 'Fills']] as const).map(([id, l]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>
      <div className="pane-body">
        {tab === 'positions' && (snap.positions.length === 0 ? <div className="pad muted">No open positions.</div> : (
          <table className="grid">
            <thead><tr><th>Symbol</th><th>Side</th><th>Qty</th><th>Avg price</th><th>Last</th><th>Market value</th><th>P/L</th><th>P/L %</th><th></th></tr></thead>
            <tbody>{snap.positions.map((p) => (
              <tr key={p.symbol}>
                <td><a className="link" onClick={() => onSelectSymbol(p.symbol)}>{p.symbol}</a></td><td>{p.qty > 0 ? 'Long' : 'Short'}</td><td>{Math.abs(p.qty)}</td>
                <td>{p.avg.toFixed(2)}</td><td>{p.mark?.toFixed(2) ?? '—'}</td><td>{p.marketValue != null ? money(p.marketValue) : '—'}</td>
                <td>{pl(p.unrealized)}</td><td>{p.unrealizedPct != null ? <span className={p.unrealizedPct >= 0 ? 'up' : 'down'}>{p.unrealizedPct.toFixed(2)}%</span> : '—'}</td>
                <td><button className="btn small" onClick={() => close(p.symbol)}>Close</button></td>
              </tr>))}</tbody>
          </table>
        ))}
        {tab === 'working' && (working.length === 0 ? <div className="pad muted">No working orders.</div> : (
          <table className="grid">
            <thead><tr><th>Symbol</th><th>Order</th><th>Qty</th><th>Price</th><th>TIF</th><th>Status</th><th>Placed</th><th>By</th><th></th></tr></thead>
            <tbody>{working.map((o) => (
              <tr key={o.id}>
                <td><a className="link" onClick={() => onSelectSymbol(o.symbol)}>{o.symbol}</a></td>
                <td className={o.side === 'buy' || o.side === 'buy_to_cover' ? 'up' : 'down'}>{SIDE_LABEL[o.side]} {ROLE[o.role] && <span className="muted">· {ROLE[o.role]}</span>}</td>
                <td>{o.qty}</td><td>{priceText(o)}</td><td>{o.tif.toUpperCase()}</td>
                <td>{o.status === 'pending' ? <span className="muted">Waits for entry</span> : 'Working'}</td><td>{when(o.created_at)}</td><td>{o.source === 'claude' ? 'Claude ✦' : 'You'}</td>
                <td><button className="icon-btn" title="Cancel order" onClick={() => cancel(o.id)}><X size={14} /></button></td>
              </tr>))}</tbody>
          </table>
        ))}
        {tab === 'history' && (history.length === 0 ? <div className="pad muted">No completed orders yet.</div> : (
          <table className="grid">
            <thead><tr><th>Symbol</th><th>Order</th><th>Qty</th><th>Price</th><th>Status</th><th>Fill</th><th>Time</th></tr></thead>
            <tbody>{history.map((o) => (
              <tr key={o.id}><td>{o.symbol}</td><td>{SIDE_LABEL[o.side]} <span className="muted">{TYPE_LABEL[o.type]} {ROLE[o.role] && `· ${ROLE[o.role]}`}</span></td><td>{o.qty}</td><td>{priceText(o)}</td>
                <td>{o.status}{o.reason && <span className="muted"> — {o.reason}</span>}</td><td>{o.fill_price != null ? o.fill_price.toFixed(2) : ''}</td><td>{when(o.filled_at ?? o.created_at)}</td></tr>))}</tbody>
          </table>
        ))}
        {tab === 'fills' && (snap.fills.length === 0 ? <div className="pad muted">No fills yet.</div> : (
          <table className="grid">
            <thead><tr><th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th>Realized P/L</th></tr></thead>
            <tbody>{snap.fills.map((f) => (
              <tr key={f.id}><td>{when(f.time)}</td><td>{f.symbol}</td><td>{SIDE_LABEL[f.side]}</td><td>{f.qty}</td><td>{f.price.toFixed(2)}</td><td>{f.realized_pl ? pl(f.realized_pl) : ''}</td></tr>))}</tbody>
          </table>
        ))}
      </div>
    </div>
  )
}
