**Senate & House Trades** lists the stock trades that members of the US Congress report. By law they must publish these, and the screen turns the public filings into something you can scan, filter and learn from. Open it with the **building** icon on the ribbon.

> **Read this first.** Members of Congress have **up to 45 days** to report a trade, and they report **dollar ranges**, not exact amounts. By the time a filing appears, the price has usually moved. This is a fascinating dataset and a **poor trading signal**. Use it to learn how disclosures work, not to copy trades. Nothing here is investment advice.
>
> The names and trades in the screenshots on this page are **invented examples** (people called *Jordan Sample* and *Alex Example*), not real members.

![The Latest disclosures tab](congress-latest.png)

## The three tabs

| Tab | Shows |
|---|---|
| **Latest disclosures** | The most recent filings across all members |
| **By symbol** | Every trade in one stock |
| **By member** | One member's reported trades |

At the right of the tabs, the **chamber** dropdown chooses **Senate + House**, **Senate only** or **House only**. It applies to all three tabs.

Each tab has a **data as of** line, an **Ask Claude** button and a **Refresh** button. The information is saved to limit requests to your provider, and **Refresh** fetches it again straight away.

### Latest disclosures

The newest filings first. It loads the 100 most recent for each chamber, and **Load older disclosures** at the bottom adds another batch.

### By symbol

Type a ticker in the **Symbol** box and click **Look up** (or press **Enter**). It starts on the symbol you are viewing in the app, and follows it when you change symbol.

![The By symbol tab](congress-symbol.png)

The heading reads like *AAPL in Congress*. Use it to see who traded a stock, when, and whether purchases or sales dominate.

### By member

Type at least **two letters** of a member's **first or last name** and click **Search**.

![The By member tab](congress-member.png)

- If **one** member matches, their trades appear with a heading showing their name, chamber and state or district.
- If **several** match, a row of buttons lists them with their chamber, district and number of trades. Click one to choose.

## The summary card

The first card sums up the trades in the current view, after any filters. Its heading shows the date range of the trades.

| Figure | Meaning |
|---|---|
| **Trades** | How many filings are in view |
| **Purchases** | The number of buys, with the estimated dollar total |
| **Sales** | The number of sells, with the estimated dollar total |
| **Net (est.)** | Purchases minus sales, in green for **net buying** and red for **net selling** |
| **Median filing delay** | The typical number of days between a trade and its disclosure, with the longest delay below it |

Because amounts are filed as **ranges** such as *$15,001 - $50,000*, the dollar totals use the **middle of each range**. They are rough estimates.

## The most traded card

Quick chips showing what stands out in the current view:

- **Symbols**: the most traded stocks, with how many trades each and, when more than one member traded it, how many **members**. **Click a symbol** to open its chart. Hover to see the split into purchases and sales. Many trades by **one** member in a stock is usually a single position being built or sold, not many independent decisions.
- **Members**: the most active members and their number of trades (not shown on the By member tab).
- **Assets**: the types of asset, such as *Stock* or *Corporate Bond*.

## The disclosures table

Every filing is a row.

| Column | Meaning |
|---|---|
| **Disclosed** | The date the filing was made public |
| **Traded** | The date of the trade, with a small tag showing the **delay in days**. The tag turns **red** when the filing came **after the 45-day deadline** |
| **Member** | Their name, chamber (**Senate** or **House**) and state or district |
| **Symbol** | The ticker. Click it to open the chart |
| **Asset** | The full name and the type of asset |
| **Type** | **Purchase** (green) or **Sale** (red), including partial sales |
| **Amount** | The dollar **range** on the filing |
| **Owner** | Whose account the trade was in, such as *Self*, *Spouse* or *Joint* |
| the arrow icon | Opens the **official filing** in your browser |

### Filtering

Above the table, drop-downs and a box narrow what you see. The heading shows how many are showing, for example *18 of 18*.

- **Buys and sales**, **Purchases only** or **Sales only**.
- **All assets** or **Stocks only**, which leaves out bonds, funds and options.
- **Any owner**, or a particular one, such as *Spouse*.
- **Filter…** searches member names, symbols, asset names and districts.

## Reading the data sensibly

- **It is history.** Compare the trade date with the price on the chart. See *The chart screen*. The price move since then is usually larger than any edge.
- **Amounts are ranges.** A purchase of *$1,001 - $15,000* is small, and the top range may be a million or more. Do not add them up as though they were exact.
- **Spouse and joint accounts count.** A trade may not be a decision by the member.
- **Look for patterns, not single trades.** Several unrelated members buying the same stock is more interesting than one filing.
- **Context matters.** Members may sell for tax, family or legal reasons that have nothing to do with the stock's outlook.
- **Late filings** (the red delay tags) are worth noticing, but they say more about the filing than about the trade.

## When something is missing

- **Without an FMP key**, the screen asks you to add one. See *First-time setup*.
- **An error message with Retry** appears if the data could not be loaded. Some plans do not include the disclosure feeds; when none is available this screen is hidden from the ribbon, and **Settings → What your FMP plan includes** says so.
- *No trades match.* appears when the filters hide everything.
- On **By member**, the screen asks you to enter a name before it shows anything.

## Asking Claude

Click **Ask Claude** to send a ready-made request about the current tab: the latest disclosures, one symbol, or one member. Claude reads the same data and summarizes who traded, buys against sells, filing delays, and how much weight to put on it. You can also ask your own questions, such as *Did several members trade the same stock this month?* Claude will remind you to treat the data as history and not as a signal.

**Next:** *Stock screener*.
