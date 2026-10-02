Using Claude in Trading Lab costs a little money, and it sends some information to Anthropic, the company that runs Claude. This page explains both plainly: **what it costs and how to keep it down**, and **exactly what is sent, what stays on your computer, and what never leaves it**.

## Cost

### Who pays

The Claude panel uses **your own Anthropic account**. The app does not add a charge, and there is no Trading Lab subscription. Anthropic bills your account for the usage, and the charges appear in the **Anthropic Console** where you created your key. Make sure the account has credit, or the chat will show an error.

Everything else in the app works without Claude, and without spending anything on it. Market data is a separate account with your data provider. See *First-time setup*.

### What decides the cost

The amount you pay is based on **how much text** goes to Claude and comes back, measured in **tokens** (roughly small pieces of words). Several things make that larger or smaller:

| Factor | Effect |
|---|---|
| **The model** | Bigger models cost more per token. *Haiku* is the cheapest, *Sonnet* costs less than *Opus*, and *Fable* is the most expensive |
| **The effort setting** | Higher effort means Claude thinks for longer before answering, and that thinking uses tokens. *Max* costs the most |
| **The length of the chat** | The earlier messages in a conversation are sent again each time you reply, so a long chat costs more per message than a short one |
| **What Claude looks up** | Every tool result (candles, news, journal entries, a screenshot of your chart) is text or an image that Claude reads, and it counts |
| **The length of its answer** | Longer, more detailed answers use more tokens |

### What the app shows you

Under each finished answer, a small grey line shows **which model answered and how many tokens it wrote**. The app does not show a dollar amount, and does not add up your spending. To see what you have actually spent, look at **usage in the Anthropic Console**, where you can also **set a spending limit** on your account. It is worth doing so.

### Keeping the cost down

- **Set a cheap default.** **File → Settings → Claude model and effort** sets what the chat starts with. It is Sonnet at Medium unless you change it, and the pickers in the chat only override it for one session.
- **Match the model to the question.** Use *Haiku* or *Sonnet* for definitions and simple questions, and keep *Opus* or *Fable* for hard analysis.
- **Match the effort.** *Low* or *Medium* is plenty for most questions. Save *High* and above for reading a chart carefully or checking a trade plan.
- **Start a new chat** when you change subject, so old messages are not sent again.
- **Ask focused questions.** *Is the 50-day average acting as support?* is cheaper than *Tell me everything about this stock*.
- **Press Stop** if an answer is going the wrong way.
- **Be aware of the buttons.** The *Ask Claude* buttons on other screens send a ready-made request that may involve several lookups. That is normal, but each is a real request.

See *The chat panel* for the model and effort pickers.

## Privacy

### What is sent to Anthropic

When you send a message, the app sends the following to Anthropic's servers so Claude can answer:

1. **Your message**, and the **earlier messages in the same chat**.
2. **A snapshot of your screen** attached to your newest message. It contains the screen you are on, the symbol, your time zone, the chart's time frame, chart type and studies, your **active paper account** (its name, brokerage, type, and figures such as equity, cash, buying power and profit and loss), your **positions**, the **number of working orders**, your **watchlists** (names and symbols), your **risk limits**, and the current time and whether the market is open.
3. **The results of any tools Claude uses.** If Claude reads the chart, the candles are sent. If it reads news, the headlines are sent. If it reads your journal, the entries it opens are sent. If it looks at your chart with its screenshot tool, **a picture of your chart** is sent. Strategy guides, your progress, market data and research results it requests go the same way.

Here is what the snapshot looks like, with made-up values:

```json
{
  "screen": "chart",
  "symbol": "AAPL",
  "timeZone": "America/New_York",
  "chart": { "range": "6M", "interval": "1day", "type": "candles", "scale": "normal",
             "studies": [{ "study": "ema", "params": { "length": 50 } }] },
  "account": { "equity": 100000, "cash": 100000, "buyingPower": 200000, "openPL": 0, "realizedPL": 0 },
  "positions": [],
  "workingOrders": 0,
  "watchlists": [{ "name": "Watchlist", "symbols": ["AAPL", "MSFT"] }],
  "riskRules": { "maxRiskPct": 1, "maxPositionPct": 25 },
  "clock": { "usMarketOpen": false }
}
```

Nothing is sent to Anthropic until **you send a message** (or click an *Ask Claude* button, which sends one for you).

### What is never sent to Anthropic

- **Your API keys**, for Anthropic or for your data provider. They stay inside the app.
- **Your journal and notes**, unless Claude opens an entry with its tools because you asked it something that needs it.
- **Anything on your computer** that is not part of the screen snapshot or a tool result.

### Who else sees what

| Service | What it receives |
|---|---|
| **Anthropic** (api.anthropic.com) | The messages, snapshot and tool results described above |
| **Your market data provider** (Financial Modeling Prep) | Requests for prices, news, analyst data and so on, and your data key. This is separate from Claude |
| **Cboe** (cdn.cboe.com) | A request for delayed options data when you open the Options screen |
| **News publishers' image servers** | A request for each thumbnail picture when you read news |

Your **data key goes only to the data provider**, and Claude's tools run **inside the app**, so Claude never has your key. Data that Claude asks for (such as a news list or a company's statements) passes through your computer and is then sent to Anthropic as part of the answer. Anthropic's own terms and privacy policy cover what they do with the information they receive. **Read them**, and check your account settings in the Anthropic Console, because they are the authority on retention and use.

### What stays on your computer

- **Your chats** are stored in the app's local database, so history survives restarts.
- **Your paper accounts (names, brokerages, links and balances), orders, journal, watchlists, strategy progress, drawings and settings** are in the same database.
- **Your API keys** are stored there too, **encrypted** with your system keyring when one is available. **Settings** says whether they are encrypted. See *First-time setup*.
- The data folder is shown in **About → About Trading Lab**, and is normally `~/.config/trading-lab` on Linux, `%APPDATA%\trading-lab` on Windows and `~/Library/Application Support/trading-lab` on macOS. It is not uploaded anywhere.

### Deleting your data

- **Delete a chat** with the **bin** icon in the chat history. This removes it from your computer. It does not remove anything Anthropic may have already received. See their terms for that.
- **Remove a saved key** with the button in Settings.
- **Reset account** clears one account's positions, orders and fills, and **Delete account** removes an account with its data. Neither touches chats, the journal and settings. See *Account*.
- To remove **everything**, close the app and delete the data folder.

## Good habits

- **Do not type sensitive personal information** into the chat, such as passwords, bank details or identity numbers. Claude does not need it.
- **Remember what your screen contains.** The snapshot includes your active paper account (including its name and brokerage) and watchlists. If that matters to you, start a new chat and do not ask questions that need the account.
- **Set a spending limit** in the Anthropic Console.
- **Treat Claude's answers as help, not advice.** Nothing in Trading Lab is investment advice. See *Limits and disclaimers*.

**Next:** the **Settings** section, starting with *API keys*.
