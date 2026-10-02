The **Account** screen is where you manage your **paper accounts** and see how each one is doing. You can keep several, each set up to mirror one of your real accounts, so your practice trading matches the money you actually have. Open it from the **wallet** icon on the ribbon.

![The Account screen with two paper accounts](account-screen.png)

Every account here is **paper money**, even when it is named after a real brokerage. Nothing connects to a real account, and no real trade can be placed.

## Your accounts

The list on the left shows each account with its brokerage and current value. The highlighted one is the **active account**.

- **Click an account to make it active.** The whole app then works on that account: the status bar, the order ticket, Active Trades, the position calculator and Claude all use it. The status bar at the bottom always shows which one is active, and clicking it brings you back to this screen.
- **New account** opens a form for the name, the account type, the brokerage, a link to the real account and a starting balance. See *Setting up an account* below.
- **Delete account** removes an account together with its positions, orders and history. You always keep at least one account.

### What each account keeps separate

Positions, orders, fills, cash, the starting balance and balance changes all belong to one account. Your journal, watchlists, chart settings, strategy progress and keys are shared by all of them.

- **New orders go to the active account.**
- **Working orders in your other accounts keep filling** in the background while the app is open, so an order you left in one account is not forgotten when you switch.
- **If you switch accounts while an order ticket is open, the ticket closes**, so a half-built order can never be sent to the wrong account.
- **Claude only sees the active account**, and can read it but cannot create, change, switch or fund accounts. See *Asking Claude* below.

## Setting up an account

Click **New account**, or open an account and use **Account details** to change one later.

| Field | What it is for |
|---|---|
| **Account name** | Anything you like, for example *Roth IRA* or *Taxable*. You can rename it at any time |
| **Account type** | **Margin** or **Cash**. This decides how buying power works. See below |
| **Brokerage** | The firm that holds the real account. Suggestions are offered for common brokerages, and you can type any name |
| **Link to the real account** | A web address (starting with `https://`) for the real account's page. An **Open <brokerage>** button then appears at the top of the account and opens it in your browser |
| **Starting balance** | The cash the account begins with. Only asked when creating an account; to change it later use *Match my real balance* |

### Cash and margin accounts

Choose the type your real account has, so the numbers behave like the real thing.

| | Buying power | Short selling |
|---|---|---|
| **Margin account** | Twice your equity, minus the market value of what you hold (2:1) | Allowed |
| **Cash account** (also used for IRAs and similar) | Just your cash. No borrowing | **Not allowed.** The ticket refuses a short sale and says why |

In both, orders that are still waiting to fill set money aside, so **Buying power available** is what you can really use right now. Accounts created before this feature existed are margin accounts until you change them.

## Matching your real balance

Under **Match my real balance**, type your real cash balance and click **Set cash balance**.

- The difference from the current cash is recorded as a **deposit** or **withdrawal**. The latest few are listed underneath.
- Your **starting balance moves with it**, so **Total return** keeps measuring your trading and not money you added or took out.
- **Positions are not changed.** If your real account holds shares, you can paper-buy them to match.

## The six numbers

| Card | What it means |
|---|---|
| **Net liquidation (equity)** | What the whole account is worth right now: its cash plus the current value of the shares it holds. This is the number in the status bar at the bottom |
| **Buying power available** | How much you can still use to open new positions, after setting aside the cost of orders that are waiting to fill |
| **Cash** | The money in the account that is not tied up in shares |
| **Open P/L** | The profit or loss on positions you **still hold**, measured against the latest price. It is not locked in, and changes every time the price moves |
| **Realized P/L** | The profit or loss you have **locked in** by closing trades, added up across all of them |
| **Total return** | How far your equity is above or below your **starting balance**, as a percent |

Profits are shown in green with a plus sign, and losses in red with a minus.

### A worked example

Take a **margin account** that started with $100,000. It holds 20 shares of AAPL, bought at $180.00 and now worth $184.30 each, and it earlier made $120 by closing a different trade.

- The 20 shares are worth $3,686, so **equity** is $96,520 cash plus $3,686, which is **$100,206**.
- **Open P/L** is 20 shares times the $4.30 gain, which is **$86**.
- **Realized P/L** is the **$120** already locked in.
- **Total return** is $206 on $100,000, which is **+0.21%**.
- **Buying power** is twice the equity ($200,412) less the $3,686 held, which is **$196,726**, before any waiting orders are set aside. In a **cash account** with the same cash it would be **$96,520**.

## How equity and buying power work

- **Equity moves with the market.** While you hold a position, your equity rises and falls with its price. Closing the position turns the open profit or loss into realized profit or loss.
- **Buying power goes down as you use it.** Opening positions uses it up, and so does a buy order that has not filled yet. When you build an order, the ticket checks it against what is available and will not let you send one that is too big.
- **Shorts count too** (margin accounts only). A short position adds cash when you sell, but it is counted as a liability in your equity, so equity still reflects the real profit or loss.
- Using the extra buying power of a margin account makes both gains and losses larger. Many people practising keep their positions well inside their own cash.

## How up to date is it?

Prices in the Account screen come from the live feed. The numbers refresh about every 20 seconds while the app is open, and straight after you place, change or fill an order. If a live price is not available for a stock you hold, the screen values that position at what you paid, and the open profit or loss for it is left out until prices return. The values beside each account in the list are refreshed at the same time.

## Resetting an account

Click **Reset account…** to start one account over. It only affects the account you have open; **your other accounts are not touched.**

![The reset dialog](account-reset.png)

1. A box opens asking for the **starting balance**, filled in with the current one.
2. Type any amount greater than zero. Dollar signs and commas are fine, for example `$25,000`.
3. Click **Reset**. A message confirms the new balance.

**What a reset does:**

- Deletes the account's **positions, orders and fills**, and its list of deposits and withdrawals.
- Sets its cash and starting balance to the amount you entered.
- **Keeps** the account's name, type, brokerage and link, and your journal entries, watchlists, chart settings and drawings, keys and strategy progress.

It cannot be undone. The old results are gone from Account and Active Trades, although any journal entries you wrote about those trades stay.

### When to reset

- You want a **clean slate** after a stretch of practice trades.
- You want to practise with a **different size account**, such as $10,000 to see how risk and position size feel with less money. Smaller accounts are a good way to learn.
- Something went wrong while testing and you want to start again.

To keep one account's history and still try something different, create **another account** instead of resetting.

## What is not on this screen

The Account screen shows totals only. To see **what you hold**, your working orders, and your trade history, go to **Active Trades**, which shows the active account. See *Active trades*. For the rules behind the numbers, see *How paper trading works*.

## Portfolios that follow an account

A **portfolio** (see *Portfolio*) can be linked to a paper account. It then takes its cash and its stock and ETF holdings from this account, and its **Buy these** and **Sell these in the paper account** buttons send ordinary simulated market orders to it. Resetting or deleting an account therefore changes what a linked portfolio shows: its holdings become empty, and if the account is deleted the portfolio is unlinked and keeps the numbers you had typed.

## Asking Claude

Claude can read the active account's summary, including its name, brokerage and type. Ask *How is my account doing?*, *How much risk am I taking right now?* or *How big could my next position be?* and Claude will answer from that account's real balance and open positions. To ask about another account, switch to it first.

Claude can read your account but cannot change it, switch accounts, change a balance or place orders.

**Next:** *Active trades*.
