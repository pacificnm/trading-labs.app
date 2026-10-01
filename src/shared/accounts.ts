// Paper accounts: each one mirrors a real-world account (name, brokerage, link, balance) but only ever holds simulated money.
/** cash: you can only spend the cash you have and cannot short. margin: Reg T style 2:1 leverage, shorting allowed. */
export type AccountType = 'cash' | 'margin'
export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = { cash: 'Cash (no margin, no short)', margin: 'Margin (2:1, can short)' }
export const MARGIN_MULTIPLE = 2

/** Buying power before working orders are set aside. `gross` is the combined market value of all long and short positions. */
export function buyingPowerFor(type: AccountType, equity: number, cash: number, gross: number): number {
  return Math.max(0, type === 'cash' ? cash : MARGIN_MULTIPLE * equity - gross)
}

export interface AccountInfo {
  id: number
  name: string
  type: AccountType
  broker: string
  /** link to the real account's page, opened in the user's browser */
  url: string
  cash: number
  startingCash: number
  createdAt: number
  /** net liquidation value; only filled in when asked for (it needs live prices) */
  equity?: number
}
export interface AccountInput { name: string; broker: string; url: string; type: AccountType }
export interface Transfer { id: number; time: number; amount: number; note: string }

export const BROKERS = ['Charles Schwab', 'Fidelity', 'Interactive Brokers', 'Robinhood', 'E*TRADE', 'Webull', 'Vanguard', 'Tastytrade', 'Merrill', 'Ally Invest', 'Public', 'Firstrade']

/** Returns an error message, or null when the input is acceptable. The link must be a web URL, since it is opened in the browser. */
export function checkAccountInput(i: Partial<AccountInput>): string | null {
  if (i.name !== undefined && (!i.name.trim() || i.name.trim().length > 60)) return 'Give the account a name (60 characters or fewer).'
  if (i.type !== undefined && i.type !== 'cash' && i.type !== 'margin') return 'The account type must be cash or margin.'
  if (i.broker !== undefined && i.broker.trim().length > 60) return 'The brokerage name is too long.'
  if (i.url !== undefined && i.url.trim()) {
    try { const u = new URL(i.url.trim()); if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'The link must start with https://' } catch { return 'The link is not a valid web address.' }
  }
  return null
}
