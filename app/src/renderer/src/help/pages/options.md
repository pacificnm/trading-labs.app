The **Options** screen (**Option Stats** in the chart header, the **sigma** icon at the end of the row) lets you study the options market for a stock. It shows what traders expect the stock to do, how busy the options are, and the full list of contracts.

> **This is a learning screen only.** Your paper account trades **stocks**, not options, so you cannot place option orders in Trading Lab. The screen is here so you can learn to read the options market, which is often a good guide to what traders expect.

![The Option Stats screen](options-top.png)

## Where the data comes from

Option prices come from **Cboe's free delayed quotes**, not from your market data key, so the screen works without an FMP key. The prices are **delayed about 15 minutes**. The line at the top says so, together with the time the data was loaded, for example *Data as of 07:47:00 EDT · prices are delayed about 15 minutes · Cboe delayed quotes*.

- The screen **refreshes itself about once a minute**. **Refresh** fetches again straight away.
- One fact depends on your key: **Historical vol (30-day)** is worked out from the stock's price history, so it shows a dash without an FMP key.
- Stocks that have no listed options (many small companies) show an error message with a **Retry** button.

## Option basics

If options are new to you, these terms explain most of the screen.

| Term | Meaning |
|---|---|
| **Option contract** | A right to buy or sell a stock at a set price until a set date. One contract covers **100 shares**, and prices are quoted **per share**, so a quote of $5.70 means $570 per contract |
| **Call** | The right to **buy**. It gains value when the stock rises |
| **Put** | The right to **sell**. It gains value when the stock falls |
| **Strike** | The set price in the contract |
| **Expiration** | The date the contract ends |
| **Premium** | The price you pay for the contract |
| **In the money (ITM)** | A call with a strike below the stock price, or a put with a strike above it. It already has value if exercised |
| **At the money (ATM)** | The strike closest to the stock price |
| **Bid and Ask** | The highest price a buyer offers and the lowest a seller asks. The gap between them is a hidden cost of trading |
| **Open interest (OI)** | How many contracts are currently open |
| **Volume** | How many contracts traded today |

Contract names in the lists read like **Oct 2 340 C**: the expiration date, the strike and **C** for call or **P** for put.

## Volatility & expected move

The first card describes how much movement the market expects.

| Figure | What it means |
|---|---|
| **Stock price** | The latest price, with the day's change |
| **Implied vol (30-day)** | **Implied volatility (IV)** is the amount of movement the options prices imply, as a yearly percent. This is the 30-day figure for the whole stock |
| **Historical vol (30-day)** | How much the stock **actually** moved over the last 30 days, in the same terms |
| **IV vs realised** | Implied divided by historical. Above about 1.15 the options look **pricey** (the market expects more movement than has been happening), below about 0.85 they look **cheap**, and in between they are **in line** |
| **ATM implied vol** | The implied volatility of the at-the-money options for the expiration you have selected |
| **Expected move** | The range, in dollars and percent, that the options market implies for the stock by the selected expiration |
| **Range by expiry** | That expected move as a low and high price |
| **ATM straddle** | The cost of buying a call and a put at the at-the-money strike. It is a quick measure of how much movement the market is pricing in |

The expected move is a **one-standard-deviation** range. Prices finish inside it about **two times in three**, so a move outside the range is not rare. It is a guide to scale, not a forecast.

## Activity

Shows how traders are positioned. Each row gives **two numbers** separated by a dot: the first is for **all expirations together**, and the second for the **expiration you have selected**.

- **Put/call ratio (volume)** and **(open interest)**: puts divided by calls. Above 1 means more put activity than call activity, which is often read as caution. Below 1 leans toward optimism. It is a gauge of the crowd, not a prediction.
- **Call volume**, **Put volume**, **Call open interest** and **Put open interest**: the raw counts, in a short form such as *360.55K*.
- **Max pain (this expiry)**: the strike at which the most option holders would lose money at expiration. Some traders believe prices drift toward it close to expiration. The evidence is mixed, so treat it as a curiosity.

