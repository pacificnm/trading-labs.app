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

export default function StatusBar({ symbol, account, equity, buyingPower, openTrades, live, display, onOpenSettings, onOpenAccount }: { symbol: string; account: { name: string; broker: string } | null; equity: number | null; buyingPower: number | null; openTrades: number; live: boolean; display: DisplaySettings; onOpenSettings: () => void; onOpenAccount: () => void }) {
  return (
    <footer className="statusbar">
      <button className="clock-btn" onClick={onOpenAccount} title="The active paper account. Click to open the Account screen, where you can switch accounts or edit this one."><FlaskConical size={13} /> {account ? `${account.name}${account.broker ? ` · ${account.broker}` : ''}${/paper/i.test(account.name) ? '' : ' (paper)'}` : 'Paper account'}</button>
      <span title="Net liquidation value"><Wallet size={13} /> {equity != null ? usd(equity) : '—'}</span>
      <span title="Buying power available (after working orders)">BP {buyingPower != null ? usd(buyingPower) : '—'}</span>
      <span><ArrowLeftRight size={13} /> {openTrades} working order{openTrades === 1 ? '' : 's'}</span>
      <span className="spacer" />
      <MarketClock display={display} onClick={onOpenSettings} />
      <span>{symbol}</span>
      <span>{live ? <Wifi size={13} /> : <WifiOff size={13} />} {live ? 'Market data: FMP' : 'Market data: sample (no FMP key)'}</span>
    </footer>
  )
}
