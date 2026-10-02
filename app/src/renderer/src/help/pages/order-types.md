Every order tells the market two things: **when** to act and **at what price**. The order type decides both. This page explains each type, the bracket and OCO combinations, and how to choose.

You pick the type in the **Order type** box of the order ticket, and the combination in the **Strategy** box. See *The order ticket* for the screen itself.

![The ticket fields for a stop-limit order and a trailing stop](ordertypes-fields.png)

## The five order types

### Market

*Buy or sell right now at whatever the price is.*

- Placed while the market is **open**, it fills immediately at the current price.
- Placed while the market is **closed**, it waits and fills at the **opening price** of the next session. That price can differ a lot from the last close.
- You are guaranteed to get in or out, but **not** the price.

Use it when getting the trade done matters more than a few cents.

### Limit

*Buy at this price or lower, or sell at this price or higher.*

- A **buy limit** sits below the current price and waits for the stock to fall to it. It fills at your limit or better.
- A **sell limit** sits above the current price and waits for the stock to rise to it.
- If you set a buy limit **above** the current price, it fills straight away at the market, and the ticket warns you.
- You are guaranteed the price (or better) but **not** that the order fills. The stock may never reach it.

Use it to control what you pay, to enter on a pullback, or to take a profit at a target.

### Stop

*Wait until the price reaches this level, then trade at the market.*

- A **sell stop** sits below the current price. If the stock falls to it, the order becomes a market sell. It is the classic **stop loss** for a long position.
- A **buy stop** sits above the current price. If the stock rises to it, the order becomes a market buy. Traders use it to enter a **breakout**, or to cover a short.
- The order fills at the stop price, or at the **opening price** if the stock gapped past your stop overnight. A stop can therefore fill worse than you set it.

Use it to limit a loss or to enter only after the price proves itself.

### Stop limit

*Wait until the price reaches the stop, then place a limit order.*

It has two prices, the **stop** (the trigger) and the **limit** (the worst price you accept after the trigger).

- When the stock reaches the stop price, the order becomes a limit order at your limit price.
- If the price jumps straight past your limit, the order is **triggered but not filled** and keeps waiting. That protects you from a bad price but can leave you holding a position you meant to exit.
- The ticket warns you when the limit is on the wrong side of the stop.

Use it when you want a trigger and a price ceiling, for example to buy a breakout without chasing it too far.

### Trailing stop

*A stop that follows the price at a fixed distance.*

- You enter a distance in dollars or percent in **Trail by**.
- For a long position, the stop sits that far **below the highest price** since the order began, and rises as the stock rises. It never moves down. For a short position it works the other way round.
- When the price falls back by the full distance from its peak, the order fills as a stop.
- The trail moves with each completed one-minute price bar.

Use it to **protect profits** on a trade that is working, without having to keep moving your stop by hand.

## Time in force

| Choice | The order stays until |
|---|---|
| **DAY** | The close of today's session (16:00 New York time), then it expires |
| **GTC** (good till cancelled) | It fills or you cancel it |

The exit legs of a bracket are always GTC. A DAY entry that does not fill by the close expires, and any target and stop that were waiting for it are cancelled.

## Putting orders together

### Single order

One order by itself. This is the default.

### Bracket: "1st triggers OCO"

A bracket is **three orders placed together** to open a position with its exit plan already attached:

1. **Entry.** Any order type that opens a position: Buy or Sell short.
2. **Profit target.** A limit order on the other side, waiting to take your gain.
3. **Stop loss.** A stop, stop-limit or trailing stop on the other side, waiting to cap your loss.

**How it runs:**

- Only the entry is active at first. The target and the stop are **waiting** and show on the chart as dashed lines marked NEXT.
- When the entry **fills**, the target and the stop become active together, for the same number of shares.
- When **either** the target or the stop fills, the other is **cancelled automatically**, so you can never end up with a stray order.
- If the entry is **cancelled** or **expires**, the waiting target and stop are cancelled too.

**Worked example.** AAPL is at 184.30. You want to buy a pullback and risk about 2%:

| Leg | Setting | Meaning |
|---|---|---|
| Entry | Buy limit 182.00, 20 shares | Buy if it dips to 182 |
| Target | Sell limit 191.10 | Take profit near +5% |
| Stop | Sell stop 178.36 | Cut the loss at about −2% |

If the stock falls to 182 you are filled, and the target and stop go live. If it then rises to 191.10 you make about $182. If it instead falls to 178.36 you lose about $73. Either way the other order is cancelled. The ticket shows that as a reward-to-risk of **2.5 to 1**.

### OCO: "one cancels the other"

An **OCO** is **two exit orders** for a position you already hold. It places both at once, and when one fills the other is cancelled.

![An OCO set up to protect a long position: a sell limit above and a stop below](ordertypes-oco.png)

- You choose **Sell** (or **Buy to cover** for a short) with a limit order for the target, and fill in the **stop loss** section for the other leg.
- It is for protecting a position **after** you are in it. For a new trade, use a bracket instead.
- Both orders are active straight away.
- Both orders use the **time in force** you chose. Pick **GTC** if you want the protection to stay in place beyond today.

The percent chips on the stop are measured from the **order's price** (the limit), not from the current price. Check the stop is on the right side of the market, and read the amber warning if it is not.

## Shorting

For a short sale, use **Sell short** to open and **Buy to cover** to close. Everything above works the same way, mirrored: the target sits **below** the entry, the stop **above** it, and a trailing stop follows the **lowest** price instead of the highest.

## Which should I use?

| I want to… | Use |
|---|---|
| Get in or out right now | **Market** |
| Buy cheaper, or sell higher, and I can wait | **Limit** |
| Cut a loss automatically | **Stop** (inside a bracket or OCO) |
| Buy only after the price breaks above a level | **Buy stop**, or **Stop limit** to cap the price |
| Lock in gains on a trade that is working | **Trailing stop** |
| Open a trade with the exit plan attached | **Bracket** |
| Protect a position I already hold | **OCO** |

## Things to remember

- **No order guarantees a price in a fast market.** Stops and market orders can fill worse than shown, particularly across a gap.
- **Paper fills are simulated** from one-minute price bars. If both the stop and the target of a bracket fall inside the same minute, the app assumes the **stop was hit first**. See *How orders are filled*.
- **Check the lines.** After you send an order, the chart shows where it is. See *Order lines on the chart*.
- **Manage orders** in *Active trades*, where you can cancel an order or close a position. To change an order's price, drag its line on the chart (see *Order lines on the chart*).

**Next:** *Account*.
