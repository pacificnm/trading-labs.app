This page explains exactly how the paper account decides **whether** an order fills and **at what price**. You do not need it to start trading, but it is worth reading once, because it explains results that can look surprising, such as a stop that fills below its price or a bracket that closed at a loss when the chart looks like it reached the target.

For a short overview, see *How paper trading works*. For what each order type means, see *Order types, brackets and OCO*.

## The idea: real prices, checked one minute at a time

The app does not make up fills. It takes the **real one-minute price bars** for the stock and walks through them, minute by minute, asking of each order: *would this have filled during this minute?*

Each one-minute bar records four prices: the **open**, the **high**, the **low** and the **close**. The simulation knows the bar's range, but not the order in which prices occurred **within** the minute. That one gap shapes most of the rules below.

### When an order starts being checked

An order is only checked against bars that start **after** you placed it. If you send an order at 10:15:30, the first bar that counts is the 10:16 bar. This stops an order from "filling" at a price that happened before you sent it.

### How often

The app checks working orders about **every 15 seconds** while it is open, and once straight away when you place an order. If you close the app, it catches up when you open it again by replaying the minutes you missed, as far back as your data provider offers one-minute bars.

## Market orders

| Situation | Filled at |
|---|---|
| Market is **open** and you place the order | The **current price** straight away |
| Market is **closed** | The **opening price** of the first bar of the next session |
| Order waited, for example the app was closed | The open of the first bar that is available after the order was placed |

A market order while the market is closed is not "stuck": it simply waits for the next open. The opening price can be far from yesterday's close, so you may buy at a very different price than the one on your screen.

## Limit orders

A limit order fills when the price **touches or crosses** your limit.

| | Fills when | Filled at |
|---|---|---|
| **Buy limit** | A bar's **low** is at or below your limit | Your limit, or the bar's open if that is lower (better for you) |
| **Sell limit** | A bar's **high** is at or above your limit | Your limit, or the bar's open if that is higher (better for you) |

**Example.** You place a buy limit at 182.00. The next bar trades between 181.90 and 183.00 and opens at 182.80. The low touched your limit, so you are filled at **182.00**. If instead the bar had opened at 181.50, below your limit, you would be filled at the better price of **181.50**.

A limit is a **touch**, not a queue. In real markets, many orders may sit at the same price, so a price that just touches your limit may not fill you. The simulation is a little more generous than reality here.

## Stop orders

A stop order **triggers** when the price reaches your stop price, and then fills at market.

| | Triggers when | Filled at |
|---|---|---|
| **Sell stop** | A bar's **low** reaches your stop | Your stop, or the bar's open if that is lower |
| **Buy stop** | A bar's **high** reaches your stop | Your stop, or the bar's open if that is higher |

### Gaps

If the price **jumps past your stop** between two bars, as it often does overnight or on news, you do not get your stop price. You get the **opening price of the bar that gapped**, which is worse for you.

![On the left, a sell stop that gapped and filled at the open; on the right, a stop and target in the same minute](fills-diagram.png)

*The left panel is an illustration with made-up numbers.*

**Example.** You hold shares with a sell stop at 178.36. The stock closes at 179.20, then opens the next morning at 176.00. The stop triggers at the open and fills at **176.00**, not 178.36. A stop protects you, but it does not promise a price.

## Stop-limit orders

A stop-limit has two stages:

1. The **stop** triggers when the price reaches it, exactly as above.
2. The order then turns into a **limit order** at your limit price.

On the trigger, the app checks whether the price is still inside your limit:

- If the trigger price is **within** your limit, you are filled right away at that price.
- If the price has already jumped **beyond** your limit, there is no fill yet. The order stays **triggered** and waits for the price to come back within your limit. It can wait for a long time, or never fill.

**Example.** A buy stop-limit with stop 186.00 and limit 186.50. If the stock trades up through 186.00 and the bar's range includes prices at or below 186.50, you are filled at 186.00. If the stock gaps open at 187.50, past your limit, you are not filled. The order keeps waiting for a price at or below 186.50.

