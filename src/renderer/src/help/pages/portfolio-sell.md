The **Sell** tab plans a partial sale of a portfolio: you pick a percentage, say how to take it, and the screen works out how many shares of each holding to sell and what that raises. It is meant for moments like a strong market, when you want to **take some profit** without selling everything.

![The Sell tab for a linked portfolio](portfolio-sell.png)

## Plan a sale

1. Open the **Sell** tab.
2. Set the percentage in **Sell [ ]% of the portfolio**, or click one of the quick buttons (**5%, 10%, 25%, 50%**).
3. Choose **Take it from**:
   - **Every holding equally** sells the same share of each holding, so your mix stays as it is.
   - **Overweight first** trims the holdings that are **above their target** first (the ones that have grown the most), and only then takes the rest evenly. This pulls you back toward your targets while you collect profit.
4. Tick **Only holdings that are in profit** if you only want to sell what is up, and leave anything at a loss alone.
5. Read the table, then use the button underneath.

The percentage applies to the value of the holdings that **can be sold from here**: everything you hold in an unlinked portfolio, or the stocks and ETFs the paper account holds in a linked one (mutual funds cannot be traded in the paper account, so they are never included). The line under the percentage shows that amount.

## The table

| Column | Meaning |
|---|---|
| **You hold** | Your shares (and, for a linked portfolio, how many are **free to sell** after any sells already waiting) |
| **Gain now** | How far the price is above or below your average cost |
| **Shares to sell** | What the plan sells. A holding that is skipped says why: *not in profit*, *can't sell here*, *no price* or *cost unknown* |
| **Proceeds** | Shares to sell times the price |
| **Profit on those** | The estimated profit or loss on just the shares being sold: price minus your average cost, times the shares |
| **Left** and **Weight after** | The shares you keep and each holding's share of what is left |

The **Total** row shows the proceeds, the estimated profit, and how close it is to the percentage you asked for.

### Why it is a little under

Only **whole shares** can be sold (fractions only for funds and fractional stocks in an unlinked portfolio), so the plan rounds down and then adds shares to the holdings with the biggest remainders. **It never sells more than the percentage you asked for.** With big share prices it can land a little under, and the Total row says so.

If the holdings that qualify cannot raise the amount you asked for (for example with *Only holdings in profit* on), a note explains by how much.

![A 25% sale taken overweight first, from holdings in profit only](portfolio-sell-profit.png)

In the picture the losing holding (KO) is skipped, the fund is untouched, and the plan sells from the three holdings that are up.

## Carry it out

**Linked to a paper account.** The button says **Sell these in the paper account**. After a confirmation that lists the sales, the estimated proceeds and the estimated profit, it sends **simulated market sell orders**. They fill from market data like any paper order, and you can follow them under *Active Trades*.

- The account must be the **active** account (the screen offers to switch).
- **Whole shares of stocks and ETFs only.** Mutual funds are never sold from here.
- It can only sell shares the account really holds. Shares already in a waiting sell order are not sold twice, and the plan shows them as already gone.
- Orders that cannot be sent are reported one by one, and the others still go through.

**Not linked.** The button says **I sold these: remove them from my holdings**. After you have sold the shares at your broker, it takes them out of your *Holdings* and lowers the recorded cost in proportion, so the average price stays right. It only updates your records.

> Only you can send these orders. **Claude can read a portfolio but can never place, change or cancel an order.**

## Things to know

- **Taxes.** In a real account, selling for a profit can create a tax bill, and the rules depend on how long you held the shares and where you live. The estimated profit here is before tax, and the paper account has no taxes at all.
- **Market orders.** Sales are at the market, so the price you get can differ from the one shown. If the market is closed, the orders wait for it to open.
- **No timing advice.** The app does not know whether the market is "high". Deciding when to take profits is yours, and a sale cannot be undone once it fills.
- **It does not choose which shares.** In a real account you may be able to pick tax lots. Here every sale uses your average cost.

**Next:** *Holdings and value*.
