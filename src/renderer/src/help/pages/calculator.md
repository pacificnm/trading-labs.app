The **Position calculator** answers the most important question before any trade: **how many shares should I buy?** You tell it how much you are willing to lose and where your stop will be, and it works out the number of shares, checks it against your own limits, and shows the likely profit, loss and odds. Open it with the **calculator** icon on the ribbon.

![The setup and the stop and target cards](calculator-setup.png)

## The idea

The size of a trade is decided by **risk**, not by how much you feel like spending.

1. Decide the **most you are willing to lose** on this one trade, for example 1% of your account.
2. Decide where you would **exit if you are wrong** (the stop). The gap between the entry price and the stop is the **risk per share**.
3. Divide the first number by the second. That gives the number of shares.

Example: with a $100,000 account, a 1% risk is **$1,000**. If you buy at $50 with a stop at $48, you risk $2 per share, so you can buy **500 shares**. If your stop were $4 away instead, you would buy 250 shares. A wider stop means a smaller position, so the loss stays the same.

The calculator also applies your **limits**, so the result is never bigger than the rules you set for yourself.

## Setup

| Field | What it does |
|---|---|
| **Symbol** | The stock. It starts on the chart's symbol. Type another and press **Enter**. The small **refresh** icon reloads the live price |
| **Direction** | **Long** (you expect the price to rise) or **Short** (you expect it to fall) |
| **Entry price** | The price you plan to buy at. With **follow live price** ticked it tracks the live price, so every number updates as the price moves. Untick it to fix the entry at a price you choose |
| **Account** | **Paper account** uses your current equity, or **Custom amount** lets you size a trade for a different account |
| **Risk per trade** | How much you are willing to lose: a **% of account** or a fixed number of **Dollars**. The dollar amount is shown beside it |
| **Win rate** | Your guess at how often trades like this win, as a percent. It is used only for expected value |
| **Commission** | The total cost of getting in and out, in dollars. The paper account charges none, so it starts at 0, but you can enter a figure to see how costs affect a trade |

A line at the top of the card shows the live price, and says *loading price…* until it arrives. Without an FMP key, the prices are samples. See *First-time setup*.

## Stop and target

| Field | What it does |
|---|---|
| **Stop loss** | Where you will get out if wrong. Choose **ATR multiple**, **% from entry** or **Price** |
| **Profit target** | Where you plan to take profit. Choose **Multiple of risk (R)**, **% from entry**, **Price** or **No target** |

The card heading shows the stock's **ATR(14)**: the average distance it moves in a day, over the last 14 days. An **ATR multiple** stop (it starts at 1.5) puts your stop that many typical daily moves away from the entry, which adapts to how volatile the stock is.

A **multiple of risk** target (it starts at 2) puts the target a number of risk-distances away. A target of **2R** means you aim to make twice what you risk. See *Order types, brackets and OCO* for stops and targets in an order.

Under each, the calculator spells out the result in plain figures, such as *Stop at 180.87 · 1.86% away · 1.5 ATR · $3.43 risk per share* and *Target at 191.16 · 3.72% away*.

## The result

![The result card and your limits](calculator-result.png)

The large number is the **number of shares**, with the dollar value of the position and what percent of the account it is. The heading says what **limited** the size.

| Figure | Meaning |
|---|---|
| **Risk if stopped** | The most you lose if the stop is hit (including commission), and what percent of the account that is |
| **Reward at target** | What you make if the target is hit, and the **reward-to-risk** ratio, such as *2.00 : 1* |
| **Break-even win rate** | How often you must win to break even at this reward-to-risk. *33%* means you can lose two trades in three and still not lose money |
| **Expected value** | The average result per trade at your win rate: the chance of a win times the reward, minus the chance of a loss times the risk. It is also shown in **R** per trade |

### What limits the size

The share count is the **smallest** of four numbers:

- **Your risk budget**: how many shares keep the loss within the amount you chose.
- **Your max position size**: the most you allow in a single stock.
- **Your max total invested**: the room left under your overall limit.
- **Your buying power**: what the account can actually afford.

When something other than risk is the limit, a message says so and tells you that your **real risk is lower** than you budgeted. In the screenshot, 143 shares are limited by the 25% position rule, so the true risk is $491, less than the $1,060 budget.

### Warnings and errors

The calculator checks your plan and tells you about problems.

- **Errors** (a stop on the wrong side of the entry, a missing price, or no ATR for an ATR stop) show in red, and the share count is zero.
- **Warnings** appear for a stop **under 1 ATR** away (inside normal daily movement, so you may be stopped out by noise), a stop **over 4 ATR** away (a very wide stop), a reward **smaller than the risk**, a **thin** ratio under 1.5 : 1, a position over **half the account**, a **negative expected value**, or a size so small that **even one share** would break a limit.

### Two buttons

- **Open order ticket** goes to the chart and opens the order ticket already filled in: a **limit order** at your entry price for the calculated number of shares. If you set a target, it is a **bracket** with your target and stop attached. With **No target**, it is a single order with no stop attached, and a message tells you to add one if you want it. A note records where the numbers came from. You still review and send it yourself. See *The order ticket*.
- **Save to journal** records the plan in your trading journal as an **idea**, with the entry, stop, target, quantity and summary. A message links straight to it. See *Trading journal*.

Both are only available once the calculation is valid and at least one share fits.

## Your limits

Three rules that protect you from your own enthusiasm. They are **saved automatically**, and Claude can read them when it helps you size a trade.

| Limit | Meaning | Starts at |
|---|---|---|
| **Max risk per trade** | The most you will lose on one trade, as a % of the account | **1%** |
| **Max per position** | The most you will put in one stock, as a % of the account | **25%** |
| **Max total invested** | The most you will have invested across all positions, as a **% of the account** or a fixed **dollar** amount | **80%** of the account |

Each shows the dollar amount it works out to. If you ask for more risk than your rule allows, the calculator uses the rule and tells you.

Below the limits, **Invested now** shows how much you have in positions against your total limit. The darker part of the bar is what you hold, and the lighter part is what this trade would add.

## What if I risk…

![What-if and scenarios tables](calculator-tables.png)

A table that repeats the sizing for **0.25%, 0.5%, 1% and 2%** risk using the same stop. It shows the shares, the position value and the maximum loss at each level, and highlights the row you are using. Sizes are still capped by your limits, so doubling the risk does not always double the shares, as the 1% and 2% rows show above.

## Scenarios

The table shows the profit or loss if the price moves by **−10%, −5%, −2%, +2%, +5% and +10%**, with the price, the dollar result and the percent of the account. A short position gains when the price falls. A note reminds you that **gaps can jump past a stop**, so a real loss can be larger than the plan.

## A good routine

1. Open the chart and decide where the trade is **wrong**. Mark that level with a drawing. See *Drawing tools*.
2. Enter that level as the stop, and note what ATR multiple it works out to.
3. Choose a target, ideally 2R or more, and look at the break-even win rate.
4. Read the warnings, and read what limited the size.
5. Click **Open order ticket** or **Save to journal**.

## Asking Claude

Click **Ask Claude to check** to send your numbers and your rules to the chat panel. Claude checks your stop against the actual chart (support levels and ATR) and tells you whether the size, stop and target make sense and what it would change. Claude can also read and fill in the calculator for you, for example *Size a long on NVDA risking 0.5% with a stop under last week's low*.

**Next:** *Trading journal*.