## Trailing stops

A trailing stop sets a stop at a fixed distance from the best price reached so far.

- It starts from the price when the order was placed. For a bracket, it starts from the **entry fill price**.
- For a sell stop on a long position, it keeps track of the **highest price** seen. The stop is that highest price **minus your trail** (in dollars or percent).
- The highest price is updated **once a bar has completed**. A price high reached during the minute in which the stop triggers is not used for that minute.
- When the price falls to the stop, it fills like a normal stop, at the stop price or at the open if it gapped past it.

**Example.** You place a 5% trailing sell stop when the price is 100. The stop starts at 95. The price rises to 110, so the stop rises to 104.50. It never moves down. When the price drops to 104.50, you are filled at **104.50**, locking in about a 4.5% gain.

For a short position it works the other way: it follows the **lowest** price, and the stop sits above it.

## Brackets and OCO

### When the target and stop start

In a bracket, the target and stop only begin to be checked **after the entry fills**, and they start from the **minute after** the one the entry filled in. They cannot fill inside the same bar as the entry.

### When both are touched in one minute

If a single bar reaches **both** your profit target and your stop, the simulation cannot know which came first. It always treats the **stop as hit first**. This is shown on the right of the picture above.

The rule is deliberately cautious. It means paper results are never made to look better than they should be because of an unknowable order of events. Over many trades, it can make your simulated results slightly worse than reality.

**Example.** Entry filled at 182.00. In the next minute the stock spikes to 191.40 and drops to 177.80. Your target (191.10) and your stop (178.36) were both touched. The stop is counted, you are filled at **178.36**, and the target is cancelled.

### One cancels the other

As soon as one exit order fills, the other is **cancelled** with the reason *Other leg of the OCO filled*. This is true of both a bracket's target and stop, and an OCO pair.

## Day orders and expiry

A **DAY** order is cancelled when the regular session closes if it has not filled, and shows in Order history as **expired**. A **GTC** order stays until it fills or you cancel it. The target and stop of a bracket are always GTC.

If a DAY order is placed after the close, it expires at the **next** close, so it gets a full trading day.

## What happens to your account when an order fills

- **Buying** takes the cost from your cash. **Selling** adds the proceeds.
- If you add to a position you already hold, your **average price** is recalculated across all the shares.
- When you **close or reduce** a position, the **realized profit or loss** is the difference between the fill price and your average price, times the number of shares. For a short position it is the other way round.
- An order that would close a position you no longer hold is **rejected**, with a reason in Order history. This can happen to a leftover stop after you closed the position another way.
- Each order fills **completely and at one price**. There are no partial fills.

## What the simulation leaves out

- **Commissions, fees and slippage.** Real orders usually cost a little more to buy and a little less to sell.
- **Queues and liquidity.** A touch is a fill, and size never moves the price.
- **Partial fills.**
- **Extended hours.** Pre-market and after-hours trading are not modelled.
- **Exchange holidays and halts.**

These make paper results a little more optimistic than real trading would be. Treat them as an upper limit, not a promise.

## Quick reference

| Order | Fills when | Price you get |
|---|---|---|
| **Market** (open) | Immediately | Current price |
| **Market** (closed) | Next session's first bar | The open |
| **Buy limit** | Low ≤ limit | Limit, or open if lower |
| **Sell limit** | High ≥ limit | Limit, or open if higher |
| **Sell stop** | Low ≤ stop | Stop, or open if lower |
| **Buy stop** | High ≥ stop | Stop, or open if higher |
| **Stop-limit** | Stop hit, then price within limit | Trigger price or limit |
| **Trailing stop** | Price falls (or rises) by the trail from its best | Trigger price, or the open on a gap |
| **Bracket target and stop** | After the entry, from the next minute | As for limit and stop; stop wins ties |

**Next:** the **Research screens** section, starting with *Quote details*.
