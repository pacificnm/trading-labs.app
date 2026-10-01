import ScreenFrame, { KV } from '../components/ScreenFrame'
import type { SymbolView } from '../components/SymbolTabs'
import { sampleFundamentals } from '../data/sample'
import { compact, money } from '../format'
import { dash, pick, pickStr, unwrap, useAsync } from '../data/fmp'
import type { Rec } from '../../../shared/fmp'

interface Year { year: string; revenue: number | null; gross: number | null; operating: number | null; net: number | null; eps: number | null; fcf: number | null }
interface View { valuation: Record<string, string>; profitability: Record<string, string>; balance: Record<string, string>; years: Year[] }

const x2 = (n: number) => n.toFixed(2)
const x1 = (n: number) => n.toFixed(1)
const pc = (n: number) => `${(n * 100).toFixed(1)}%` // FMP ratios are fractions (0.466 is 46.6%), including ones above 100% such as ROE

function build(f: { ratios: Rec | null; metrics: Rec | null; income: Rec[]; balance: Rec[]; cashflow: Rec[] }): View {
  const r = f.ratios, m = f.metrics, b = f.balance[0] ?? null
  return {
    valuation: {
      'Market cap': dash(pick(m, 'marketCap'), compact),
      'P/E (TTM)': dash(pick(r, 'priceToEarningsRatioTTM', 'peRatioTTM'), x1),
      'P/S': dash(pick(r, 'priceToSalesRatioTTM'), x1),
      'P/B': dash(pick(r, 'priceToBookRatioTTM'), x1),
      'EV/EBITDA': dash(pick(m, 'evToEBITDATTM', 'enterpriseValueOverEBITDATTM'), x1),
      'PEG': dash(pick(r, 'priceToEarningsGrowthRatioTTM', 'pegRatioTTM'), x2)
    },
    profitability: {
      'Gross margin': dash(pick(r, 'grossProfitMarginTTM'), pc),
      'Operating margin': dash(pick(r, 'operatingProfitMarginTTM'), pc),
      'Net margin': dash(pick(r, 'netProfitMarginTTM'), pc),
      ROE: dash(pick(m, 'returnOnEquityTTM'), pc),
      ROA: dash(pick(m, 'returnOnAssetsTTM'), pc)
    },
    balance: {
      Cash: dash(pick(b, 'cashAndCashEquivalents', 'cashAndShortTermInvestments'), compact),
      'Total debt': dash(pick(b, 'totalDebt'), compact),
      'Debt / equity': dash(pick(r, 'debtToEquityRatioTTM', 'debtEquityRatioTTM'), x2),
      'Current ratio': dash(pick(r, 'currentRatioTTM'), x2),
      'Total equity': dash(pick(b, 'totalStockholdersEquity', 'totalEquity'), compact)
    },
    years: f.income.map((i) => {
      const date = pickStr(i, 'date')
      const cf = f.cashflow.find((c) => pickStr(c, 'date') === date) ?? null
      return { year: pickStr(i, 'fiscalYear', 'calendarYear') || date.slice(0, 4), revenue: pick(i, 'revenue'), gross: pick(i, 'grossProfit'), operating: pick(i, 'operatingIncome'), net: pick(i, 'netIncome'), eps: pick(i, 'epsDiluted', 'epsdiluted', 'eps'), fcf: pick(cf, 'freeCashFlow') }
    })
  }
}

export default function FundamentalsView({ symbol, onNavigate, live }: { symbol: string; onNavigate: (v: SymbolView) => void; live: boolean }) {
  const { data, error, loading, reload } = useAsync<View>(async () => build(unwrap(await window.api.fmp.fundamentals(symbol))), [symbol], live)
  let v: View | null = data
  if (!live) {
    const s = sampleFundamentals(symbol)
    v = { valuation: s.valuation, profitability: s.profitability, balance: s.balance,
      years: s.years.map((y) => ({ year: String(y.year), revenue: y.revenue, gross: y.gross, operating: y.operating, net: y.net, eps: y.eps, fcf: y.fcf })) }
  }
  return (
    <ScreenFrame title="Fundamentals" symbol={symbol} view="fundamentals" onNavigate={onNavigate} sample={!live} loading={live && loading && !v} error={error} onRetry={reload}>
      {v && (
        <>
          <h3>Valuation</h3><KV data={v.valuation} />
          <h3>Profitability</h3><KV data={v.profitability} />
          <h3>Balance sheet</h3><KV data={v.balance} />
          <h3>Annual results</h3>
          {v.years.length === 0 ? <div className="muted">No statements available.</div> : (
            <table className="grid">
              <thead><tr><th>Year</th><th>Revenue</th><th>Gross profit</th><th>Operating income</th><th>Net income</th><th>EPS</th><th>Free cash flow</th></tr></thead>
              <tbody>{v.years.map((y) => (
                <tr key={y.year}><td>{y.year}</td><td>{dash(y.revenue, compact)}</td><td>{dash(y.gross, compact)}</td><td>{dash(y.operating, compact)}</td><td>{dash(y.net, compact)}</td><td>{dash(y.eps, money)}</td><td>{dash(y.fcf, compact)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </>
      )}
    </ScreenFrame>
  )
}
