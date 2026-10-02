Trading Lab is **educational software**. This page says plainly what it is, what it is not, and where its numbers and answers can mislead you. Please read it once.

> **Nothing in Trading Lab is investment advice.** Trades here are **simulated**. No real money moves, and the app is **not connected to any brokerage**. Past behavior of a price or a strategy does not promise what will happen next.

## What Trading Lab is for

- **Learning.** Practising how to read charts, size a trade, place orders and review your own decisions, without risking money.
- **Research practice.** Looking at quotes, analyst views, fundamentals, news, options, market data and public disclosures, and learning how to weigh them.
- **Habits.** Building a routine of planning, journaling and reviewing.

It is **not** a way to make money by copying what you see on screen, and it is not a trading signal service.

## The paper account is a simulation

Results in the paper account will usually look **better** than the same trades would in real life. The simulation uses real prices, but it leaves out several real-world costs and frictions:

| Not modelled | Why it matters |
|---|---|
| **Commissions and fees** | Real trades cost money to enter and exit |
| **Slippage** | You often get a slightly worse price than the one you saw |
| **Queues and liquidity** | A price that just touches your limit counts as a fill. In real markets you may not be filled, and a large order can move the price |
| **Partial fills** | Every order here fills completely, at one price |
| **Extended hours** | Pre-market and after-hours trading are not modelled |
| **Exchange holidays and halts** | The app does not know the holiday calendar, and trading halts are not simulated |
| **Dividends, splits and short borrow fees** | These can change the value of a position |
| **Taxes** | Gains and losses have tax consequences in real life |
| **Emotions** | Losing real money feels very different. Many people trade differently once real money is at stake |

Fills are built from **one-minute price bars**, so the simulation cannot know the order of prices within a minute. When a bracket's stop and target are both touched in one minute, it assumes the **stop was hit first**. See *How orders are filled* and *How paper trading works*.

Margin accounts allow **2:1 margin**, which makes gains and losses larger (cash accounts do not borrow or short). Real brokers have more rules, such as margin calls, borrowing costs and restrictions on short selling, that are not simulated here.

**There is no live brokerage connection.** The app cannot place a real order, and Claude can never send an order, even a simulated one. See *What Claude can do*.

## Market data limits

- **Delays and gaps.** Data comes from third parties. Prices can be delayed, wrong, or missing, and your plan may limit what you can see. Options data is about **15 minutes delayed**.
- **Portfolio is a planner, not a broker.** It does arithmetic on prices and keeps your records. It never trades real money. Linked to a paper account, its two buttons (buy the plan, sell a percentage) send simulated orders only when you click and confirm. It ignores fees, dividends and splits unless you enter them, and uses prices that may be delayed. Mutual funds are priced once a day and cannot be traded in the paper account.
- **The chart updates on a timer, not tick by tick.** See *Length and interval* for how often.
- **Saved copies.** To limit requests, the app reuses recent answers. The *Data as of* time shows how old a figure is. See *Data, cache and backups*.
- **Sample data.** Without a market data key, the app shows **made-up sample prices**. They are for finding your way around only, and the app labels them clearly.
- **Free options feed.** Options come from a public delayed feed that is not an official product, and it may change or become unavailable.
- **Plan differences.** Some screens and chart intervals need a paid data plan. The app checks your plan and hides what it does not include. **Settings → What your FMP plan includes** shows which. Limit and stop orders are filled from the finest intraday bars your plan has, which is less exact than 1-minute data, and with none only market orders work.
- **Holidays.** The market-open indicator ignores holidays.
- **Accuracy of figures.** Statistics such as P/E, EPS and ratios are supplied ready-made. They are only as current and accurate as the provider's data.

## What the research screens can and cannot tell you

- **Analyst views** are opinions. Analysts can be wrong and may have business ties to the companies they cover. Their ratings lean positive. See *Analyst reports*.
- **Congress trades** are reported up to **45 days** late and as dollar ranges. They are history, and a poor trading signal. See *Senate and House trades*.
- **Fundamentals** describe the past business. They do not say where the price will go. See *Fundamentals*.
- **The screener** produces a list worth looking at, not a list of things to buy. See *Stock screener*.
- **News** is written to be read. Headlines can mislead, and a story is often already in the price. See *Symbol news*.
- **Strategy guides** describe common ideas. No strategy wins every time. See *Trading strategies library*.
- **Studies and drawings** describe the past. None of them predicts the future.

## Claude's limits

- **Claude can be wrong.** It can misread a chart, misremember a fact, or sound confident when it should not. Check the chart and the numbers yourself.
- **Claude does not predict the market.** It is asked to describe what would support or weaken an idea, and to cover the risk, not just the upside.
- **Claude can prepare a ticket but never send, change or cancel an order.** You decide every trade.
- **Claude sees a summary of your screen and what its tools return**, not everything on your computer.
- **Claude's answers are not advice.** Treat them like a patient tutor's explanation, not a recommendation.
- **Using Claude costs money and sends data to Anthropic.** See *Cost and privacy*.

## Using what you learn

If you later trade with real money:

- **Real results will differ** from the simulation, usually for the worse because of costs, slippage and emotion.
- **Start small.** Risk only what you can afford to lose, and size every trade from a stop and a risk limit. See *Position calculator*.
- **Learn the rules** that apply to you, such as taxes and your broker's margin and short-selling rules.
- **Consider qualified advice** from a licensed professional for decisions about your own money.

## About the software

- Trading Lab is a **personal project** and is provided **as is**, with no warranty. See **About → About Trading Lab…** for the version and credits.
- **Charts** are built with TradingView Lightweight Charts™.
- **Market data and company information** come from Financial Modeling Prep, and **options data** from Cboe's delayed quotes. **Claude** is provided by Anthropic. These are separate companies, and their data and services are subject to their own terms.
- **Platforms:** the app is developed and tested on Linux. Windows and macOS installers are built automatically for each release but have not been tested by the author, and they are not code-signed, so your system may warn you the first time.
- **Back up your data** if it matters to you, with **File → Back Up Data…**. Backups do not include your API keys. See *Data, cache and backups*.
- **Updates are not automatic installs.** The app tells you when a new version exists and links to it. See *Updates and versions*.

## In short

- It is a **simulation** for **learning**.
- The data can be **late, incomplete or wrong**.
- Claude and every other tool on the screen can be **wrong**.
- **You** make every decision.
- **Nothing here is investment advice.**
