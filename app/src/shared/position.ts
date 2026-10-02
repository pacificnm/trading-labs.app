// Position sizing and risk/reward math, shared by the Calculator screen and Claude's tools.
export type CalcSide = 'long' | 'short'

/** The user's standing limits. */
export interface Rules {
  /** max % of the account to lose if the stop is hit */
  maxRiskPct: number
  /** max % of the account in one position */
  maxPositionPct: number
  /** max total ever invested across all positions: a % of the account or a fixed dollar amount */
  maxTotalMode: 'percent' | 'dollars'
  maxTotalPct: number
  maxTotalDollars: number
}
export const DEFAULT_RULES: Rules = { maxRiskPct: 1, maxPositionPct: 25, maxTotalMode: 'percent', maxTotalPct: 80, maxTotalDollars: 50000 }

export type StopSpec = { mode: 'price'; price: number } | { mode: 'percent'; pct: number } | { mode: 'atr'; mult: number }
export type TargetSpec = { mode: 'price'; price: number } | { mode: 'percent'; pct: number } | { mode: 'r'; r: number }
export type RiskSpec = { mode: 'percent'; pct: number } | { mode: 'dollars'; dollars: number }

export interface CalcInput {
  side: CalcSide
  entry: number
  stop: StopSpec
  target: TargetSpec | null
  risk: RiskSpec
  account: number
  /** null when unknown (a custom account size) */
  buyingPower: number | null
  /** market value already invested */
  investedNow: number
  atr: number | null
  /** 0..1 */
  winRate: number | null
  /** total commissions for the round trip, in dollars */
  commission: number
}

export type Binding = 'risk' | 'position' | 'total' | 'buyingPower'
export interface CalcResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  entry: number
  stop: number | null
  target: number | null
  riskPerShare: number | null
  shares: number
  /** which limit produced the final share count */
  binding: Binding | null
  limits: { byRisk: number; byPosition: number; byTotal: number; byBuyingPower: number | null }
  positionValue: number
  pctOfAccount: number
  /** dollars lost if the stop is hit (including commission) */
  risk: number
  riskPct: number
  riskBudget: number
  riskBudgetRequested: number
  reward: number | null
  rr: number | null
  breakEvenWinRate: number | null
  ev: number | null
  evR: number | null
  stopPct: number | null
  stopAtr: number | null
  maxPositionDollars: number
  maxTotalDollars: number
  remainingTotalDollars: number
  whatIf: { riskPct: number; shares: number; value: number; risk: number }[]
  scenarios: { label: string; price: number; pl: number }[]
}

const fin = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

