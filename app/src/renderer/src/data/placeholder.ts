// Placeholder market data until the FMP feed is connected.
export interface IndexQuote { symbol: string; name: string; price: number; change: number; pct: number }

export const INDEX_QUOTES: IndexQuote[] = [
  { symbol: '^GSPC', name: 'S&P 500', price: 5850.2, change: 21.4, pct: 0.37 },
  { symbol: '^DJI', name: 'Dow Jones', price: 42310.5, change: -85.3, pct: -0.2 },
  { symbol: '^IXIC', name: 'Nasdaq', price: 18420.7, change: 96.8, pct: 0.53 },
  { symbol: '^RUT', name: 'Russell 2000', price: 2210.9, change: -6.1, pct: -0.28 },
  { symbol: '^VIX', name: 'VIX', price: 15.62, change: -0.34, pct: -2.13 },
  { symbol: '^FTSE', name: 'FTSE 100', price: 8290.4, change: 12.7, pct: 0.15 },
  { symbol: '^GDAXI', name: 'DAX', price: 19040.1, change: 74.2, pct: 0.39 },
  { symbol: '^N225', name: 'Nikkei 225', price: 38450.6, change: -190.5, pct: -0.49 }
]

export const KNOWN_SYMBOLS: [string, string][] = [
  ['AAPL', 'Apple Inc.'], ['MSFT', 'Microsoft Corp.'], ['NVDA', 'NVIDIA Corp.'], ['TSLA', 'Tesla Inc.'],
  ['AMZN', 'Amazon.com Inc.'], ['GOOGL', 'Alphabet Inc.'], ['META', 'Meta Platforms'], ['AMD', 'Advanced Micro Devices'],
  ['NFLX', 'Netflix Inc.'], ['JPM', 'JPMorgan Chase'], ['V', 'Visa Inc.'], ['WMT', 'Walmart Inc.'],
  ['DIS', 'Walt Disney Co.'], ['BA', 'Boeing Co.'], ['INTC', 'Intel Corp.'], ['COST', 'Costco Wholesale'],
  ['SPY', 'SPDR S&P 500 ETF'], ['QQQ', 'Invesco QQQ Trust'], ['DIA', 'SPDR Dow Jones ETF'], ['IWM', 'iShares Russell 2000 ETF']
]
