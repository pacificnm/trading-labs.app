**Quote Details** is the snapshot screen for one stock: where it trades right now, how it has moved, how big the company is, and what is happening in after-hours trading. Open it with the **gauge** icon in the chart header, between News and Analyst Reports. It always shows the symbol you are currently viewing.

![The Quote Details screen](quote-screen.png)

The screen header shows the **company name** and, after it, the **exchange, sector and industry**, for example *Apple Inc. — NASDAQ · Technology · Consumer Electronics*.

## Data as of, and Refresh

At the top left, a line says when the data was loaded, such as *Data as of 07:37:22 EDT · just now*. To limit the number of requests made to your market data provider, the app keeps recent answers and reuses them while they are fresh. The screen re-reads in the background about every 20 seconds, and takes new data from the provider as soon as the saved copy has aged out.

Click **Refresh** to skip the saved copy and fetch everything again right now.

## Short quote

The main price card.

- The **big number** is the latest price. Beside it is the change since the previous close, in dollars and as a percent, in **green** when up and **red** when down.
- **Volume** is the number of shares traded today, in a short form such as *41M* for 41 million.
- **Previous close** is the price at the end of the last trading session. The change figure is measured from this.
- **Day range** shows today's low and high, with a marker for where the price is now.
- **52-week range** shows the lowest and highest price in the past year, with the same marker.

The range bars show at a glance whether a stock is trading near the top, the middle or the bottom of its recent range. A price near the 52-week high shows strength, and one near the low shows weakness, though neither tells you what happens next.

## Key statistics

Seven figures that describe the stock and the company.

| Statistic | What it means |
|---|---|
| **Open** | The price of the first trade today |
| **Avg volume** | The usual number of shares traded per day. Compare it with today's volume to see if trading is unusually busy or quiet |
| **Market cap** | The total value of all the company's shares: share price times the number of shares. Shown in a short form, for example *2.85T* is 2.85 trillion dollars |
| **P/E (TTM)** | Price-to-earnings ratio: the share price divided by the company's earnings per share over the trailing twelve months. A higher number means investors pay more for each dollar of profit |
| **EPS (TTM)** | Earnings per share over the last twelve months |
| **Dividend yield** | The last dividend payment divided by the current price, as a percent. It is a rough guide to the income from holding the stock |
| **Beta** | How much the stock tends to move compared with the market. About 1 moves with the market, above 1 moves more, below 1 moves less |

A dash (—) means the provider has no figure for that item. Companies that make a loss have no meaningful P/E, and many companies pay no dividend.

## Aftermarket trade

The latest trade, **including trades outside regular hours** (before the open and after the close).

- The **price** of the last trade, and how far it is above or below the quote in the short quote card (for example *+0.11 vs quote*).
- **Trade size** is how many shares changed hands in that trade.
- **Traded at** is the time of the trade, shown in the time zone you chose in Settings. See *Time zone and display*.

This is useful after the close, when the regular price has stopped but trading goes on in a smaller market. Prices outside regular hours can be thin and jumpy, so a single trade may not represent the real market.

## Aftermarket quote

The latest **bid and ask**, again including extended hours.

- **Bid** is the highest price a buyer is currently offering, with the number of shares wanted after the **×** sign. **Ask** is the lowest price a seller is currently asking, with the number of shares offered.
- The **bar** under them shows the share of the displayed size on each side. A longer green section means more shares are bid than offered.
- **Spread** is the gap between ask and bid, in dollars and as a percent of the price. A narrow spread means the stock is easy to trade cheaply, and a wide spread means it costs more to get in and out.
- **Midpoint** is the price halfway between bid and ask.
- **Volume** and **Quoted at** show the volume reported and the time of the quote.

If the provider has no data for either aftermarket card, the card says *No trade data available* or *No quote data available*. Some plans do not include extended-hours data.

## Price performance

A row of tiles showing the **percent change over each period**: 1 day, 5 days, 1, 3 and 6 months, year to date, and 1, 3, 5 and 10 years, plus **Max** since the stock started trading. Gains are green and losses red.

Use it to see how the current move fits into the longer picture. A stock that is up 2% today but down 30% over a year is a very different story from one that is up 2% in a steady climb. Very large figures are shown in a short form, such as *+112K%*.

## When there is no market data key

Without an FMP key, the screen shows a note saying **Sample data**, with made-up numbers and no company name. Add your key under **File → Settings** to see real figures. See *First-time setup*.

## What the numbers do not tell you

- **They are a snapshot.** The numbers are as of the time shown. Prices change constantly while the market is open.
- **Quotes may be delayed**, depending on your market data plan.
- **Statistics come from the provider.** Items such as P/E and EPS come ready-made and are only as current as the provider's latest filing.

## Using it with the rest of the app

- Open the **Chart** with the candlestick icon in the same header, to see the price history behind these numbers.
- Open **Analyst Reports** and **Fundamentals** from the same icons for opinions and financials. See *Analyst reports* and *Fundamentals*.
- Ask **Claude** about any of it. It can read the same quote data, so *Is AAPL cheap or expensive compared with its own history?* or *What does a beta of 1.24 mean for my position size?* will use the real figures.

**Next:** *Analyst reports*.
