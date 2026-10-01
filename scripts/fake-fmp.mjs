// Stand-in market data server for screenshots and tests: node scripts/fake-fmp.mjs
// then run the app with FMP_API_KEY=demo FMP_BASE_URL=http://localhost:8787/stable. Prices are made up (AAPL ends at 184.30).
import http from 'node:http'
const PORT = 8787
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const END = 184.3
const ds = (d) => d.toISOString().slice(0, 10)
function daily(from, to) {
  const out = []; let p = 150
  const start = new Date(from + 'T00:00:00Z'), end = new Date(to + 'T00:00:00Z')
  const days = []
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) if (![0, 6].includes(d.getUTCDay())) days.push(new Date(d))
  const drift = (END - p) / Math.max(1, days.length)
  for (const d of days) { const o = p; p = Math.max(20, p + drift + (rnd() - 0.5) * 3); const h = Math.max(o, p) + rnd() * 1.2, l = Math.min(o, p) - rnd() * 1.2
    out.push({ date: ds(d), open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +p.toFixed(2), volume: Math.floor(30e6 + rnd() * 30e6) }) }
  const k = END / out[out.length - 1].close
  for (const b of out) for (const f of ['open','high','low','close']) b[f] = +(b[f] * k).toFixed(2)
  return out.reverse()
}
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const path = u.pathname.replace(/^\/stable\//, '').replace(/^\//, '')
  const q = Object.fromEntries(u.searchParams); let body = []
  if (path === 'quote') { const idx = { '^GSPC': 5850.2, '^DJI': 42310.5, '^IXIC': 18420.7, '^RUT': 2210.9, '^VIX': 15.62, '^FTSE': 8290.4, '^GDAXI': 19040.1, '^N225': 38450.6 }; const hh = [...String(q.symbol)].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 997, 7); const pr = idx[q.symbol] ?? (q.symbol === 'AAPL' ? END : +(60 + (hh % 340) + 0.45).toFixed(2)); body = [{ symbol: q.symbol, name: q.symbol === 'AAPL' ? 'Apple Inc.' : q.symbol, exchange: 'NASDAQ', price: pr, change: +(pr * (q.symbol === 'AAPL' ? 0.0066 : ((hh % 41) - 17) / 1000)).toFixed(2), changePercentage: q.symbol === 'AAPL' ? 0.66 : +(((hh % 41) - 17) / 10).toFixed(2), volume: 41e6, previousClose: +(pr * 0.9934).toFixed(2), open: +(pr * 0.996).toFixed(2), dayLow: +(pr * 0.991).toFixed(2), dayHigh: +(pr * 1.004).toFixed(2), yearLow: +(pr * 0.68).toFixed(2), yearHigh: +(pr * 1.06).toFixed(2), avgVolume: 52e6, marketCap: 2.85e12, pe: 29.4, eps: 6.27 }] }
  else if (path === 'profile') body = [{ symbol: q.symbol, companyName: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics', beta: 1.24, lastDividend: 1.0, marketCap: 2.85e12 }]
  else if (path === 'quote-short') body = [{ symbol: q.symbol, price: END, change: 1.2, volume: 41e6 }]
  else if (path === 'aftermarket-trade') body = [{ symbol: q.symbol, price: 184.41, tradeSize: 200, timestamp: Date.now() - 600000 }]
  else if (path === 'aftermarket-quote') body = [{ symbol: q.symbol, bidPrice: 184.38, bidSize: 3, askPrice: 184.44, askSize: 5, volume: 1.2e6, timestamp: Date.now() - 300000 }]
  else if (path === 'stock-price-change') body = [{ symbol: q.symbol, '1D': 0.66, '5D': 1.9, '1M': 3.4, '3M': 8.1, '6M': 14.6, ytd: 11.2, '1Y': 21.7, '3Y': 48.3, '5Y': 132.5, '10Y': 645.0, max: 112000 }]
  else if (path === 'grades-consensus') body = [{ symbol: q.symbol, strongBuy: 14, buy: 21, hold: 12, sell: 2, strongSell: 1, consensus: 'Buy' }]
  else if (path === 'price-target-consensus') body = [{ symbol: q.symbol, targetHigh: 250, targetLow: 160, targetConsensus: 205.4, targetMedian: 208 }]
  else if (path === 'price-target-summary') body = [{ symbol: q.symbol, lastMonthCount: 8, lastMonthAvgPriceTarget: 210.5, lastQuarterCount: 24, lastQuarterAvgPriceTarget: 206.2, lastYearCount: 52, lastYearAvgPriceTarget: 196.8, allTimeCount: 310, allTimeAvgPriceTarget: 158.3, publishers: JSON.stringify(["Benzinga", "TipRanks", "StreetInsider"]) }]
  else if (path === 'ratings-snapshot') body = [{ symbol: q.symbol, rating: 'B', overallScore: 4, discountedCashFlowScore: 3, returnOnEquityScore: 5, returnOnAssetsScore: 4, debtToEquityScore: 1, priceToEarningsScore: 2, priceToBookScore: 1 }]
  else if (path === 'ratings-historical') { const L = ['C', 'B', 'B', 'A', 'B']; const sc = { A: 5, B: 4, C: 3 }; body = Array.from({ length: 260 }, (_, i) => { const d = new Date(Date.now() - i * 86400000); const l = L[Math.min(4, Math.floor((259 - i) / 52))]; return { symbol: q.symbol, date: ds(d), rating: l, overallScore: sc[l] } }) }
  else if (path === 'grades') body = [['Morgan Stanley', 'maintain', 'Overweight', 'Overweight', 2], ['Goldman Sachs', 'upgrade', 'Neutral', 'Buy', 5], ['Barclays', 'maintain', 'Equal Weight', 'Equal Weight', 9], ['JPMorgan', 'maintain', 'Overweight', 'Overweight', 14], ['Wedbush', 'maintain', 'Outperform', 'Outperform', 20], ['UBS', 'downgrade', 'Buy', 'Neutral', 27], ['Citigroup', 'maintain', 'Buy', 'Buy', 33], ['Bank of America', 'upgrade', 'Neutral', 'Buy', 41]].map(([g, a, p, n, ago]) => ({ symbol: q.symbol, date: ds(new Date(Date.now() - ago * 86400000)), gradingCompany: g, action: a, previousGrade: p, newGrade: n }))
  else if (path === 'analyst-estimates') body = [['2025-09-27', 4.0e11, 3.9e11, 4.1e11, 6.8, 6.6, 7.0, 38], ['2026-09-26', 4.25e11, 4.1e11, 4.4e11, 7.3, 7.0, 7.6, 36], ['2027-09-25', 4.55e11, 4.3e11, 4.8e11, 8.1, 7.6, 8.6, 34], ['2028-09-30', 4.9e11, 4.5e11, 5.3e11, 9.0, 8.1, 9.9, 18], ['2029-09-29', 5.3e11, 4.7e11, 5.9e11, 10.1, 8.8, 11.4, 9]].map(([date, ra, rl, rh, ea, el, eh, n]) => ({ symbol: q.symbol, date, revenueAvg: ra, revenueLow: rl, revenueHigh: rh, epsAvg: ea, epsLow: el, epsHigh: eh, numAnalystsRevenue: n, numAnalystsEps: n }))
  else if (path === 'income-statement') body = [['2025-09-27', '2025', 4.08e11, 1.9e11, 1.28e11, 1.05e11, 6.9], ['2024-09-28', '2024', 3.91e11, 1.8e11, 1.23e11, 9.7e10, 6.1], ['2023-09-30', '2023', 3.83e11, 1.69e11, 1.14e11, 9.7e10, 6.13], ['2022-09-24', '2022', 3.94e11, 1.7e11, 1.19e11, 1.0e11, 6.11]].map(([date, fy, rev, gp, oi, ni, eps]) => ({ symbol: q.symbol, date, fiscalYear: fy, revenue: rev, grossProfit: gp, operatingIncome: oi, netIncome: ni, epsDiluted: eps }))
  else if (path === 'cash-flow-statement') body = [['2025-09-27', 1.0e11], ['2024-09-28', 1.1e11], ['2023-09-30', 9.9e10], ['2022-09-24', 1.1e11]].map(([date, f]) => ({ symbol: q.symbol, date, freeCashFlow: f }))
  else if (path === 'balance-sheet-statement') body = [['2025-09-27', 3.5e10, 1.05e11, 7.0e10], ['2024-09-28', 3.0e10, 1.1e11, 6.3e10], ['2023-09-30', 3.1e10, 1.1e11, 6.2e10], ['2022-09-24', 2.4e10, 1.2e11, 5.0e10]].map(([date, cash, debt, eq]) => ({ symbol: q.symbol, date, cashAndCashEquivalents: cash, totalDebt: debt, totalStockholdersEquity: eq }))
  else if (path === 'ratios-ttm') body = [{ symbol: q.symbol, priceToEarningsRatioTTM: 29.4, priceToSalesRatioTTM: 7.2, priceToBookRatioTTM: 41.6, priceToEarningsGrowthRatioTTM: 2.4, grossProfitMarginTTM: 0.466, operatingProfitMarginTTM: 0.314, netProfitMarginTTM: 0.257, debtToEquityRatioTTM: 1.5, currentRatioTTM: 0.87 }]
  else if (path === 'key-metrics-ttm') body = [{ symbol: q.symbol, marketCap: 2.85e12, evToEBITDATTM: 21.3, returnOnEquityTTM: 0.42, returnOnAssetsTTM: 0.26 }]
  else if (path === 'news/stock' || path === 'news/general-latest') { const pg = Number(q.page || 0); const pubs = [['Market Wire', 'marketwire.example'], ['Daily Ledger', 'dailyledger.example'], ['Trading Post', 'tradingpost.example']]; const heads = ['shares rise after upbeat product update', 'analysts raise price targets ahead of earnings', 'supplier report points to steady demand next quarter', 'company announces new share buyback programme', 'options traders position for earnings move', 'regulator opens review of industry pricing', 'new product line draws strong early orders', 'quarterly dividend declared at unchanged rate', 'executive to present at investor conference', 'competitor results shift sector outlook']; const syms = (q.symbols || q.symbol || 'AAPL').split(','); body = Array.from({ length: Number(q.limit || 20) }, (_, i) => { const n = pg * 20 + i; const p = pubs[n % 3]; const t = new Date(Date.now() - (n * 47 + 12) * 60000); const pad = (x) => String(x).padStart(2, '0'); const sy = syms[n % syms.length]; return { symbol: path === 'news/stock' ? sy : '', title: (path === 'news/stock' ? sy + ' ' : '') + heads[n % heads.length], publisher: p[0], site: p[1], text: 'Illustrative summary text for this sample headline. The story body would appear on the publisher site when you open the article.', url: 'https://' + p[1] + '/story/' + n, image: '', publishedDate: t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':00' } }) }
  else if (path === 'sector-performance-snapshot' || path === 'industry-performance-snapshot' || path === 'sector-pe-snapshot' || path === 'industry-pe-snapshot') {
    const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy', 'Utilities', 'Real Estate', 'Basic Materials']
    const industries = ['Software - Application', 'Semiconductors', 'Biotechnology', 'Banks - Regional', 'Insurance', 'Auto Manufacturers', 'Specialty Retail', 'Internet Content', 'Aerospace & Defense', 'Packaged Foods', 'Oil & Gas E&P', 'Electric Utilities', 'REIT - Industrial', 'Steel', 'Medical Devices', 'Airlines', 'Restaurants', 'Telecom Services', 'Gold', 'Asset Management']
    const key = path.startsWith('sector') ? 'sector' : 'industry'; const names = key === 'sector' ? sectors : industries
    const h = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)
    body = names.map((n) => path.endsWith('performance-snapshot') ? { date: q.date, exchange: q.exchange, [key]: n, averageChange: +(((h(n) % 41) - 17) / 10).toFixed(2) } : { date: q.date, exchange: q.exchange, [key]: n, pe: +(10 + (h(n) % 330) / 10).toFixed(1) })
  }
  else if (path === 'biggest-gainers' || path === 'biggest-losers' || path === 'most-actives') {
    const sign = path === 'biggest-losers' ? -1 : 1; const ex = ['NASDAQ', 'NYSE', 'NASDAQ', 'AMEX']
    body = Array.from({ length: 24 }, (_, i) => { const price = +(3 + ((i * 37) % 180) + 0.35).toFixed(2); const pc = path === 'most-actives' ? +(((i * 13) % 9) - 4 + 0.4).toFixed(2) : +(sign * (38 - i * 1.3)).toFixed(2); return { symbol: (i % 7 === 3 ? 'SMF' : 'SMP') + String.fromCharCode(65 + i), name: i % 7 === 3 ? 'Sample Growth Fund ' + (i + 1) : 'Sample Company ' + String.fromCharCode(65 + i), price, change: +(price * pc / 100).toFixed(2), changesPercentage: pc, exchange: ex[i % 4] } })
  }
  else if (/^(senate|house)-(latest|trades|trades-by-name)$/.test(path)) {
    const ch = path.startsWith('senate') ? 'senate' : 'house'
    const people = ch === 'senate' ? [['Jordan Sample', 'TX', 'S-1001'], ['Riley Demo', 'OH', 'S-1002']] : [['Alex Example', 'CA-12', 'H-2001'], ['Casey Placeholder', 'NY-03', 'H-2002'], ['Morgan Illustrative', 'FL-07', 'H-2003']]
    const syms = [['AAPL', 'Apple Inc. - Common Stock'], ['MSFT', 'Microsoft Corporation'], ['NVDA', 'NVIDIA Corporation'], ['XOM', 'Exxon Mobil Corporation'], ['JPM', 'JPMorgan Chase & Co.'], ['AMZN', 'Amazon.com, Inc.'], ['UNH', 'UnitedHealth Group'], ['PFE', 'Pfizer Inc.']]
    const amts = ['$1,001 - $15,000', '$15,001 - $50,000', '$50,001 - $100,000', '$100,001 - $250,000', '$1,001 - $15,000']
    let rowsAll = Array.from({ length: 36 }, (_, i) => { const p = people[i % people.length]; const s = syms[(i * 3 + (i % 5)) % syms.length]; const dis = new Date(Date.now() - (i * 1.4 + 2) * 86400000); const lag = 8 + ((i * 7) % 44); const tr = new Date(dis.getTime() - lag * 86400000); return { senateID: p[2], office: p[0], district: p[1], owner: i % 4 === 0 ? 'Spouse' : i % 4 === 1 ? 'Self' : 'Joint', symbol: s[0], assetDescription: s[1], assetType: i % 9 === 8 ? 'Corporate Bond' : 'Stock', type: i % 3 === 1 ? 'Sale' : i % 11 === 5 ? 'Sale (Partial)' : 'Purchase', amount: amts[i % amts.length], disclosureDate: ds(dis), transactionDate: ds(tr), link: 'https://example.com/filings/' + ch + '/' + i } })
    if (path.endsWith('-trades')) rowsAll = rowsAll.filter((r) => r.symbol === (q.symbol || 'AAPL').toUpperCase())
    if (path.endsWith('trades-by-name')) { const n = (q.name || '').toLowerCase(); rowsAll = rowsAll.filter((r) => r.office.toLowerCase().includes(n)) }
    const lim = Number(q.limit || 100), pg = Number(q.page || 0)
    body = path.endsWith('-latest') ? rowsAll.slice(pg * lim, pg * lim + lim) : rowsAll
  }
  else if (path === 'available-sectors') body = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy', 'Utilities', 'Real Estate', 'Basic Materials'].map((sector) => ({ sector }))
  else if (path === 'available-industries') body = ['Software - Application', 'Semiconductors', 'Biotechnology', 'Banks - Regional', 'Insurance', 'Auto Manufacturers', 'Specialty Retail', 'Internet Content', 'Aerospace & Defense', 'Packaged Foods', 'Oil & Gas E&P', 'Electric Utilities'].map((industry) => ({ industry }))
  else if (path === 'available-countries') body = ['US', 'CA', 'GB', 'DE', 'JP'].map((country) => ({ country }))
  else if (path === 'company-screener') {
    const secs = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 'Industrials', 'Consumer Defensive', 'Energy', 'Utilities', 'Real Estate', 'Basic Materials']
    const inds = { Technology: 'Software - Application', Healthcare: 'Biotechnology', 'Financial Services': 'Banks - Regional', 'Consumer Cyclical': 'Specialty Retail', Industrials: 'Aerospace & Defense', 'Consumer Defensive': 'Packaged Foods', Energy: 'Oil & Gas E&P', Utilities: 'Electric Utilities', 'Real Estate': 'REIT - Industrial', 'Basic Materials': 'Steel' }
    const exs = ['NASDAQ', 'NYSE', 'NYSE', 'NASDAQ', 'AMEX']
    let all = Array.from({ length: 400 }, (_, i) => { const sec = secs[i % secs.length]; const etf = i % 17 === 16; const cap = Math.round(2e8 * Math.pow(1.0243, 400 - i) * (0.8 + ((i * 37) % 40) / 100)); const price = +(8 + ((i * 53) % 340) + 0.37).toFixed(2); const vol = Math.round(cap > 1e10 ? 3e6 + ((i * 91) % 40) * 2e5 : 4e5 + ((i * 71) % 90) * 1e5); return { symbol: (etf ? 'SMX' : 'SMC') + String(i + 1).padStart(3, '0'), companyName: etf ? 'Sample Index Fund ' + (i + 1) : 'Sample Company ' + (i + 1), marketCap: cap, sector: etf ? '' : sec, industry: etf ? '' : inds[sec], beta: +(0.4 + ((i * 29) % 140) / 100).toFixed(2), price, lastAnnualDividend: i % 3 === 0 ? +(price * (0.012 + ((i * 7) % 40) / 1000)).toFixed(2) : 0, volume: vol, avgVolume: Math.round(vol / (0.6 + ((i * 13) % 30) / 10)), exchangeShortName: exs[i % 5], country: 'US', isEtf: etf, isFund: false, isActivelyTrading: true } })
    const n = (k) => (q[k] === undefined ? null : Number(q[k]))
    all = all.filter((r) => (!q.sector || r.sector === q.sector) && (!q.industry || r.industry === q.industry) && (!q.exchange || r.exchangeShortName === q.exchange) && (!q.country || r.country === q.country)
      && (n('marketCapMoreThan') == null || r.marketCap >= n('marketCapMoreThan')) && (n('marketCapLowerThan') == null || r.marketCap <= n('marketCapLowerThan'))
      && (n('priceMoreThan') == null || r.price >= n('priceMoreThan')) && (n('priceLowerThan') == null || r.price <= n('priceLowerThan'))
      && (n('volumeMoreThan') == null || r.volume >= n('volumeMoreThan')) && (n('betaMoreThan') == null || r.beta >= n('betaMoreThan')) && (n('betaLowerThan') == null || r.beta <= n('betaLowerThan'))
      && (q.isEtf === undefined || String(r.isEtf) === q.isEtf))
    body = all.sort((a, b) => b.marketCap - a.marketCap).slice(0, Number(q.limit || 250))
  }
  else if (path === 'historical-price-eod/full') body = daily(q.from, q.to)
  else if (path.startsWith('historical-chart/')) {
    const step = { '1min': 1, '5min': 5, '15min': 15, '30min': 30, '1hour': 60, '4hour': 240 }[path.split('/')[1]] || 5
    const out = []; let p = 170; const start = new Date(q.from + 'T00:00:00Z'), end = new Date(q.to + 'T00:00:00Z')
    const days = []; for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) if (![0, 6].includes(d.getUTCDay())) days.push(new Date(d))
    const pad = (x) => String(x).padStart(2, '0')
    for (const d of days) for (let m = 9 * 60 + 30; m < 16 * 60; m += step) { const o = p; p = Math.max(20, p + (rnd() - 0.48) * 0.6 * Math.sqrt(step)); out.push({ date: ds(d) + ' ' + pad(Math.floor(m / 60)) + ':' + pad(m % 60) + ':00', open: +o.toFixed(2), high: +(Math.max(o, p) + rnd() * 0.3).toFixed(2), low: +(Math.min(o, p) - rnd() * 0.3).toFixed(2), close: +p.toFixed(2), volume: Math.floor(2e5 + rnd() * 6e5) }) }
    const k = END / (out.length ? out[out.length - 1].close : END); for (const b of out) for (const f of ['open', 'high', 'low', 'close']) b[f] = +(b[f] * k).toFixed(2)
    body = out.reverse()
  }
  else if (path === 'search-symbol') body = [{ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' }]
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body))
}).listen(PORT, () => console.log('fake fmp on', PORT))
