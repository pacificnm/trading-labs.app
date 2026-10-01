Everything you trade in Trading Lab is **simulated**. No real money moves, and the app is not connected to any brokerage. What makes it useful for learning is that the simulation uses **real market prices**, so a trade you place now is judged by what the market actually does next.

![The Account screen with a fresh paper account](paper-account.png)

## Your paper account

- You start with **$100,000** in cash. You can reset to any amount you like (see below).
- **Equity** (also called net liquidation value) is your cash plus the current value of everything you hold. It is the number in the status bar.
- **Buying power** is how much you can still put into new positions. It uses **2:1 margin**: twice your equity, minus the market value of what you already hold. A fresh account has $200,000 of buying power on $100,000 of equity.
- **Open P/L** is the profit or loss on positions you still hold, measured against the latest price. **Realized P/L** is the profit or loss locked in by closed trades. **Total return** compares your equity with your starting balance.

> Margin works both ways. Buying with borrowed buying power makes gains and losses bigger. Treat the first $100,000 as your real limit while you learn.

## What you can trade

- **US stocks and ETFs**, in **whole shares** (no fractions).
- **Long** trades (Buy, then Sell) and **short** trades (Sell short, then Buy to cover). If you already hold shares, sell them before shorting, and the other way round.
- Options are for research only. You can view chains but cannot trade them.

## How an order gets filled

Orders are checked against the real **one-minute price bars** from your market data feed. The rules are:

| Order | It fills when |
|---|---|
| **Market** | Right away at the live price while the market is open. Placed while the market is closed, it waits and fills at the **opening price** of the next session |
| **Limit** | A bar trades at your limit price or better. Buys fill at your limit or lower, sells at your limit or higher |
| **Stop** | A bar reaches your stop price. It then fills at the stop price, or at the bar's open if the price **gapped** past your stop |
| **Stop-limit** | The stop triggers first, then it behaves as a limit order |
| **Trailing stop** | The stop follows the price by your chosen amount or percent, and fills when the price reverses that far |

Some details that matter when you read your results:

- **Gaps.** If a stock opens past your stop or limit, you get the opening price, not your price. A stop can fill worse than you set it, as it can in real life.
- **Stop or target in the same minute.** In a bracket, if one minute bar touches both your stop and your profit target, the app assumes the **stop was hit first**. That is the cautious choice.
- **Day and GTC.** A **Day** order expires at the 16:00 New York close. A **GTC** (good till cancelled) order stays until it fills or you cancel it.
- **Brackets and OCO.** A bracket places your entry, a profit target and a stop together. The target and stop only start after the entry fills, and when one of them fills the other is cancelled automatically.
- **When the app is closed.** Orders are checked about every 15 seconds while Trading Lab is open. When you open it again, it replays the minute bars from the time you were away, as far back as your data provider offers them.

The order ticket checks each order before sending it and tells you about problems, such as not enough buying power, a stop on the wrong side of the price, or selling shares you do not hold.

## What is not simulated

The simulation is deliberately simple. It does **not** include:

- **Commissions, fees or slippage.** Real trades cost a little more to enter and exit.
- **Partial fills.** An order fills completely or not at all, even for a large size in a thinly traded stock.
- **Extended hours.** Pre-market and after-hours trading are not modelled.
- **Exchange holidays.** The app does not know the holiday calendar.
- **Dividends, splits and borrow fees** on short positions.
- **Taxes.**

Real results will usually be a little worse than the simulation, especially for frequent trading, low-priced stocks and fast markets. Use paper trading to learn process and risk, not to predict exact profits.

## Resetting the account

On the **Account** screen, click **Reset account…** and enter a starting balance. This **deletes all positions, orders and fill history** and starts again. Your journal, watchlists and settings are kept. There is no undo, so use it when you want a clean slate, for example after finishing a set of practice trades.

## Where to go next

- *The order ticket* shows how to place and review an order.
- *Order types, brackets and OCO* explains each order in detail.
- *Active trades* is where you manage working orders and open positions.
- *How orders are filled* repeats the fill rules in more depth.

**Next:** the **Charts** section.
