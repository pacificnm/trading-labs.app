import type { CongressTrade, Rec } from './fmp'

/** FMP's Senate and House disclosure rows share one shape. Note the House rows also use the field name `senateID`. */
export function normalizeTrade(chamber: 'senate' | 'house', r: Rec): CongressTrade {
  const str = (k: string) => (r[k] == null ? '' : String(r[k]))
  return {
    chamber, memberId: str('senateID'), member: str('office') || `${str('firstName')} ${str('lastName')}`.trim(), district: str('district'), owner: str('owner'),
    symbol: str('symbol'), asset: str('assetDescription'), assetType: str('assetType'), type: str('type'), amount: str('amount'),
    disclosed: str('disclosureDate').slice(0, 10), traded: str('transactionDate').slice(0, 10), link: str('link')
  }
}
