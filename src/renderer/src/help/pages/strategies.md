The **Trading Strategies** library is a set of short, practical study guides to the main ways traders approach the market. Each one explains an idea, gives clear rules, warns about what goes wrong, and sets up your chart so you can see it for yourself. Claude can teach from them, quiz you and help you find examples on real charts. Open it with the **graduation cap** icon on the ribbon.

![A strategy document](strategies-screen.png)

> These are **educational** guides, not recommendations. No strategy wins every time, and a pattern that worked in the past does not promise it will work again. Practise on paper first, and size every trade with the *Position calculator*.

## The list

The panel on the left holds every strategy.

![The strategy list with progress dots](strategies-list.png)

- At the top, a counter shows how many strategies you have marked **practiced or confident**, with a progress bar. In the screenshot it reads *2 of 14*.
- **Search strategies…** looks in titles, summaries, tags and categories.
- The level chips filter by **All levels**, **beginner**, **intermediate** or **advanced**.
- Strategies are grouped by **category**: Foundations, Trend, Breakouts, Mean reversion & momentum, Intraday, Events & options, and **My strategies** for ones you or Claude add.
- Each row shows a **progress dot**, the title, the level and the reading time. A **sparkle** marks a strategy written by Claude and a **pencil** marks one of your own.

| Dot color | Your progress |
|---|---|
| Grey | **Not started** |
| Amber | **Learning** |
| Blue | **Practiced** |
| Green | **Confident** |

### The built-in guides

| Strategy | Category | Level | Chart set up for you |
|---|---|---|---|
| **Reading candlesticks** | Foundations | Beginner | 3 months, daily, volume |
| **Candlestick patterns** | Foundations | Beginner | 6 months, daily, volume |
| **Support and resistance** | Foundations | Beginner | 6 months, daily, volume |
| **Risk first: sizing, stops and R** | Foundations | Beginner | 3 months, daily, ATR and volume |
| **Trend following with moving averages** | Trend | Beginner | 5 years, daily, two moving averages and volume |
| **Buying the pullback in an uptrend** | Trend | Intermediate | 6 months, daily, EMA 20 and 50, RSI, volume |
| **Breakouts with volume confirmation** | Breakouts | Intermediate | 6 months, daily, Donchian channels and volume |
| **RSI mean reversion (with a trend filter)** | Mean reversion & momentum | Intermediate | 1 year, daily, RSI, a moving average and volume |
| **Bollinger Bands: squeezes and reversion** | Mean reversion & momentum | Intermediate | 6 months, daily, Bollinger Bands and volume |
| **MACD momentum signals** | Mean reversion & momentum | Intermediate | 6 months, daily, MACD, a moving average and volume |
| **Opening range breakout (intraday)** | Intraday | Advanced | 1 day, 5-minute, VWAP and volume |
| **Trading around earnings** | Events & options | Intermediate | 6 months, daily, volume |
| **Options basics (learning only)** | Events & options | Advanced | none |

A good order for a beginner is the first three **Foundations** guides, then *Trend following*, then the rest as they interest you.

## A strategy document

Click a strategy to read it.

- **The header** shows the title, a **level badge**, the category and reading time, and a small badge if Claude wrote it (**written by Claude**) or you did (**my strategy**), then a one-line summary.
- **My progress** is a row of four buttons: **Not started**, **Learning**, **Practiced** and **Confident**. Click one to record where you are. If you have taken a quiz with Claude, the *last quiz* score shows beside it.
- **The document** follows the same shape: **The idea**, what a good setup looks like, the **rules** for entry, stop and target, **when it fails**, **common mistakes** and a **practice** task. A short reminder at the end says it is educational material.
- **Chart setup** lists the time frame and studies the guide uses.
- **Check yourself** has a few questions. Click **Show answer** under each to reveal it. Try answering first.
- **My notes** is a box for what clicked, what confused you, and examples you found. It saves **automatically**.

## Candlestick patterns

