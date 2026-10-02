Two dropdowns in the chart header control what you see: **Length** (how much history to show) and **Interval** (how much time each candle covers).

![The Length and Interval dropdowns showing 1 Day and 5 Min](timeframe-intraday.png)

Together they decide how many candles are on the chart. *1 Year* of *Day* candles is about 252 candles. *1 Day* of *5 Min* candles is 78.

## Length

| Choice | History shown |
|---|---|
| **1 Day** | About one trading session |
| **5 Days** | About a week of trading |
| **1 Month**, **3 Months**, **6 Months** | About 21, 63 and 126 trading days |
| **Year to Date** | From the start of this year |
| **1 Year** | About 252 trading days |
| **5 Years** | About five years |
| **Max** | As far back as the app loads, up to roughly 20 years of daily candles, depending on the stock's history |

## Interval

| Choice | Each candle covers | Kind |
|---|---|---|
| **1 Min**, **5 Min**, **15 Min**, **30 Min** | That many minutes | Intraday |
| **1 Hour**, **4 Hour** | One or four hours | Intraday |
| **Day** | One trading day | Daily |
| **Week**, **Month** | One week or one month | Longer |

Short intervals show what is happening **within** a day, so they suit day-trading practice and watching entries closely. Long intervals show the **big picture and trend**, and suit finding support and resistance and judging whether a stock is in an uptrend.

## Which combinations are offered

The Interval list only shows choices that make a readable chart for the Length you picked. A chart needs at least 4 candles and the app caps it at 10,000, so very short intervals are not offered for long histories, and very long ones are not offered for short histories.

| Length | Intervals available |
|---|---|
| **1 Day** | 1 Min, 5 Min, 15 Min, 30 Min, 1 Hour |
| **5 Days** | 1 Min up to 4 Hour, and Day |
| **1 Month** | 1 Min up to 4 Hour, Day, Week |
| **3 Months** | 5 Min up to 4 Hour, Day, Week |
| **6 Months** | 5 Min up to 4 Hour, Day, Week, Month |
| **1 Year** | 15 Min up to 4 Hour, Day, Week, Month |
| **5 Years** | 1 Hour, 4 Hour, Day, Week, Month |
| **Max** | Day, Week, Month |

*Year to Date* follows the same rule, so what it offers depends on how far into the year you are.

When you change **Length** and your current interval no longer fits, the app switches to the **closest interval that does**, so the chart never ends up empty. For example, moving from *1 Year / Day* to *Max* keeps *Day*, but moving from *1 Year / 15 Min* to *Max* changes the interval to *Day*.

## What affects your data

- **Your FMP plan.** Intraday intervals (1 Min to 4 Hour) need a paid FMP plan, and plans differ in which ones they include. The app checks this and **leaves out the intervals your plan does not include**, so the Interval list only offers ones that will load. A Length that needs an unavailable interval (for example *1 Day* when there are no intraday bars) is left out too. If the chart was on an interval your plan lacks, it switches to the closest one that works and tells you. **Settings → What your FMP plan includes** lists what you have.
- **Weekly and monthly candles** are built by the app from daily data, so they use the same history as the Day interval.
- **Time zone.** On intraday charts the time axis uses the zone you chose in Settings. Daily, weekly and monthly candles are dates and never shift. See *Time zone and display*.
- **Not a tick-by-tick feed.** The chart refreshes itself on a timer (see *Automatic updates* below), but it does not redraw with every trade. The **Quote Details** screen shows the latest price.

## Automatic updates

While the **market is open**, the chart reads the newest candles by itself, so you do not have to reload it. How often depends on the interval:

| Interval | Refreshes about every |
|---|---|
| **1 Min** | 30 seconds |
| **5 Min** | 1 minute |
| **15 Min** | 2 minutes |
| **30 Min** | 3 minutes |
| **1 Hour**, **4 Hour** | 5 minutes |
| **Day** | 10 minutes |
| **Week**, **Month** | 15 minutes |

- The toolbar shows **Updated** with the time of the last check, in your chosen time zone. If a refresh fails it says **Update failed, retrying**, keeps the chart you have, and tries again.
- Only the **latest candles** are fetched. A candle that was still forming is replaced, and a new candle is added at the right.
- **Your view stays put.** Your zoom and scroll position are kept. If you were looking at the newest candle the chart follows it; if you had scrolled back in time it stays where you were.
- It **waits while you draw** or drag a line, so a drawing is never interrupted.
- It **pauses** when the market is closed (a few minutes after the close it makes a last check) and when the window is minimised or hidden, and catches up as soon as you come back.
- The data itself is as fresh as your data plan allows. Some plans delay prices, and *Limits and disclaimers* explains why the app reuses recent answers. If you want the very latest right now, switch the symbol or interval and back.
- Sample data (no market data key) does not update, because it is made up.

## Studies and the time frame

Studies are calculated from the candles on the chart, so they change with the interval. A 20-period moving average on *Day* candles averages 20 days, but on *5 Min* candles it averages 100 minutes. If an indicator looks wrong, check which interval you are on.

## Tips for learning

- Start from the **big picture**. Look at *1 Year* or *5 Years* on *Day* or *Week* to see the trend, then *1 Month* on *Day* to find levels, then an intraday interval to time an entry.
- Use the **same stop and target logic** on any interval, but expect more noise on shorter ones. A tight stop on a 1-minute chart is hit far more often than on a daily chart.
- Many strategies in the **Trading Strategies** library set the Length and Interval for you when you click **Set up my chart**.
- You can also ask Claude to change them: *Show me AAPL on the 15-minute chart for the last 5 days.*

**Next:** *Chart settings and studies*.
