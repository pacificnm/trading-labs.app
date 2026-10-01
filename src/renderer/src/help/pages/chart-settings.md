**Chart Settings** is where you change how the chart looks and which **studies** (technical indicators) it shows. Open it from **Chart → Chart Settings…** in the title bar. Every change applies to the chart immediately, and your choices are saved for next time.

![The Chart Settings screen](studies-settings.png)

The screen has three sections from top to bottom: **Appearance**, **Active studies** and **Add study**.

## Appearance

| Setting | Choices | Notes |
|---|---|---|
| **Chart type** | Candles, Hollow candles, Bars, Line, Area, Heikin Ashi | See below |
| **Price scale** | Normal, Logarithmic, Percentage | See below |
| **Crosshair** | Free, Magnet (snap to OHLC) | *Free* follows the mouse anywhere. *Magnet* snaps to the open, high, low or close of the nearest candle |
| **Up color** and **Down color** | Any color | The color of rising and falling candles and bars. Defaults are green and red |
| **Grid lines** | On or off | The faint lines behind the candles |

### Chart types

- **Candles** show open, high, low and close. The body is the open-to-close range and the thin line (wick) is the high-to-low range. Filled in the up or down color.
- **Hollow candles** are like candles, but a candle that closed higher than it opened is drawn hollow.
- **Bars** (OHLC bars) show the same four prices as a vertical line with small ticks.
- **Line** connects the closing prices. It is the cleanest view of the overall path.
- **Area** is a line with a shaded fill underneath.
- **Heikin Ashi** smooths the candles by averaging, which makes trends easier to see and hides some noise. Its prices are **averages, not real trades**, so do not use its candles to read exact prices.

### Price scale

- **Normal** spaces prices evenly. This is the right choice for most charts.
- **Logarithmic** spaces prices by percentage change, so a move from 10 to 20 looks the same as 100 to 200. Use it for long histories or stocks that have grown many times over.
- **Percentage** shows the change from the first candle on the screen instead of prices, which is handy for seeing how much a stock has moved over the chart's length.

## Active studies

This section lists every study currently on your chart. By default, only **Volume** is shown.

![Active studies with their settings](studies-active.png)

Each study has its own card:

- **Name and settings.** The name is followed by its current numbers, such as *Exponential MA (EMA) · 20*.
- **Eye icon.** Hide or show the study without removing it. A hidden study keeps its settings.
- **Trash icon.** Remove the study from the chart.
- **Parameters.** Number boxes such as **Length**. Type a new value and the chart redraws. Values must be greater than zero.
- **Colors.** One swatch for each line the study draws. See *Study line colors*.

You can add the **same study more than once**, for example an EMA 20 and an EMA 50, each with its own length and colors.

## Add study

Click any row in the list to add that study to the chart. The list is grouped by category, and the **Search studies…** box filters it as you type. A new study starts with its default settings. Change them in its card under **Active studies**.

Studies that belong on the price (moving averages, bands, Ichimoku and so on) are drawn **over the candles**. The rest get their **own pane** below the price, with the study's name and settings in a tag on the price scale so you can tell them apart.

![A chart with two moving averages, Bollinger Bands, volume, RSI and MACD](studies-chart.png)

## The studies

There are 23 studies. In the tables, *Default* shows the starting settings.

### Overlay: drawn on the price

| Study | What it shows | Default |
|---|---|---|
| **Moving Average (SMA)** | The simple average of the last N closes. Smooths price to show the trend | Length 20 |
| **Exponential MA (EMA)** | An average that weights recent prices more, so it reacts faster than the SMA | Length 20 |
| **Weighted MA (WMA)** | An average that weights recent prices in a straight line, between SMA and EMA in speed | Length 20 |
| **VWAP** | Volume-weighted average price, counted from the first candle on the chart. A reference for the average price paid | none |
| **Pivot Points (Classic)** | A central pivot (P) with three resistance (R1 to R3) and three support (S1 to S3) levels, worked out from the previous block of bars | Bars per period 5 |
| **Pivot Points (Fibonacci)** | The same idea, with the levels spaced by Fibonacci ratios (0.382, 0.618, 1.0) | Bars per period 5 |

