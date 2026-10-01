The **Account** screen is the scoreboard for your paper trading. It shows how much your account is worth, how much you can still trade with, and how you are doing overall. Open it from the **wallet** icon on the ribbon.

![The Account screen](account-screen.png)

## The six numbers

| Card | What it means |
|---|---|
| **Net liquidation (equity)** | What your whole account is worth right now: your cash plus the current value of the shares you hold. This is the number in the status bar at the bottom |
| **Buying power** | How much you can still use to open new positions. It is twice your equity, minus the market value of what you already hold |
| **Cash** | The money in the account that is not tied up in shares |
| **Open P/L** | The profit or loss on positions you **still hold**, measured against the latest price. It is not locked in, and changes every time the price moves |
| **Realized P/L** | The profit or loss you have **locked in** by closing trades, added up across all of them |
| **Total return** | How far your equity is above or below your **starting balance**, as a percent |

Profits are shown in green with a plus sign, and losses in red with a minus.

### A worked example

In the screenshot, the account started with $100,000 and holds 20 shares of AAPL, bought at $180.00 and now worth $184.30 each. It also made $120 earlier by closing a different trade.

- The 20 shares are worth $3,686, so **equity** is $96,520 cash plus $3,686, which is **$100,206**.
- **Open P/L** is 20 shares times the $4.30 gain, which is **$86**.
- **Realized P/L** is the **$120** already locked in.
- **Total return** is $206 on $100,000, which is **+0.21%**.
- **Buying power** is twice the equity ($200,412) less the $3,686 held, which is **$196,726**.

## How equity and buying power work

- **Equity moves with the market.** While you hold a position, your equity rises and falls with its price. Closing the position turns the open profit or loss into realized profit or loss.
- **Buying power uses 2:1 margin.** You can open positions worth up to twice your equity in total. It goes down as you open positions. When you build an order, the ticket also counts orders that are still waiting to fill, and if there is not enough left it tells you so and will not let you send the order.
- **Shorts count too.** A short position adds cash when you sell, but it is counted as a liability in your equity, so equity still reflects the real profit or loss.
- Using the extra buying power makes both gains and losses larger. Many people practising keep their positions well inside their own cash.

## How up to date is it?

Prices in the Account screen come from the live feed. The numbers refresh about every 20 seconds while the app is open, and straight after you place, change or fill an order. If a live price is not available for a stock you hold, the screen values that position at what you paid, and the open profit or loss for it is left out until prices return.

## Resetting the account

Click **Reset account…** to start over.

![The reset dialog](account-reset.png)

1. A box opens asking for the **starting balance**, filled in with your current one.
2. Type any amount greater than zero. Dollar signs and commas are fine, for example `$25,000`.
3. Click **Reset**. A message confirms the new balance.

**What a reset does:**

- Deletes **all positions, orders and fills**.
- Sets your cash and starting balance to the amount you entered.
- **Keeps** your journal entries, watchlists, chart settings and drawings, keys and strategy progress.

It cannot be undone. The old results are gone from Account and Active Trades, although any journal entries you wrote about those trades stay.

### When to reset

- You want a **clean slate** after a stretch of practice trades.
- You want to practise with a **different size account**, such as $10,000 to see how risk and position size feel with less money. Smaller accounts are a good way to learn.
- Something went wrong while testing and you want to start again.

## What is not on this screen

The Account screen shows totals only. To see **what you hold**, your working orders, and your trade history, go to **Active Trades**. See *Active trades*. For the rules behind the numbers, see *How paper trading works*.

## Asking Claude

Claude can read the same account summary. Ask *How is my account doing?*, *How much risk am I taking right now?* or *How big could my next position be?* and Claude will answer from your real balance and open positions. Claude can read your account but cannot change it or place orders.

**Next:** *Active trades*.