This guide (under *Reading candlesticks*) holds a gallery of 41 patterns, grouped by how many candles they use. Use the **All patterns / bullish / bearish / neutral** chips to filter. Click a thumbnail for a close-up drawing (the pattern is highlighted and numbered, earlier candles are dimmed), how to spot it, what it says about buyers and sellers, what confirms it and when it fails.

Each pattern carries a **rarity** tag (common, uncommon, rare, very rare), a rough guide to how often it appears. The tags come mostly from running the pattern rules over simulated daily prices, with a judgement call for patterns that depend on gaps, so treat them as a starting point and use the real counts below. **Measure how often on <symbol>** counts every pattern in the last 5 years of daily bars and shows the real numbers on each thumbnail and in the detail page. This needs market data (an FMP key).

Press **Claude, show me on <symbol>** and Claude scans the bars loaded on your chart with fixed rules, marks every match with an arrow and the pattern name, and tells you what price did over the next few bars, including the ones that failed. If the pattern is not in the loaded bars, it says so; try a longer range or another symbol.

## The action buttons

Under the progress buttons are the ways to put a guide to work.

| Button | What it does |
|---|---|
| **Set up my chart** | Switches the chart to the guide's time frame, chart type and studies so it looks as the guide describes. A message offers to **put your old chart back** when you are done. It is hidden for guides that have no chart (like *Options basics*) |
| **Teach me this** | Asks Claude to teach the strategy step by step in short chunks, checking your understanding with a question before moving on |
| **Quiz me** | Claude asks you questions one at a time, gives honest feedback and, if you agree, records your score |
| **Find an example** | Claude sets up the chart and looks for the pattern on the **symbol you are viewing**, marking what it finds. If the pattern is not there, it says so plainly |
| **Practice plan** | Claude checks whether the setup is present, then walks through the size, stop, target and what would prove you wrong. It prepares an order ticket only if you agree |
| **Explain simply** | A plain-language explanation for a complete beginner, with a real example from the chart |

Each button sends a ready-made request to the chat panel. Claude does the work there and on your chart. You need an Anthropic key for Claude. See *First-time setup*.

Claude can also **update your progress** and score when you agree, so the dots and counter stay current.

## Making your own strategies

You can add your own guides, and they appear under **My strategies**.

- **New strategy** (top right) opens a blank editor.
- **Copy to edit** (on a built-in guide) makes your own copy, called *My version of…*, and opens it in the editor. The built-in guides are read-only.
- **Edit** and **Delete** appear on your own strategies. Delete asks you to confirm and cannot be undone.
- **Ask Claude to write one** starts a conversation: Claude asks about your idea (what you look for, entry, stop, target and time frame) and then creates the document for you, with a chart setup and check-yourself questions.

![The strategy editor](strategies-editor.png)

### The editor

| Field | What it is for |
|---|---|
| **Title** | The name. It is required before you can save |
| **Category**, **Level** and **Minutes to read** | How it is filed and labeled |
| **Tags** | Words separated by commas, for searching |
| **One-line summary** | Shown under the title |
| **Document (Markdown)** | The text of the guide. It starts with a template: *The idea*, *Rules* (entry, stop, target), *Common mistakes* and *Practice*. Lines starting with `##` become headings and lines starting with `-` become bullets |
| **Chart setup** | **Use my current chart** copies your chart's time frame and studies, so **Set up my chart** will recreate it. **Clear** removes it |
| **Check-yourself questions** | **Add question** adds a question and answer pair. The bin removes one |

Click **Save** to keep it, or **Cancel** to throw away the changes.

## Learning well from the library

1. **Read one guide, then see it.** Click **Set up my chart** and look for the pattern in the charts of a few stocks you know.
2. **Test yourself.** Answer the check-yourself questions, then ask Claude to **Quiz me**.
3. **Find your own examples**, including ones where the setup **failed**. The failures teach as much as the wins.
4. **Take notes.** Write down what you notice in **My notes**.
5. **Practise on paper**, write the trade in the journal, and compare the result with the plan. See *Trading journal*.
6. **Move your progress honestly.** *Practiced* means you have done it. *Confident* means you can explain it and have seen it work and fail.

**Next:** the **Claude assistant** section, starting with *The chat panel*.
