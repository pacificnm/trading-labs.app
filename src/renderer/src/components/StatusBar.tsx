import { Wallet, ArrowLeftRight, Wifi, WifiOff, FlaskConical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatClock, resolveTz, tzAbbr, type DisplaySettings } from '../display'
import { isMarketOpen } from '../../../shared/nytime'
import { usd } from '../format'

/** Market open/closed plus the current time in the user's chosen zone. Click to change the zone. */
function MarketClock({ display, onClick }: { display: DisplaySettings; onClick: () => void }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t) }, [])
  const open = isMarketOpen(now)
  return (
    <button className="clock-btn" onClick={onClick} title="US market hours are 9:30–16:00 New York time (holidays are not tracked). Click to change the time zone.">
      <i className={'dot ' + (open ? 'open' : 'closed')} /> {open ? 'Market open' : 'Market closed'} · {formatClock(now, display, true)} {tzAbbr(resolveTz(display), now)}
    </button>
  )
}

export default function StatusBar({ symbol, equity, buyingPower, openTrades, live, display, onOpenSettings }: { symbol: string; equity: number | null; buyingPower: number | null; openTrades: number; live: boolean; display: DisplaySettings; onOpenSettings: () => void }) {
  return (
    <footer className="statusbar">
      <span><FlaskConical size={13} /> Paper account</span>
      <span title="Net liquidation value"><Wallet size={13} /> {equity != null ? usd(equity) : '—'}</span>
      <span title="Buying power">BP {buyingPower != null ? usd(buyingPower) : '—'}</span>
      <span><ArrowLeftRight size={13} /> {openTrades} working order{openTrades === 1 ? '' : 's'}</span>
      <span className="spacer" />
      <MarketClock display={display} onClick={onOpenSettings} />
      <span>{symbol}</span>
      <span>{live ? <Wifi size={13} /> : <WifiOff size={13} />} {live ? 'Market data: FMP' : 'Market data: sample (no FMP key)'}</span>
    </footer>
  )
}
