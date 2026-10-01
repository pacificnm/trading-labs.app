The **Charts** screen is where you spend most of your time. It shows the price history of one symbol, lets you add studies and draw on the chart, and is the place you open the order ticket from.

![The chart screen with its parts numbered](chart-screen.png)

## The top bar

| # | Control | What it does |
|---|---|---|
| 1 | **Symbol search** | Type a ticker or company name and pick a result to switch the whole app to that symbol |
| 2 | **Watchlist dropdown** | Shows the symbols on your active watchlist. Pick one to jump to it, or switch lists from the same menu |
| 3 | **Index ticker** | A scrolling strip of the main US indexes. Click one to chart it |

*Finding symbols* covers these three in detail.

## The chart header

The second row belongs to the symbol you are looking at.

| # | Control | What it does |
|---|---|---|
| 4 | **Star** | Adds or removes the symbol from a watchlist. A filled star means it is on at least one list |
| 5 | **Symbol title** | The current symbol and the name of the screen |
| 6 | **Length** and **Interval** | How much history to show (for example *1 Year*) and the size of each bar (for example *Day*). Only sensible combinations are offered |
| 7 | **Symbol screens** | Icons that open **Chart**, **News**, **Quote Details**, **Analyst Reports**, **Fundamentals** and **Option Stats** for this symbol. The current one is highlighted |
| 8 | **Drawing tools** | A pen icon that opens a menu of tools: cursor, trendline, ray, horizontal line, Fibonacci retracement and rectangle, plus options to remove drawings |
| 9 | **Buy** and **Sell** | Open the order ticket on this symbol |

See *Length and interval*, *Drawing tools* and *The order ticket* for each of these.

## The chart area

- **10. Price scale.** Prices run down the right side. A tag on the scale shows the **last price**, with a dotted line across the chart. The scale can be switched to logarithmic or percent in **Chart Settings**.
- **11. Study panes.** **Volume** appears in its own pane under the price, with a label. Studies such as RSI or MACD get their own panes too, stacked below. Studies that belong on the price, such as moving averages, Bollinger Bands or Ichimoku, are drawn over the candles.
- **12. Time axis.** Dates and times run along the bottom. Intraday charts show times in the zone you chose in Settings. Daily and longer bars are dates.

The candles use green for a bar that closed higher than it opened and red for lower. You can change those colors, the chart type (candles, hollow candles, bars, line, area, Heikin Ashi), the grid and the crosshair under **Chart → Chart Settings…**.

## Working with the chart

| To do this | Do this |
|---|---|
| **See exact values** | Move the mouse over the chart. A crosshair follows it and the axes show the price and time under it |
| **Scroll through history** | Click and drag sideways |
| **Zoom in or out** | Scroll the mouse wheel over the chart, or drag along the price or time axis |
| **Change the time frame** | Use the **Length** and **Interval** dropdowns |
| **Switch symbol** | Search, pick from the watchlist dropdown, click an index, or click a symbol in any list or screen |
| **Add studies** | **Chart → Chart Settings…** |
| **Draw** | Choose a tool from the pen menu, then click or drag on the chart. Press **Esc** to go back to the cursor |
| **Edit a drawing** | With the cursor tool, click it to select it, then drag it or its end handles to move it, or press **Delete** to remove it |

While a drawing tool is active, the chart does not scroll or zoom, so your clicks go to drawing. Press **Esc** or choose **Cursor** to pan and zoom again.

## Things you may see on the chart

- **Sample data banner.** An amber note at the top says the chart is showing made-up prices because no FMP key has been added. Click it to go to Settings. See *First-time setup*.
- **Loading** while data is being fetched.
- **An error message with Retry** if the data could not be loaded, for example when you are offline or your plan does not include that interval.
- **Colored lines across the chart.** These are order lines for a draft or a working order, with a label. You can drag them to change a price. See *Order lines on the chart*.
- **Drawings made by Claude.** Claude can draw levels, trendlines and Fibonacci on your chart while it explains. You can remove them without touching your own: pen menu → **Remove Claude's drawings**.

Your drawings are saved for each symbol, so they are still there when you come back to it.

## Claude and the chart

Claude can see what the chart is showing: the symbol, time frame, studies and recent candles. Ask it to explain a pattern, mark support and resistance, add an indicator or walk you through a setup, and it will do it on this same chart. See *What Claude can do*.

**Next:** *Finding symbols*.
