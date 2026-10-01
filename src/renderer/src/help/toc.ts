// Table of contents for the Help library. A topic's page is `pages/<topic id>.md`; topics without
// a file show a "being written" page. Images go in `img/` and are referenced by file name. `view` adds an "Open this screen" button.
export interface HelpTopic {
  id: string
  title: string
  summary: string
  /** screen the topic documents (a ViewId in App.tsx) */
  view?: string
}
export interface HelpGroup { id: string; title: string; topics: HelpTopic[] }

export const HELP: HelpGroup[] = [
  {
    id: 'start', title: 'Getting started', topics: [
      { id: 'welcome', title: 'Welcome to Trading Lab', summary: 'What the app is for and how this Help library is organised.' },
      { id: 'setup', title: 'First-time setup', summary: 'Adding your FMP and Anthropic keys, and what works without them.', view: 'settings' },
      { id: 'tour', title: 'A tour of the window', summary: 'Title bar and menus, action ribbon, main panel, Claude panel and status bar.' },
      { id: 'paper', title: 'How paper trading works', summary: 'The simulated accounts, starting balance, buying power and what is and is not simulated.' }
    ]
  },
  {
    id: 'charts', title: 'Charts', topics: [
      { id: 'chart-overview', title: 'The chart screen', summary: 'Header, chart area, panes and the controls around them.', view: 'chart' },
      { id: 'chart-search', title: 'Finding symbols', summary: 'Symbol search, the watchlist dropdown and the index ticker.', view: 'chart' },
      { id: 'chart-timeframe', title: 'Length and interval', summary: 'Choosing how much history to show and the bar size, and what your FMP plan allows.', view: 'chart' },
      { id: 'chart-settings', title: 'Chart settings and studies', summary: 'Chart type, scales, and all 23 studies with their parameters.', view: 'chartSettings' },
      { id: 'chart-colors', title: 'Study line colors', summary: 'Changing the color of every study line and resetting to defaults.', view: 'chartSettings' },
      { id: 'chart-drawing', title: 'Drawing tools', summary: 'Trendlines, rays, horizontal lines, Fibonacci and rectangles; selecting, moving and deleting.', view: 'chart' },
      { id: 'chart-orderlines', title: 'Order lines on the chart', summary: 'Draft and working orders shown as draggable lines.', view: 'chart' }
    ]
  },
  {
    id: 'trading', title: 'Trading', topics: [
      { id: 'ticket', title: 'The order ticket', summary: 'Buy and Sell, quantity, price fields, validation and the cost / risk / reward summary.', view: 'chart' },
      { id: 'order-types', title: 'Order types, brackets and OCO', summary: 'Market, limit, stop, stop-limit and trailing stop; entry + target + stop brackets.' },
      { id: 'account', title: 'Account', summary: 'Several paper accounts, matching a real balance, equity, buying power and resetting an account.', view: 'account' },
      { id: 'trades', title: 'Active trades', summary: 'Positions, working orders, order history and fills; cancel orders and close positions.', view: 'trades' },
      { id: 'fills', title: 'How orders are filled', summary: 'Bar-based fills, ties between stop and target, day orders and queued market orders.' }
    ]
  },
  {
    id: 'research', title: 'Research screens', topics: [
      { id: 'quote', title: 'Quote details', summary: 'Price, short quote, after-hours trade and quote, and price change by period.', view: 'quote' },
      { id: 'analyst', title: 'Analyst reports', summary: 'Ratings snapshot, price targets, consensus, history and estimates.', view: 'analyst' },
      { id: 'fundamentals', title: 'Fundamentals', summary: 'Valuation, income, balance sheet, cash flow and ratios.', view: 'fundamentals' },
      { id: 'options', title: 'Options', summary: 'Delayed chains, expirations, greeks and the stats summary.', view: 'options' },
      { id: 'news', title: 'Symbol news', summary: 'News for the current symbol.', view: 'news' },
      { id: 'marketnews', title: 'Market news', summary: 'General market news and news relevant to your watchlist and positions.', view: 'marketnews' },
      { id: 'market', title: 'Market performance', summary: 'Sector and industry performance, P/E, gainers, losers and most active.', view: 'market' },
      { id: 'congress', title: 'Senate and House trades', summary: 'Latest disclosures, by symbol and by member, and how to read them.', view: 'congress' },
      { id: 'screener', title: 'Stock screener', summary: 'Filters, results, saving a result as a watchlist and sending a stock to the chart.', view: 'screener' }
    ]
  },
  {
    id: 'planning', title: 'Planning and learning', topics: [
      { id: 'watchlists', title: 'Watchlists', summary: 'Several lists, adding symbols from anywhere, live prices.', view: 'watch' },
      { id: 'calculator', title: 'Position calculator', summary: 'Sizing a trade from risk, your limits, live price and ATR.', view: 'calculator' },
      { id: 'journal', title: 'Trading journal', summary: 'Ideas, plans, outcomes and reviews; entries written by you or by Claude.', view: 'journal' },
      { id: 'strategies', title: 'Trading strategies library', summary: 'The 13 study documents, chart setups, practice and progress.', view: 'strategies' }
    ]
  },
  {
    id: 'claude', title: 'Claude assistant', topics: [
      { id: 'claude-panel', title: 'The chat panel', summary: 'Sending messages, choosing the model and effort, reading answers and chat history.' },
      { id: 'claude-tools', title: 'What Claude can do', summary: 'The tools: reading and drawing on charts, studies, research data, journal and more.' },
      { id: 'claude-trades', title: 'Trade ideas and the ticket', summary: 'How Claude prepares a trade for you to review, and why it can never send one.' },
      { id: 'claude-prompts', title: 'Things to ask', summary: 'Example prompts for learning, analysis, sizing and review.' },
      { id: 'claude-privacy', title: 'Cost and privacy', summary: 'What is sent to Anthropic and how your API usage is billed.' }
    ]
  },
  {
    id: 'settings', title: 'Settings', topics: [
      { id: 'settings-keys', title: 'API keys', summary: 'Storing keys, encryption, and the connection test.', view: 'settings' },
      { id: 'settings-display', title: 'Time zone and display', summary: 'Local vs market time, 12/24-hour clock.', view: 'settings' },
      { id: 'settings-data', title: 'Data, cache and backups', summary: 'Where your data lives, how market data is cached, and how to back up and restore.' },
      { id: 'updates', title: 'Updates and versions', summary: 'See your version, check for a new release and download it.' }
    ]
  },
  {
    id: 'reference', title: 'Reference', topics: [
      { id: 'shortcuts', title: 'Keyboard shortcuts', summary: 'Every shortcut in one place.' },
      { id: 'glossary', title: 'Glossary', summary: 'Trading terms used in the app.' },
      { id: 'troubleshooting', title: 'Troubleshooting', summary: 'Common problems and fixes.' },
      { id: 'limits', title: 'Limits and disclaimers', summary: 'Simulation limits, data delays and the educational-use notice.' }
    ]
  }
]

export const ALL_TOPICS: { topic: HelpTopic; group: HelpGroup }[] = HELP.flatMap((group) => group.topics.map((topic) => ({ topic, group })))

const PAGES = import.meta.glob('./pages/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const IMAGES = import.meta.glob('./img/*', { query: '?url', import: 'default', eager: true }) as Record<string, string>

export const pageBody = (id: string): string | undefined => PAGES[`./pages/${id}.md`]
export const imageUrl = (name: string): string | undefined => IMAGES[`./img/${name.replace(/^.*\//, '')}`]
