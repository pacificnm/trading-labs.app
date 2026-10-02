The **Stock Screener** narrows thousands of stocks down to a short list that fits rules you choose: a sector, a size, a price range, how much a stock trades, how much it moves. It is the quickest way to find candidates to study. Open it with the **magnifier** icon on the ribbon.

> A screen only produces a **list worth looking at**. It is not a list of things to buy. Always check the chart, the fundamentals and the news before deciding anything.
>
> The companies in the screenshots are **made-up examples** (*Sample Company 4* and so on) with invented figures.

![The screener with the Dividend payers preset applied](screener-filters.png)

## Start from a preset

The row of buttons at the top, labeled **Start from**, sets up a whole screen with one click and runs it straight away. Under the buttons, a line explains what the chosen preset is looking for.

| Preset | What it selects |
|---|---|
| **Large-cap leaders** | Companies worth $10 billion or more that trade at least 2 million shares a day: liquid and well covered |
| **Dividend payers** | Established companies ($2B+) yielding at least 3% a year. Check that the payout is safe before trusting a high yield |
| **Unusual volume** | Stocks trading at least twice their normal volume today, priced at $5 or more. Something is happening, so find out what |
| **Low-beta defensives** | Larger companies that historically move less than the market (beta under 0.8) |
| **High-beta tech** | Technology companies that swing more than the market (beta over 1.5): bigger moves both ways |
| **Liquid small caps** | Companies between $300M and $2B that still trade enough shares to get in and out |
| **Active ETFs** | Exchange-traded funds trading at least a million shares a day |

A preset replaces all your filters. **Reset** returns to the starting defaults. After choosing a preset you can change any filter and click **Run screen** to refine it.

## The filters

| Filter | What it does |
|---|---|
| **Sector** and **Industry** | Limit to one sector or industry. **Any** means no limit |
| **Exchange** | **Any**, **NASDAQ**, **NYSE** or **AMEX** |
| **Country** | The company's home country. It starts on **US** |
| **Type** | **Stocks**, **ETFs**, or **Stocks and ETFs** |
| **Size** | A shortcut for market cap: *Micro* (under $300M), *Small* ($300M to $2B), *Mid* ($2B to $10B), *Large* ($10B to $200B) or *Mega* (over $200B). It shows **Custom** when you type your own numbers |
| **Market cap min** and **max** | In **millions of dollars**. *Market cap* is the total value of a company's shares |
| **Price min** and **max** | The share price in dollars |
| **Volume min** | The minimum number of shares traded today. A higher number means the stock is easier to buy and sell |
| **Relative volume min** | Today's volume divided by the stock's average volume. *2* means twice the usual. It finds stocks that are unusually busy |
| **Beta min** and **max** | How much a stock moves compared with the market. About 1 moves with the market, above 1 moves more, below 1 moves less |
| **Dividend yield min** | The yearly dividend as a percent of the price |
| **Max results** | **100**, **250**, **500**, **1000** or **3000** |
| **actively trading only** | Leaves out stocks that are not trading |

The starting filters are **US stocks, market cap of at least $300 million, volume of at least 200,000 shares, actively trading, up to 250 results**. Blank boxes mean no limit.

### Running it

- Change any filter, then click **Run screen**. The button is only available when something has changed.
- **Refresh** fetches fresh data from your provider, ignoring the saved copy. Otherwise, to limit requests, results are reused for a while. The *As of* time shows when the data was loaded.
- **Dividend yield** and **Relative volume** are worked out inside the app, so when either one is used the screen scans up to **3,000** stocks. This takes a moment longer.

## The results

![The results list](screener-results.png)

The heading shows how many stocks match, for example *48 matches of 288 checked*, where the second number is how many came back before the yield and relative volume filters were applied. If the list is cut off by **Max results**, it says so and suggests raising the limit or adding filters.

Under the heading, **Median market cap** and **sector chips** summarize what the screen found, so you can see at a glance which sectors dominate the list.

### The table

| Column | Meaning |
|---|---|
| **Symbol** | The ticker and the exchange. **Click the ticker** to open its chart |
| **Company** | The name, with a small **ETF** or **fund** tag where it applies |
| **Sector / industry** | The sector, with the industry below |
| **Market cap** | The company's size, such as *$3.06T* (trillions) or *$964.5B* (billions) |
| **Price** | The latest price |
| **Volume** | Shares traded today, in a short form such as *9.6M* |
| **Rel. vol** | Relative volume. A value of **2.0× or more** is shown in green |
| **Beta** | Movement compared with the market |
| **Yield** | Annual dividend as a percent of the price, or a dash if none |
| **+** | Adds the stock to your active watchlist |

- **Click a column heading** to sort by it, and click again to reverse. The arrow shows the direction. The list starts sorted by **market cap, largest first**. Blank values always go to the end.
- The table shows **100 rows at a time**. **Show 100 more** reveals the next batch.

### Saving and sharing results

- **Ask Claude** sends your current screen to the chat panel so Claude can explain what it selects, point out anything odd and suggest a few names to look at more closely. See below.
- **Save top 50 as watchlist** asks for a name and creates a new watchlist from the first 50 rows in the current order. A message offers a **View** link to open it. See *Watchlists*.
- **Copy CSV** copies the whole list to your clipboard, ready to paste into a spreadsheet.

## Putting it to use

1. **Pick a question first.** *Which large companies are unusually busy today?* is a better start than clicking every filter.
2. **Choose a preset close to it**, then adjust the filters until the list is a manageable size.
3. **Sort by what matters.** For unusual volume, sort by **Rel. vol**. For income, sort by **Yield**.
4. **Open the chart** of each candidate and look at the trend. See *The chart screen*.
5. **Check the story.** Open *Symbol news*, *Fundamentals* and *Analyst reports* for the ones that still look interesting.
6. **Save the survivors** to a watchlist and keep watching them.

### Watch out for

- **Thin trading.** Stocks with low volume are hard to trade. Keep a sensible **Volume min**.
- **Very high yields.** A yield far above average can mean the market expects the dividend to be cut.
- **Very high relative volume.** It tells you something is happening, not whether it is good or bad.
- **Data is a snapshot.** Prices and volume are live, but the list is a moment in time.

## When something is missing

- **Without an FMP key**, the screen asks you to add one. See *First-time setup*.
- **An error message with Retry** appears if the screen could not be loaded.
- *No stocks match.* appears with advice to loosen a filter, for example by lowering the market cap or volume minimum.
- Which sectors, industries and countries appear in the dropdowns depends on what your provider lists.

## Asking Claude

Click **Ask Claude** to send a request that includes your exact filters. Claude runs the same screen, explains what it actually selects for, points out oddities in the results, and suggests what to check next. Claude can also run a screen for you from a plain request, such as *Find large US companies with unusually high volume today*. It treats the results as ideas to investigate, never as recommendations.

**Next:** the **Planning and learning** section, starting with *Watchlists*.
