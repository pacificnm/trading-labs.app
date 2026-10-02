Every line a study draws has its own color, and you can change any of them. Use this to tell two similar studies apart, to match colors you are used to from other charting tools, or just to make the chart easier to read on your screen.

![A chart with a custom red EMA, a cyan and orange Supertrend, and green and purple MACD bars](colors-chart.png)

## Changing a color

1. Open **Chart → Chart Settings…**.
2. In **Active studies**, find the study's card. At the bottom is a **Colors** row with one **swatch** for each line the study draws.
3. Click the colored circle on a swatch. Your system's color picker opens.
4. Pick a color. The chart updates straight away, and the choice is saved.

![Color swatches on the study cards](colors-swatches.png)

A swatch is a colored circle and the **name of the line** it controls. Bollinger Bands has *Upper*, *Basis* and *Lower*, MACD has *Histogram*, *MACD* and *Signal*, and a moving average has just one.

## Two-color lines

Some studies change color depending on direction. Those get **two swatches**, one for each state:

| Study | Swatches | Used when |
|---|---|---|
| **Supertrend** | *Supertrend (rising)* and *Supertrend (falling)* | The trend is up or down |
| **MACD histogram** | *Histogram (rising)* and *Histogram (falling)* | The histogram bar is positive or negative |
| **Volume** | *Volume (rising)* and *Volume (falling)* | The candle closed higher or lower than it opened |

Volume bars and other see-through colors keep their **transparency** when you change the color, so they stay softer than the price candles.

## Going back to the default

- **Restore one line.** A line with a custom color shows a small **circular arrow** on its swatch. Click it to put that line back to its default.
- **Restore a whole study.** A study with any custom color shows a **Reset colors** button. Click it to reset every line on that study at once.

The arrow and the button only appear when something has been changed, so you can tell at a glance which studies are customized.

## Default colors

Each study starts with its own default colors, such as amber for the SMA, light blue for the EMA, purple for the RSI and blue and orange for the MACD lines.

When you add the **same study more than once**, the app gives each extra copy a different default color automatically, so an EMA 20 and an EMA 50 do not look the same. The first copy keeps the study's normal color, and later copies take colors from a rotating set of purple, green, orange, yellow, cyan and pink. You can still change any of them.

## Other colors

These are set elsewhere:

- **Candle colors.** The up and down colors of the price candles and bars are under **Appearance** in the same screen (**Up color** and **Down color**).
- **Drawings.** Drawings have their own colors. See *Drawing tools*.
- **Ichimoku cloud shading** is fixed (green when Leading Span A is above B and red when below). You can change the colors of the five Ichimoku lines, but not the shading.

## Tips

- **Keep colors meaningful.** Use warm colors for fast lines and cool colors for slow ones, or keep green and red only for rising and falling, so the chart stays readable at a glance.
- **Check contrast.** Choose colors that stand out against both the dark background and the red and green candles.
- **Use fewer, clearer colors** when you have many studies. Hiding a study with the eye icon is often better than a busier chart.

## Asking Claude

Claude can set colors for you. Try *Make my 50-day EMA orange* or *Color the upper Bollinger Band red*. Claude can also add a study with colors already set, and can restore a default. The result shows in Chart Settings like any color you picked yourself.

**Next:** *Drawing tools*.