### Trend

| Study | What it shows | Default |
|---|---|---|
| **Parabolic SAR** | Dots that trail the price. Dots below the candles suggest an uptrend and dots above suggest a downtrend, and they flip when the trend turns | Step 0.02, Max 0.2 |
| **Supertrend** | A single line that follows the price at a set distance in units of ATR. Green means up, red means down, and the color flips when the trend turns | ATR length 10, Factor 3 |
| **Ichimoku Cloud** | Five lines and a shaded **cloud** that show trend, momentum and support or resistance together. The cloud is green when Leading Span A is above B and red when it is below | Conversion 9, Base 26, Leading span B 52, Displacement 26 |
| **Average Directional Index (ADX)** | A separate pane. ADX measures trend **strength** (above 25 is a strong trend, whichever direction), with +DI and -DI showing direction | Length 14 |

### Momentum: separate pane

| Study | What it shows | Default |
|---|---|---|
| **Relative Strength Index (RSI)** | Momentum from 0 to 100. Above 70 is often called overbought and below 30 oversold | Length 14 |
| **MACD** | The gap between a fast and a slow EMA, with a signal line and a histogram. Crossovers hint at momentum shifts | Fast 12, Slow 26, Signal 9 |
| **Stochastic** | Where the close sits within the recent high-low range, as %K and a smoothed %D, from 0 to 100. Marked at 20 and 80 | %K 14, smoothing 3, %D 3 |
| **Commodity Channel Index** | How far price has moved from its average. Marked at -100 and +100 | Length 20 |
| **Williams %R** | A mirror of the stochastic, from -100 to 0. Marked at -80 and -20 | Length 14 |
| **Rate of Change** | The percent change in price over N candles, around a zero line | Length 12 |

### Volatility

| Study | What it shows | Default |
|---|---|---|
| **Bollinger Bands** | A moving average with bands a set number of standard deviations above and below. Bands widen when the price gets more volatile | Length 20, StdDev 2 |
| **Keltner Channels** | An EMA with bands a multiple of ATR above and below | Length 20, ATR length 10, Multiplier 2 |
| **Donchian Channels** | The highest high and lowest low over N candles, with a middle line. Breakouts of the channel are a classic entry signal | Length 20 |
| **Average True Range (ATR)** | A separate pane. The average size of a candle's range, so it measures how much the stock typically moves. Used for stop distances and position size | Length 14 |

### Volume: separate pane

| Study | What it shows | Default |
|---|---|---|
| **Volume** | Shares traded in each candle, colored by whether the candle rose or fell | none |
| **On Balance Volume** | A running total that adds volume on up days and subtracts it on down days. Shows whether volume is flowing in or out | none |
| **Money Flow Index** | Like RSI but weighted by volume. Marked at 20 and 80 | Length 14 |

> Studies describe the past. None of them predicts the future, and no single study is a reason to buy or sell. Learn what each one measures, then use two or three that answer different questions, such as one trend, one momentum and one volatility.

## Good to know

- **Studies start late.** An indicator needs enough candles to calculate its first value, so its line begins part-way along the chart. A longer **Length** setting on the chart (see *Length and interval*) gives more room.
- **Studies depend on the interval.** A 20-length average means 20 days on Day candles but 20 five-minute candles on a 5 Min chart.
- **Pivot points** use blocks of candles, not calendar days, so *Bars per period* of 5 on a Day chart is one trading week.
- **VWAP** starts again from the first candle shown, so it changes when you change the Length.
- **Too many studies** make a chart hard to read. Hide the ones you are not using with the eye icon.

## Asking Claude

Claude can read the values of your studies and can add, change and remove them for you. Try *Add an RSI and a 50-day moving average* or *What are my studies saying right now?* Studies Claude adds appear in Chart Settings like any other.

**Next:** *Study line colors*.
