Claude in Trading Lab is more than a chat box. It has a set of **tools**: actions it can take inside the app, on your behalf, while it talks to you. It can read your chart, mark it up, check your account, look up news and data, size a trade, write in your journal and teach from the strategy library. There are **45 built-in tools**, plus extra market-data lookups. This page explains what they let Claude do, and the limits that always apply.

> **The one rule that never changes:** Claude can **prepare** an order ticket for you to review, but it can **never place, change or cancel an order**. Every trade is sent by you.

## How tools work

When you ask something that needs your screen or your data, Claude decides which tools to use, runs them, and uses the results in its answer. You see each one as a **tool row** in the chat, with a tick when it worked and a way to open it to see exactly what was asked and returned. See *The chat panel*.

- Claude is told to **read before it states**. It should get prices, levels and indicator values from a tool and not from memory or guesswork.
- Tools run **inside the app** on your computer. Your market data key is never given to Claude.
- Big requests can take several steps. If a long task stops part-way, ask Claude to continue.
- Tool results that come from outside (news, filings, market data) are treated as **information, not instructions**.

## What Claude can do

### Read your chart

| Tool | What it does |
|---|---|
| **Read chart state** | Learns what you are looking at: symbol, time frame, chart type, how many candles are loaded, and the studies on the chart |
| **Read price bars** | Reads the candles (open, high, low, close, volume) and a summary of the loaded window |
| **Find swing highs/lows** | Finds turning points exactly, instead of judging them by eye |
| **List studies** and **Read study values** | Knows which indicators exist and reads real RSI, MACD or moving average numbers |
| **Look at the chart** | Takes a picture of your chart, with your studies and drawings, to check how things look |

### Change your chart

| Tool | What it does |
|---|---|
| **Change chart** | Switches symbol, length, interval or chart type, and waits for the data to load |
| **Add study**, **Update study**, **Remove study** | Adds an indicator with its settings and colors, changes it, or removes it. It should only remove ones it added unless you ask |
| **Set up chart for strategy** | Applies a strategy's time frame, chart type and studies. This **replaces** the studies on the chart, and you get an **Undo** button |

### Draw on your chart

| Tool | What it does |
|---|---|
| **Draw horizontal line** | Marks support, resistance, a stop or a target at a price |
| **Draw trendline** | Connects two real points, such as swing lows in an uptrend |
| **Draw Fibonacci retracement** | Draws the Fibonacci levels over a move |
| **Draw rectangle** | Shades a zone, such as a range or a gap |
| **Mark a bar** | Puts an arrow and a short note on one candle, such as *Bullish engulfing* |
| **Remove drawings** | Removes specific drawings, everything it drew, or (only if you ask) all of them |

![A chart with drawings. The Support line and the Pullback entry arrow are the kind Claude adds.](drawing-examples.png)

Claude's drawings are tagged as its own, so the pen menu's **Remove Claude's drawings** clears them without touching yours. See *Drawing tools*.

### Your account and orders

| Tool | What it does |
|---|---|
| **Read paper account** | Reads your equity, cash, buying power, profit and loss, and positions |
| **Get live quote** | Gets the latest price, change, day range and volume for a symbol |
| **Prepare order ticket** | Opens the order ticket filled in with a proposed entry, stop, target and size, and draws the lines on your chart. It also saves the idea in your journal |
| **Read order ticket** | Reads the ticket as it is now, including any changes you made |
| **Close order ticket** | Discards the draft when the idea is dropped |

![A ticket Claude prepared, with its draft lines on the chart](orderlines-draft.png)

You review every field, change what you like, and decide whether to send it. See *Trade ideas and the ticket*.

### Sizing and risk

| Tool | What it does |
|---|---|
| **Read risk rules** | Reads your limits from the Position calculator |
| **Calculate position size** | Works out how many shares keep the loss to a chosen amount, capped by your limits. It can show what-if numbers, but it **cannot change your saved limits** |
| **Fill in the calculator** | Opens the Position calculator with the numbers filled in so you can see and adjust them |

### Research

| Tool | What it does |
|---|---|
| **Read news** | Headlines for the symbol, the market, a watchlist or your positions |
| **Read analyst ratings** | Consensus, price targets, the provider's own rating snapshot and estimates |
| **Run stock screener** | Screens US stocks and ETFs by sector, size, price, volume, beta, yield and relative volume |
| **Read market performance** | Sector and industry performance, valuations and the biggest movers |
| **Read Congress trades** | Latest filings, one symbol, or one member |
| **Read options chain** | The delayed chain with implied volatility, expected move and put/call ratios. For learning only, since the paper account trades stocks |

On top of these, Claude can use **extra market-data lookups** from your data provider, such as company profiles, financial statements, ratios, earnings dates and more, when your connection includes them. Settings → Test connection shows whether that connection works. Claude should say where a figure came from.

### Your journal

| Tool | What it does |
|---|---|
| **Add journal entry** | Records a trade suggestion or a lesson, attributed to Claude, with an optional chart picture |
| **Read journal** and **Read journal entry** | Looks through your entries to answer questions and give feedback |
| **Update journal entry** | Edits entries **Claude itself wrote**. It cannot edit yours |
| **Comment on journal entry** | Leaves feedback on any entry. This is how it reviews your trades without rewriting them |

![An idea saved by Claude in the journal](journal-idea.png)

See *Trading journal*.

### Learning

| Tool | What it does |
|---|---|
| **Browse strategies** and **Read strategy document** | Finds and reads the guides, with your progress |
| **Write strategy document** and **Update strategy document** | Writes a new guide for you, and edits guides you or Claude made. It cannot edit the built-in ones |
| **Record learning progress** and **Read learning progress** | Records your quiz scores and status when you agree, and uses them to choose what to teach next |

See *Trading strategies library*.

### Watchlists

| Tool | What it does |
|---|---|
| **Read watchlists** | Sees your lists and which is selected |
| **Add to watchlist** and **Remove from watchlist** | Adds symbols (creating a list if needed) or removes them, only when you ask |

See *Watchlists*.

## What Claude cannot do

- **It cannot place, change or cancel an order.** It can only prepare a ticket.
- **It cannot change your saved risk limits**, your settings or your API keys.
- **It cannot edit your own journal entries**, only comment on them, and it cannot change the built-in strategy guides.
- **It cannot predict the market.** Claude is told to describe what would support or invalidate an idea, not where price will go, and to cover risk (size, stop, what proves it wrong) and not just upside.
- **It cannot see things you have not opened or shared.** It sees a summary of your screen and what its tools return.
- **It can be wrong.** Check the chart and the numbers yourself, especially before acting on an idea.

If a tool returns **sample data** or an error, for example when no market data key is set, Claude is asked to say so plainly.

## Getting the most from it

- **Ask for actions, not only answers.** *Mark the last two swing lows and draw a trendline* works on your chart.
- **Name the screen or the data.** *Check my journal for trades where I felt FOMO* uses the journal tools.
- **Ask for the reasoning.** Open a tool row to see what Claude actually looked at.
- **Keep control.** You can undo a chart change, remove a drawing or close a ticket yourself at any time.

**Next:** *Trade ideas and the ticket*.
