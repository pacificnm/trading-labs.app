**Analyst Reports** collects what professional analysts think of a stock: how many say buy or sell, what price they expect, how the opinions have changed, and what they forecast for sales and profit. Open it with the **document** icon in the chart header, between Quote Details and Fundamentals.

![The Analyst Reports screen](analyst-screen.png)

> Analysts are people with opinions, and often with business ties to the companies they cover. Their ratings lean positive and their price targets tend to follow the price rather than lead it. Use this screen for context, not as a signal.

Like the other symbol screens, it shows a **Data as of** line at the top with a **Refresh** button. Analyst information changes slowly, so the app keeps it for hours before asking for it again. Refresh gets the latest straight away.

## Analyst consensus

![Consensus, price target consensus and price target trend](analyst-top.png)

The first card sums up the ratings from all analysts covering the stock.

- The **large word** is the overall verdict, for example **Buy**, **Hold** or **Sell**.
- The **bar** shows how many analysts fall into each group, with the number in each section. The five groups are **Strong Buy**, **Buy**, **Hold**, **Sell** and **Strong Sell**, from green through yellow to red.
- The heading shows the total number of analysts.

A stock with 14 Strong Buy, 21 Buy, 12 Hold, 2 Sell and 1 Strong Sell is rated by 50 analysts, and most lean positive. Most stocks have far more Buy ratings than Sell ratings, because analysts rarely recommend selling. A Hold often means "not a bargain at this price".

## Price target consensus

Analysts also give each stock a **price target**, which is where they think it will trade in about a year.

- The **range bar** runs from the lowest target to the highest, with a marker for the **current price**.
- **Consensus** is the average of all targets. **Median** is the middle target, which is less affected by extreme ones.
- **High** and **Low** are the most optimistic and the most pessimistic targets.
- The number in brackets beside each figure is how far it is above (green) or below (red) the current price.

If the consensus target is 11% above the price, analysts on average see about 11% of upside. A price already above the highest target is a sign that opinion is lagging the market.

## Price target trend

A table of the average target over four periods: **Last month**, **Last quarter**, **Last year** and **All time**.

| Column | Meaning |
|---|---|
| **Targets** | How many price targets were published in that period |
| **Average** | The average target |
| **vs price** | How far that average is above or below the current price |
| **Bar** | The average drawn as a bar so the periods can be compared |

If recent averages are higher than older ones, targets are being raised, which usually follows good news. The **Sources** below the table name the publishers the data came from.

## Ratings snapshot

![Ratings snapshot, rating history and estimates](analyst-middle.png)

> This card is the data provider's **own score**, worked out by formula from the company's financial figures. It is **not an analyst's opinion**.

The big circle shows an **overall letter grade**, from A (strong) down to F (weak), with the matching score out of 5. Next to it, six factors are each scored from **1 (weak) to 5 (strong)**, shown as five small blocks:

| Factor | What it looks at |
|---|---|
| **Discounted cash flow** | Whether the price looks cheap or expensive compared with the company's estimated future cash |
| **Return on equity** | How much profit the company makes from shareholders' money |
| **Return on assets** | How much profit it makes from everything it owns |
| **Debt to equity** | How much it borrows compared with shareholders' money |
| **Price to earnings** | How the price compares with its profits |
| **Price to book** | How the price compares with the value of its assets |

More blocks filled in means a stronger result on that factor. A company can score well on profitability but poorly on valuation, as in the screenshot, so look at the individual rows and not only the letter.

## Rating history

A step chart of the **overall score (1 to 5)** over about the past year. The line steps up or down when the score changes. A **dot** marks each day the **letter grade** changed, and hovering a dot shows the change, for example *B → A*. The first and last dates appear along the bottom.

A rising line means the stock's fundamentals have been improving by this scoring, and a falling line means they have weakened.

## Analyst estimates

![Analyst estimates by fiscal year](analyst-estimates.png)

Forecasts for the company's **revenue** (sales) and **EPS** (earnings per share) for each **fiscal year**, starting from the last one reported.

- A tag beside the year says whether it is **reported** (the real results are in) or **est.** (still an estimate).
- **Revenue** and **EPS** show the actual figure for reported years and the analysts' average estimate for future years. Revenue is shown in a short form, such as *$408B* for 408 billion dollars.
- **Growth** next to each is the change from the row above, in green or red.
- **Analysts** is how many analysts contributed to the estimate. Few analysts cover the later years, so treat those numbers loosely.
- For a **reported** year, a small line under the figure says whether the company **beat** or **missed** what analysts expected, and by what percent.
- **Hover** over a revenue or EPS figure to see the lowest and highest estimate.

Companies whose results beat expectations often see the share price rise, but only when the beat is bigger than what was already priced in. A beat is not a promise of a rising price.

## Recent rating changes

A list of the latest actions by individual firms, newest first.

| Column | Meaning |
|---|---|
| **Date** | When the firm published it |
| **Firm** | The research firm or bank |
| **Action** | **upgrade** (more positive), **downgrade** (more negative), **maintain** (no change) or similar |
| **Rating** | The new rating, shown as *old → new* when it changed |

The firms use their own words for ratings, such as *Overweight*, *Outperform* and *Buy* for positive opinions, *Neutral*, *Equal Weight* and *Hold* for middling ones, and *Underweight*, *Underperform* and *Sell* for negative ones. Upgrades and downgrades tend to move the price on the day, so they are worth noticing, even though the price may have already moved by the time you see them.

## When something is missing

Each card says what is missing instead of leaving a gap, for example *No analyst rating summary available* or *No price targets available*. Smaller companies are covered by fewer analysts, and some have no coverage at all. Some market data plans leave out certain analyst data. **Settings → Test connection** shows what your plan includes.

Without an FMP key, the screen shows a **Sample data** note with made-up numbers. See *First-time setup*.

## Using it well

- **Compare target with price.** A target well above the price is the analysts' case for upside. Ask what they would need to be right about.
- **Look at the direction of change.** Targets and ratings that are being raised mean more than a high level that has stayed flat.
- **Check the estimates against growth.** A stock expected to grow earnings quickly may deserve a higher P/E than one that is expected to stand still. See *Fundamentals* and *Quote details*.
- **Know the dates.** Prices often move sharply around earnings reports, which is when estimates are tested.
- **Never trade on a rating alone.** Pair it with the chart, your own risk limits, and a plan. See *The order ticket* and *Position calculator*.

## Asking Claude

Claude can read this same analyst data. Ask *Summarize what analysts think of AAPL*, *Who changed their rating recently and what did they say?* or *Is the consensus target realistic compared with growth?* and it will answer from the figures on this screen. It will also point out that analysts can be wrong.

**Next:** *Fundamentals*.
