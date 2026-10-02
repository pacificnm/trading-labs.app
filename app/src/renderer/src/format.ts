export const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
export const money = (n: number, d = 2) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d })
export const compact = (n: number) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
export const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