## Implied volatility by expiration

A line chart of the at-the-money implied volatility for each expiration date, with the one you have selected shown as a larger highlighted dot. Hover a dot to see its date, days left and IV.

- A line **rising to the right** is normal: further dates carry more uncertainty.
- A line that **slopes down** (near dates higher than later ones) usually means the market expects something soon, such as an **earnings report** or other news.

## Open interest by strike

Bars showing the number of open contracts at each strike for the selected expiration: **green for calls**, **red for puts**. A dashed blue line marks the current **price** and a dotted amber line marks **max pain**. Hover a bar to see its exact count.

Large clusters of open interest are places where many traders have a stake. They can act like magnets or barriers as expiration approaches, though that is a tendency and not a rule.

## Most active contracts

A table of the busiest contracts today across all expirations.

| Column | Meaning |
|---|---|
| **Contract** | Named as described above, colored green for calls and red for puts |
| **Days** | Days until expiration |
| **Last** | The last traded price per share |
| **Volume** and **Open int.** | Contracts traded today and contracts currently open |
| **Vol / OI** | Volume divided by open interest. Above 1 means more contracts traded today than existed this morning, so **new positions** are being opened |
| **IV** | The implied volatility of that contract |

Click a row to jump the chain and charts below to that contract's expiration.

## The option chain

![The option chain around the current price](options-chain.png)

The chain lists every contract for one expiration, with **calls on the left**, **puts on the right** and the **strike** down the middle.

### Controls

- **Expiration dropdown.** Choose an expiration date. Each shows the date and the days remaining, such as *2026-10-09 · 8d*. The screen starts on the first date at least a week away.
- **Strikes dropdown.** Show **±6**, **±8** or **±15** strikes around the current price, or **All strikes**.
- **Greeks checkbox.** Adds three more columns on each side (see below).

### Reading the table

| Column | Meaning |
|---|---|
| **Bid** and **Ask** | What you could sell at and buy at, per share |
| **Vol** and **OI** | Contracts traded today and contracts open |
| **IV** | Implied volatility of this contract |
| **Delta** | How much the option's price moves for a $1 move in the stock. Also a rough chance of finishing in the money, and 0.50 is about 50 shares of exposure per contract |

The **at-the-money row** is highlighted. Cells that are **in the money** are shaded. A wide gap between bid and ask means the contract is expensive to trade.

### The Greeks

![The chain with the Greeks switched on](options-greeks.png)

Tick **Greeks** to add three more measures. Hover their column headings for a reminder.

| Greek | What it tells you |
|---|---|
| **Delta** | Price change for a $1 move in the stock (already shown) |
| **Gamma** | How fast delta itself changes as the stock moves |
| **Theta** | How much value the option loses **each day** just from time passing. It is negative for options you buy, and it speeds up near expiration |
| **Vega** | How much the price changes for a 1-point change in implied volatility |

## Learning from the screen

- **Compare expected move with the chart.** Mark the expected range with the drawing tools to see how it fits the support and resistance levels you have found. See *Drawing tools*.
- **Check IV before and after earnings.** Implied volatility usually climbs into an earnings report and collapses straight after it. This is called a *volatility crush*, and it is why buying options before earnings is harder than it looks.
- **Watch the spread.** Options on less popular stocks have wide bid-ask gaps that eat into any gain.
- **Remember time.** Every option is a bet that expires. The stock can move your way and the option can still lose value if it moves too slowly.

## Asking Claude

Click **Ask Claude to explain this** to send a ready-made question to the chat panel. Claude reads the same chain data and walks through what the implied volatility, expected move and put/call ratios are saying and what to be careful about. You can also ask your own questions, such as *Why is the near-term IV higher than the later dates?* or *What would a 0.30 delta call mean?* Claude explains and teaches, but it cannot place option trades because the paper account only holds stocks.

**Next:** *Symbol news*.
