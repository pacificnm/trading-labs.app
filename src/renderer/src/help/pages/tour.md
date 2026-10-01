This page is a map of the Trading Lab window. Everything you do happens in one window with six parts.

![The Trading Lab window with its six areas numbered](tour-window.png)

## 1. Title bar and menus

The bar along the top replaces the system window frame. On the right are the usual **minimize**, **maximize / restore** and **close** buttons, and double-clicking an empty part of the bar maximizes the window. The middle shows the current symbol, such as *AAPL — Trading Lab*.

On the left are three menus:

| Menu | Items |
|---|---|
| **File** | **Settings** (API keys, time zone), **Back Up Data…** and **Restore From Backup…** (see *Data, cache and backups*), **Exit** |
| **Chart** | **Chart Settings…** (chart type, studies and their colors) |
| **About** | **Help Contents** (this library, also **F1**), **About Trading Lab…** (version, details and **Check for updates**; see *Updates and versions*) |

Click a menu to open it, then slide across the bar to switch menus. **Esc** closes it.

## 2. The action ribbon

The column of icons on the far left switches the main panel between screens. Hover over an icon to see its name. The highlighted icon shows where you are.

| Icon | Screen | What it is for |
|---|---|---|
| Candlesticks | **Charts** | Charts, studies, drawing tools, the order ticket, and the per-symbol screens |
| Wallet | **Account** | Your paper accounts: switch between them, set a balance to match a real account, equity and buying power |
| Arrows | **Active Trades** | Working orders and open positions |
| Checklist | **Watchlists** | Your symbol lists with live prices |
| Bar chart | **Market Performance** | Sectors, industries, gainers, losers, most active |
| Building | **Senate & House Trades** | Congressional trade disclosures |
| Newspaper | **Market News** | General and watchlist-related news |
| Calculator | **Position Calculator** | How many shares to buy for the risk you choose |
| Magnifier | **Stock Screener** | Find stocks that match your filters |
| Graduation cap | **Trading Strategies** | The strategy library for learning |
| Open book | **Trading Journal** | Your trade notes and reviews |
| Gear (bottom) | **Settings** | Keys, time zone and display |

The symbol screens **News, Quote Details, Analyst Reports, Fundamentals and Options** are not on the ribbon. They are opened from the icons in the chart header, so they always show the symbol you are looking at. Charts stays highlighted while you are on any of them.

## 3. The main panel

The large area in the middle shows the screen you picked. On the Charts screen it is arranged like this, from the top:

- **Symbol search**, the **watchlist dropdown** and the scrolling **index ticker**.
- The **chart header**: add-to-watchlist star, the symbol name, **Length** and **Interval** dropdowns, the five symbol-screen icons, the **drawing tools** pen, and the **Buy** and **Sell** buttons.
- The **chart** itself with its volume pane and price scale.

The chart header has its own page in the Charts section.

## 4. The divider

The thin line between the main panel and the Claude panel can be **dragged** to give either side more room. The sizes are limited so neither side can be squeezed out of sight. The layout is remembered only for the current session.

## 5. The Claude panel

The panel on the right is your assistant. It always knows which screen you have open, the symbol, and your chart settings, so you can ask about what you are looking at.

- **New chat** (plus icon) and **Chat history** (clock icon) are at the top.
- The message box is at the bottom, with the **model** and **effort** pickers beneath it.
- Several screens also have **Ask Claude** buttons that send a ready-made question to this panel.

It needs an Anthropic key. See *First-time setup*, and the Claude assistant section for everything it can do.

## 6. The status bar

The blue bar along the bottom shows, from left to right:

| Item | Meaning |
|---|---|
| **Account name** | The **active** paper account and its brokerage. All trading is simulated. Click it to open the *Account* screen, where you can switch |
| **Wallet value** | The active account's total value (equity). Hover for the label |
| **BP** | Buying power available: how much you can still use for new positions, after orders that are waiting to fill |
| **Working orders** | How many orders are waiting to fill |
| **Market open / closed** and the clock | Whether US stocks are trading (9:30 to 16:00 New York time) and the time in your chosen zone. Click it to change the time zone |
| **Symbol** | The symbol the app is currently on |
| **Market data** | **FMP** when live data is on, or **sample (no FMP key)** when it is not. Sample data means prices are made up for demonstration |

> The market clock does not know about exchange holidays. On a holiday it may say **open** when the market is closed.

**Next:** *How paper trading works*.
