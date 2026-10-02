The **Portfolio** screen is for planning and tracking a longer-term collection of investments: stocks, ETFs and mutual funds. You choose what to own and what share of your money each should get, the screen works out how many shares that buys, and you record what you hold to see what it is worth today.

It works like three tools in one: a **watchlist** (the holdings and their live prices), a **calculator** (the shares to buy), and a **holdings tracker** (value, gain and loss).

![The Portfolio screen with five holdings](portfolio-plan.png)

> **A portfolio never trades by itself.** On its own it is a planning and record-keeping tool: no brokerage connection, nothing bought or sold. If you **link it to a paper account** (below), it can send **simulated** paper orders (buy the plan, or sell a percentage), but only when you click a button and confirm. It is never connected to a real account, and Claude cannot change it or send orders.

Open it from the **pie chart icon** in the ribbon on the left.

## Start a portfolio

The first time, the screen invites you to create one.

![The Portfolio screen before any portfolio exists](portfolio-empty.png)

1. Click **Create your first portfolio** (or the **+** next to the tabs), type a name such as *Retirement* and click **Create**.
2. Set the **Investment amount**: the money you plan to invest. You can change it any time.
3. **Add holdings** (below).
4. Give each holding a **Target %**: its share of the amount. Use **Equal weight** to split evenly, or type your own, and use **Make it 100%** to scale your numbers so they add up to exactly 100.

You can keep **several portfolios** (a retirement account, a college fund, a practice mix). They show as tabs, the same way watchlists do. Rename or delete one with the **pencil** and **bin** icons at the right of the tabs. Deleting a portfolio removes only your plan and records here.

## Link it to a paper account

A portfolio can **follow one of your paper accounts**, so the numbers are tied to the account instead of typed by hand. Choose the account in the **Paper account** menu on the Plan tab.

![A portfolio linked to a paper account](portfolio-linked.png)

When it is linked:

- **The money is the account's cash.** The amount is no longer typed: it is the account's **available cash** (its cash, limited by buying power, and less any market buys that have not filled yet). The screen shows it as *holdings + cash = total*.
- **Your holdings are the account's positions.** Shares and cost for stocks and ETFs come from the account and update as orders fill. You cannot edit them here, because the account is the record.
- **The plan tops up what is under target.** It treats your percentages as shares of *holdings plus cash* and spends only the cash on hand, so once your orders fill, the plan has **nothing left to buy**. Clicking it twice never buys the same shares twice.
- **Mutual funds are the exception.** The paper account cannot trade funds (it fills orders from intraday prices, and funds only have one price a day). Fund holdings stay as the shares you type, they count in your totals, and the plan never buys them. If a fund is under its target, the screen says by how much, so you can buy it at your fund company.
- **Buy these in the paper account** sends simulated **market** orders for the whole-share stocks and ETFs in the plan, and **Sell these in the paper account** (on the Sell tab) sells a percentage of what the account holds. You see the list and confirm first. See *The allocation calculator* and *Selling a share of the portfolio*.
- The paper account must be the **active account** to send orders, because orders always go to the active account. If it is not, the screen says so and offers to make it active. Values still show either way.

Unlink it any time by choosing **Not linked**. The numbers you had typed are still there.

## Add stocks, ETFs and mutual funds

Type a name or ticker in the search box and press **Enter**, or click a result.

![Searching for a symbol to add](portfolio-add.png)

- The **type** menu next to it sets what you are adding: **Stock**, **ETF** or **Mutual fund**. **Auto-detect** treats a five-letter ticker ending in **X** (such as *VFIAX*) as a mutual fund, and anything else as a stock. You can leave it on Auto-detect and it is easy to pick the type yourself if it guesses wrong.
- The type matters for the calculator: **mutual funds can be bought in fractions of a share** (often by dollar amount), so they are never rounded to whole shares. Stocks and ETFs are whole shares unless you tick **Allow fractional shares**.
- Click a symbol in the table to open its chart.
- The **x** at the end of a row removes the holding from the portfolio.

## What the numbers on top mean

| Card | Meaning |
|---|---|
| **Value of what you hold** | Today's value of the shares you have recorded |
| **Total paid** | What you paid for those shares |
| **Gain / loss** | Value minus total paid, in dollars and percent |
| **Plan for $…** | What the calculator would spend for your amount, and how much would be left over |

## Three tabs

- **Plan & calculator**: targets, the amount to invest and how many shares to buy. See *The allocation calculator*.
- **Sell**: pick a percentage of the portfolio to sell, to take profits. See *Selling a share of the portfolio*.
- **Holdings**: the shares you own, what you paid, today's value and gain, and how far each holding has drifted from its target. See *Holdings and value*.

## Prices

Live prices come from your market data plan and refresh about **every minute**. If there is no market data key, or a symbol has no price (some mutual funds do not), a box appears in the **Price** column. Type a price there and the calculator and the totals use it. A typed price is only used when no live price is available.

> Mutual funds are priced **once a day, after the market closes**, at their net asset value. Their price will not move during the day, and what you actually pay is the next close.

## Ask Claude to review it

**Ask Claude to review** (top right) opens the chat with a request to read the portfolio. Claude can compare your holdings with your targets, point out concentration (too much in one stock or one theme) and explain your gains and losses. It can only read the portfolio. It cannot change it, record a purchase or buy anything, and what it says is education, not personal financial advice. See *What Claude can do*.

## Your data

Portfolios, and which account each follows, are stored in your database, so **File → Back Up Data…** includes them. See *Data, cache and backups*.

**Next:** *The allocation calculator*.