export function calculate(input: CalcInput, rules: Rules): CalcResult {
  const errors: string[] = [], warnings: string[] = []
  const { side, entry, account } = input
  const long = side === 'long'
  const sgn = long ? 1 : -1

  if (!(entry > 0)) errors.push('Enter an entry price above zero.')
  if (!(account > 0)) errors.push('Enter an account size above zero.')

  // stop
  let stop: number | null = null
  const st = input.stop
  if (st.mode === 'price') stop = fin(st.price) && st.price > 0 ? st.price : null
  else if (st.mode === 'percent') stop = fin(st.pct) && st.pct > 0 ? entry * (1 - (sgn * st.pct) / 100) : null
  else if (input.atr == null) errors.push('ATR is not available for this symbol, so an ATR-based stop cannot be computed.')
  else stop = fin(st.mult) && st.mult > 0 ? entry - sgn * st.mult * input.atr : null
  if (stop == null && !errors.some((e) => e.includes('ATR'))) errors.push('Enter a stop.')
  if (stop != null && (long ? stop >= entry : stop <= entry)) errors.push(`For a ${side} trade the stop must be ${long ? 'below' : 'above'} the entry (${entry.toFixed(2)}).`)
  if (stop != null && stop <= 0) errors.push('The stop works out to a price at or below zero; use a tighter stop.')

  // target
  let target: number | null = null
  const tg = input.target
  const riskPerShare = stop != null && stop > 0 ? Math.abs(entry - stop) : null
  if (tg) {
    if (tg.mode === 'price') target = fin(tg.price) && tg.price > 0 ? tg.price : null
    else if (tg.mode === 'percent') target = fin(tg.pct) && tg.pct > 0 ? entry * (1 + (sgn * tg.pct) / 100) : null
    else if (riskPerShare != null) target = fin(tg.r) && tg.r > 0 ? entry + sgn * tg.r * riskPerShare : null
    if (target != null && (long ? target <= entry : target >= entry)) errors.push(`For a ${side} trade the target must be ${long ? 'above' : 'below'} the entry.`)
  }

  const maxPositionDollars = (account * rules.maxPositionPct) / 100
  const maxTotalDollars = rules.maxTotalMode === 'percent' ? (account * rules.maxTotalPct) / 100 : rules.maxTotalDollars
  const remainingTotalDollars = Math.max(0, maxTotalDollars - input.investedNow)

  const requested = input.risk.mode === 'percent' ? (account * input.risk.pct) / 100 : input.risk.dollars
  const ruleCap = (account * rules.maxRiskPct) / 100
  if (!fin(requested) || requested <= 0) errors.push('Enter how much you are willing to risk.')
  const riskBudget = Math.min(fin(requested) && requested > 0 ? requested : 0, ruleCap)
  if (fin(requested) && requested > ruleCap + 1e-9) warnings.push(`You asked to risk $${requested.toFixed(0)}, above your rule of ${rules.maxRiskPct}% of the account ($${ruleCap.toFixed(0)}). The size below uses your rule.`)

  const sharesFor = (budget: number) => {
    if (riskPerShare == null || riskPerShare <= 0) return { byRisk: 0, byPosition: 0, byTotal: 0, byBuyingPower: null as number | null, shares: 0, binding: null as Binding | null }
    const byRisk = Math.floor(Math.max(0, budget - input.commission) / riskPerShare)
    const byPosition = Math.floor(maxPositionDollars / entry)
    const byTotal = Math.floor(remainingTotalDollars / entry)
    const byBuyingPower = input.buyingPower != null ? Math.floor(Math.max(0, input.buyingPower) / entry) : null
    const all: [Binding, number][] = [['risk', byRisk], ['position', byPosition], ['total', byTotal], ...(byBuyingPower != null ? [['buyingPower', byBuyingPower] as [Binding, number]] : [])]
    const shares = Math.min(...all.map(([, n]) => n))
    return { byRisk, byPosition, byTotal, byBuyingPower, shares, binding: all.find(([, n]) => n === shares)![0] }
  }

  const main = errors.length ? sharesFor(0) : sharesFor(riskBudget)
  const shares = errors.length ? 0 : main.shares
  const positionValue = shares * entry
  const risk = riskPerShare != null && shares > 0 ? shares * riskPerShare + input.commission : 0
  const reward = target != null && shares > 0 ? shares * Math.abs(target - entry) - input.commission : null
  const rr = reward != null && risk > 0 ? reward / risk : null
  const breakEven = rr != null ? 1 / (1 + rr) : null
  const p = input.winRate
  const ev = reward != null && p != null && risk > 0 ? p * reward - (1 - p) * risk : null
  const evR = rr != null && p != null ? p * rr - (1 - p) : null
  const stopPct = riskPerShare != null ? (riskPerShare / entry) * 100 : null
  const stopAtr = riskPerShare != null && input.atr ? riskPerShare / input.atr : null

  if (!errors.length) {
    if (shares === 0) warnings.push('Even one share would break a limit (risk, position size, total invested or buying power). Tighten the stop or raise a limit.')
    else if (main.binding && main.binding !== 'risk') {
      const why = { position: `your max position size (${rules.maxPositionPct}% of the account)`, total: `your max total invested (only $${remainingTotalDollars.toFixed(0)} of room left)`, buyingPower: 'your buying power' }[main.binding]
      warnings.push(`Size is limited by ${why}, not by risk. Real risk is $${risk.toFixed(0)}, less than the $${riskBudget.toFixed(0)} you budgeted.`)
    }
    if (stopAtr != null && stopAtr < 1) warnings.push(`The stop is only ${stopAtr.toFixed(1)} ATR away, inside normal daily movement, so noise may stop you out.`)
    if (stopAtr != null && stopAtr > 4) warnings.push(`The stop is ${stopAtr.toFixed(1)} ATR away. That is a wide stop, so the position will be small for your risk.`)
    if (rr != null && rr < 1) warnings.push(`Reward is smaller than risk (${rr.toFixed(2)} : 1). You would need to win more than ${(breakEven! * 100).toFixed(0)}% of the time to break even.`)
    else if (rr != null && rr < 1.5) warnings.push(`Reward:risk of ${rr.toFixed(2)} : 1 is thin; costs and slippage eat a large share of it.`)
    if (account > 0 && positionValue / account > 0.5) warnings.push(`This position would be ${((positionValue / account) * 100).toFixed(0)}% of the account. That is heavily concentrated.`)
    if (ev != null && ev < 0) warnings.push(`At a ${(p! * 100).toFixed(0)}% win rate the expected value is negative (${ev.toFixed(0)} dollars per trade).`)
  }

  const whatIf = [0.25, 0.5, 1, 2].map((rp) => {
    const s = errors.length ? 0 : sharesFor(Math.min((account * rp) / 100, ruleCap)).shares
    return { riskPct: rp, shares: s, value: s * entry, risk: riskPerShare != null && s > 0 ? s * riskPerShare + input.commission : 0 }
  })
  const scenarios = [-10, -5, -2, 2, 5, 10].map((mv) => {
    const price = entry * (1 + mv / 100)
    return { label: `${mv > 0 ? '+' : ''}${mv}%`, price, pl: shares * (price - entry) * sgn - (shares > 0 ? input.commission : 0) }
  })

  return {
    ok: errors.length === 0, errors, warnings, entry, stop, target, riskPerShare, shares, binding: shares > 0 || !errors.length ? main.binding : null,
    limits: { byRisk: main.byRisk, byPosition: main.byPosition, byTotal: main.byTotal, byBuyingPower: main.byBuyingPower },
    positionValue, pctOfAccount: account > 0 ? (positionValue / account) * 100 : 0, risk, riskPct: account > 0 ? (risk / account) * 100 : 0, riskBudget, riskBudgetRequested: fin(requested) ? requested : 0,
    reward, rr, breakEvenWinRate: breakEven, ev, evR, stopPct, stopAtr, maxPositionDollars, maxTotalDollars, remainingTotalDollars, whatIf, scenarios
  }
}
