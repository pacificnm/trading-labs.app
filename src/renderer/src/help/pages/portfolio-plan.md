The **Plan & calculator** tab turns percentages into shares. You tell it how much money you have and what share each holding should get, and it tells you how many shares to buy.

![The Plan and calculator tab](portfolio-plan.png)

## The settings

| Setting | What it does |
|---|---|
| **Investment amount** | The money to work with |
| **The amount is: New money / Total size** | Whether the amount is cash you are adding now, or the size you want the whole portfolio to reach (see below) |
| **Allow fractional shares of stocks and ETFs** | Lets the calculator buy part of a share. Mutual funds always allow it |
| **Spend leftover cash on extra shares** | After rounding down, uses what is left to buy extra whole shares, most under-target first |
| **Targets add up to** | The sum of your percentages. Green at 100% |

## The table

| Column | Meaning |
|---|---|
| **Target %** | The share of the amount for this holding. Click the number to change it |
| **Price** | The latest price (or the one you typed) |
| **Amount for it** | The target percentage of the amount, in dollars |
| **Shares to buy** | How many shares that buys, rounded **down** so you never go over |
| **Cost** | Shares to buy times the price |
| **You hold** | Shares you have recorded in *Holdings* |
| **After buying** | Your shares afterwards, and the holding's share of the portfolio |

The last row totals the targets and the cost, and shows how much is **left over**.

### A worked example

With **$25,000** as new money, a 40% target for a fund priced at $365.45 gets **$10,000**. Funds can be fractional, so that buys **27.363 shares** costing $9,999.81. A 20% target for a stock at $184.30 gets $5,000. That is 27.13 shares, but the stock has to be whole shares, so the calculator buys **27** for $4,976.10 and the remaining $23.90 stays as cash. Across all five holdings the plan spends $24,771.56 and **$228.44 is left over**. Tick **Spend leftover cash** and it uses most of that on extra whole shares, starting with the holding furthest below its target.

## New money or total size

**New money** is the simple case: the amount is split by your percentages, whatever you hold already.

**Total size** is for topping up a portfolio you already hold. The amount is the size you want the **whole portfolio** to reach, and what you hold now counts toward it.

![Total size mode with two holdings](portfolio-total.png)

In the picture the portfolio should reach $20,000, and the two holdings are worth $9,777, so **$10,223 of new cash** is needed. The calculator works out what each holding is short of its target, and shares that cash between them in proportion. Anything already **over** its target is left alone and shown as "over target by $…". The app **never tells you to sell**: that is up to you.

## Linked to a paper account

![A linked portfolio before buying](portfolio-linked.png)

With a **paper account** chosen, the amount and the holdings come from the account (see *Portfolio*), and the settings for the amount, **New money / Total size** and fractional shares are replaced by one line: *Invests the account's available cash*. The plan always works in total-size style: your percentages apply to **holdings plus cash**, and only the cash is spent.

In the picture the account has $25,000 and the portfolio already holds a mutual fund worth $6,760.83, so the total is $31,760.83. The fund is 40% of that, but it **cannot be bought in the paper account**, so its $5,943.50 shortfall stays as cash and a note says so. The four tradable holdings are topped up with the rest, which is why **$6,373.40 is left over**.

### Buy these in the paper account

The button sends a **market order** for every holding with shares to buy, after a confirmation that lists them. These are **simulated** orders in your paper account: they are filled from market data like any order you place on the ticket, and you can follow them under *Active Trades*. Rules the app enforces:

- the linked account must be the **active** account;
- **whole shares of stocks and ETFs only**: mutual funds and fractions are never sent;
- if the market is closed or the data plan cannot fill them yet, the orders wait and the plan counts them as already held, so it does not buy twice.

Orders that cannot be sent (for example not enough buying power) are reported one by one, and the others still go through.

![The same portfolio after the orders filled](portfolio-linked-after.png)

After the orders fill, the holdings come from the account's positions and cash has dropped, so every row says **0 shares to buy**. That is the "in alignment" state: your account matches your plan, as closely as whole shares allow.

> Only you can send these orders. **Claude can read a portfolio but can never place, change or cancel an order**, here or anywhere else.

## Percentages that do not add up

- Under 100%: the unassigned part stays as cash, and a note tells you how much.
- Over 100%: the plan wants more than the amount and a red note warns you. Fix it by hand or click **Make it 100%**.

## "I bought these"

After you have really bought the shares at your broker, click **I bought these: add them to my holdings**. After a confirmation, the shares and their cost are **added** to your holdings at today's prices, and the screen switches to *Holdings*. You can correct the numbers there if your actual fills were different.

This button only updates your records in Trading Lab. It does not buy anything.

## Things to know

- **Rounding.** Shares are rounded down (to whole shares, or to a thousandth of a share for funds and fractional stocks), so the plan never overspends.
- **Fees and slippage.** The calculator ignores commissions, spreads and price moves between now and your order, and the paper account models none of them either. Leave a little cash.
- **Prices move.** The plan uses the latest price on screen. Re-check it just before you trade.
- **Education only.** The percentages are yours. The app does not know your goals or tell you what to own.

**Next:** *Selling a share of the portfolio*.
