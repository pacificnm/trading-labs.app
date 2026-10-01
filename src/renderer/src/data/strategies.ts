import type { StrategyDoc } from '../../../shared/strategies'

const FOOT = `

---
*Educational material, not investment advice. No strategy wins every time, and past behaviour of a pattern does not guarantee it will repeat. Practise on paper first and size every trade with the Position Calculator.*`

type Built = Omit<StrategyDoc, 'source'>
const doc = (d: Built): StrategyDoc => ({ ...d, body: d.body.trim() + FOOT, source: 'builtin' })

export const BUILTIN_STRATEGIES: StrategyDoc[] = [
  doc({
    id: 'reading-candles', title: 'Reading candlesticks', category: 'Foundations', level: 'beginner', minutes: 12,
    summary: 'What each candle says about the fight between buyers and sellers, and why context matters more than pattern names.',
    tags: ['price action', 'candlesticks', 'basics'],
    chartSetup: { range: '3M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A candlestick summarises one time period (a day, an hour, five minutes) in four prices: **open, high, low, close**. The shape shows who was in control and how hard the other side pushed back.

## Anatomy
- **Body**: the range between open and close. Green (up) means it closed above the open; red (down) means it closed below.
- **Wicks (shadows)**: the thin lines showing how far price travelled beyond the body before being rejected.
- A **long body** means one side dominated. A **long wick** means price went somewhere and was pushed back: rejection.

## Patterns worth knowing
- **Doji**: open and close nearly equal. Indecision. It matters after a strong move, where it can signal a pause.
- **Hammer / shooting star**: a small body with a long wick on one side. A hammer (long lower wick) after a drop shows buyers stepped in; a shooting star (long upper wick) after a rise shows sellers rejected higher prices.
- **Engulfing**: a candle whose body fully covers the previous candle's body, in the opposite colour. A sign the other side has taken over, at least for a moment.
- **Inside bar**: a candle whose range sits inside the previous candle's range. Compression before a possible move.

## Context beats patterns
A hammer means something at a support level after a decline, and nothing in the middle of a range. Ask three questions of every candle: **Where is it** (at support, resistance, a moving average)? **What came before** (trend, sideways)? **Did volume confirm** (bigger than usual)?

## Common mistakes
- Trading a pattern name without checking where it formed.
- Treating a single candle as a prediction. It is evidence, not a forecast.
- Ignoring the timeframe: a daily candle carries far more weight than a one-minute candle.

## Practice
Open a daily chart with volume. Find three long-wick candles. For each, write down what the wick says about who was rejected, and what price did over the next five bars. Then ask Claude to mark the strongest example on the chart.
`,
    quiz: [
      { q: 'A candle has a small body and a very long lower wick after a sustained decline. What does it suggest, and what would you want to check next?', a: 'It looks like a hammer: sellers pushed price down but buyers pushed it back up. Check that it formed at a support level and whether volume was high. On its own it is only a hint.' },
      { q: 'Why is a doji in the middle of a sideways range mostly meaningless?', a: 'Indecision is normal in a range. A doji matters when it appears after a strong move or at a key level, where the pause could precede a turn.' },
      { q: 'What does a long upper wick tell you?', a: 'Price rose during the period but sellers pushed it back down before the close: rejection of the higher prices.' }
    ]
  }),
  doc({
    id: 'support-resistance', title: 'Support and resistance', category: 'Foundations', level: 'beginner', minutes: 15,
    summary: 'Find the price zones where a stock has repeatedly turned, and use them for entries, stops and targets.',
    tags: ['levels', 'swing highs', 'zones'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
**Support** is a price zone where buying has repeatedly been strong enough to stop a decline. **Resistance** is a zone where selling has repeatedly stopped a rise. They exist because traders remember: people who bought and watched price fall back to their entry want out at break-even, and people who missed a move want to buy a dip.

## How to find levels
1. Mark the **swing highs and swing lows**: turning points where price reversed. (Ask Claude to find them with the swing tool so nothing is eyeballed.)
2. Look for **clusters**: three or more turns near the same price matter more than one.
3. Draw **zones, not lines**. A level is usually a band a fraction of a percent to a couple of percent wide.
4. Higher timeframes win: a level from a daily or weekly chart outranks one from a five-minute chart.

## What price does at a level
- **Bounce**: the level holds; price turns away.
- **Break and retest**: price closes decisively through, comes back to touch the level from the other side, then continues. Old resistance often becomes new support ("role reversal").
- **False break**: price pokes through and immediately falls back. This traps late buyers.

## Rules of thumb for trading them
- **Entry**: at the level with a rejection candle, or after a retest that holds.
- **Stop**: just beyond the zone, where your idea is proven wrong. Not inside it.
- **Target**: the next level. If the distance to it is less than the distance to your stop, skip the trade.

## Common mistakes
- Drawing too many lines until the chart is a spider web. Keep only the levels that clearly mattered.
- Treating every touch as a certain bounce. Each test weakens a level a little.
- Placing the stop exactly at the level, where it is easiest to hit.

## Practice
On a 6-month daily chart, mark the three most obvious levels. Write the reward-to-risk of buying at the nearest support with a stop just below it and a target at the next resistance. Would it clear 2 to 1?
`,
    quiz: [
      { q: 'Why is a level touched five times over months usually more meaningful than one touched once?', a: 'More participants have placed orders and formed memories around it, and it has proven itself. Though repeated tests also wear a level down, so watch how price reacts to each one.' },
      { q: 'Price closes above a resistance level, then comes back down to that level and bounces. What is this called and why does it happen?', a: 'A break and retest (role reversal): former resistance turned support, because buyers who missed the breakout use the pullback to enter.' },
      { q: 'Where should a stop go relative to a support zone?', a: 'Just beyond the far side of the zone, where a break would show the idea is wrong. Not inside the zone and not exactly on the level.' }
    ]
  }),
  doc({
    id: 'risk-management', title: 'Risk first: sizing, stops and R', category: 'Foundations', level: 'beginner', minutes: 15,
    summary: 'The skill that keeps you in the game: how much to risk, where to stop, and what expectancy really means.',
    tags: ['risk', 'position sizing', 'R multiple', 'expectancy'],
    chartSetup: { range: '3M', interval: '1day', type: 'candles', studies: [{ study: 'atr', params: { length: 14 } }, { study: 'volume' }] },
    body: `
## The idea
Most beginners ask "what should I buy?" Professionals ask "how much can I lose on this, and is it worth it?" Your edge is only useful if you survive the losing streaks that every strategy has.

## The core numbers
- **Risk per trade**: the dollars you lose if your stop is hit. A common range is **0.5% to 2% of your account**; smaller while learning.
- **Position size** = dollars risked ÷ (entry price − stop price). A tighter stop means more shares for the same risk, never more risk.
- **R multiple**: your profit or loss measured in units of the initial risk. Risk $100 and make $250: that is +2.5R. Lose it all: −1R.
- **Reward-to-risk**: target distance ÷ stop distance. Below 1 to 1, you need to win most trades just to break even.

## Expectancy
Expectancy is what an average trade earns, in R:
**win rate × average win − loss rate × average loss**. A strategy that wins 40% of the time can be profitable if winners average 2R: 0.4 × 2 − 0.6 × 1 = +0.2R per trade. A 70% win rate with tiny wins and big losses can lose money.

## Why small risk matters
Losing 10% needs an 11% gain to recover. Losing 50% needs 100%. Ten losses in a row at 1% risk cost about 10%. At 10% risk they cost about 65%.

## Setting the stop
Put it where the idea is **proven wrong**, based on the chart (beyond a swing low, beyond a level), not at a dollar amount you are comfortable losing. Then size the position to fit. ATR helps: a stop closer than about 1 ATR is inside normal daily movement and gets hit by noise.

## Limits that protect you
Set a **max total invested** and a **max per position**. The Position Calculator applies them for you and tells you which limit set the size.

## Common mistakes
- Deciding the share count first and the stop second.
- Moving the stop further away when a trade goes against you.
- Adding to a loser. Adding to winners is a different decision; adding to losers is hope.

## Practice
Use the calculator on a stock you like with a 1.5 ATR stop and a 2R target. Read the result: shares, dollars risked, the win rate you would need to break even.
`,
    quiz: [
      { q: 'You risk $200. The trade makes $500. What is the R multiple?', a: '+2.5R (500 divided by 200).' },
      { q: 'A strategy wins 35% of trades with an average win of 3R and an average loss of 1R. What is its expectancy?', a: '0.35 × 3 − 0.65 × 1 = +0.40R per trade. Profitable despite losing most trades.' },
      { q: 'Why should the stop be chosen before the position size?', a: 'The stop belongs where the idea is proven wrong. The size is then set so that hitting it costs only your chosen risk. Choosing the share count first pushes you to place the stop wherever it fits.' }
    ]
  }),
  doc({
    id: 'trend-ma-crossover', title: 'Trend following with moving averages', category: 'Trend', level: 'beginner', minutes: 15,
    summary: 'Use the 50 and 200-day averages to stay on the right side of the big trend, and understand what that costs you.',
    tags: ['trend', 'moving average', 'golden cross', 'SMA'],
    chartSetup: { range: '5Y', interval: '1day', type: 'candles', studies: [{ study: 'sma', params: { length: 50 } }, { study: 'sma', params: { length: 200 } }, { study: 'volume' }] },
    body: `
## The idea
A **moving average (MA)** smooths price into a line that shows direction. The trend follower's rule is simple: **be long while the trend is up, be out (or short) while it is down**, and do not predict turns.

## The classic setup
- **50-day SMA**: the intermediate trend. **200-day SMA**: the long-term trend.
- **Golden cross**: the 50 crosses above the 200. **Death cross**: the 50 crosses below the 200.
- A simpler version: price above a rising 200-day average is an uptrend; below a falling one is a downtrend.

## Rules
1. **Trend filter**: only consider longs when price is above the 200-day and the 200-day is flat or rising.
2. **Entry**: the golden cross, or a pullback to the 50-day that holds.
3. **Stop**: below the most recent swing low, or a close below the 50-day.
4. **Exit**: a close below the 50-day (faster) or a death cross (slower, gives back more profit).

## What it is good and bad at
- **Good**: catching big, sustained trends and keeping you out of long bear markets.
- **Bad**: it always **lags**. Crossovers happen well after the low or the high. In a sideways market it produces repeated false signals ("whipsaws"), many small losses.

## Choosing lengths
Longer averages give fewer, later signals; shorter ones give more, noisier ones. There is no magic pair. What matters is choosing one, testing it on several stocks, and sticking to it.

## Common mistakes
- Using it in a range-bound market. Check first whether the 200-day is actually sloping.
- Expecting to win often. Trend following usually wins less than half its trades and relies on a few big winners.
- Selling at the first dip below the average without a rule for re-entry.

## Practice
On the 5-year daily chart, mark every golden and death cross. For each, note the price at the cross and 60 days later. How many were useful? How many were whipsaws?
`,
    quiz: [
      { q: 'Why does a golden cross often appear after a big part of the move has already happened?', a: 'Moving averages are built from past prices, so they lag. The 50-day only rises above the 200-day after price has already climbed for a while.' },
      { q: 'In which market condition do MA crossovers perform worst?', a: 'Sideways, range-bound markets: price keeps crossing the averages back and forth, giving repeated false signals (whipsaws).' },
      { q: 'A trend follower wins 35% of trades. Is that a problem?', a: 'Not necessarily. Trend following relies on winners much larger than losers. What matters is expectancy, not the win rate.' }
    ]
  }),
  doc({
    id: 'pullback-ema', title: 'Buying the pullback in an uptrend', category: 'Trend', level: 'intermediate', minutes: 15,
    summary: 'Wait for a strong stock to dip to its 20 or 50-day average and stabilise, instead of chasing highs.',
    tags: ['pullback', 'EMA', 'RSI', 'trend'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'ema', params: { length: 20 } }, { study: 'ema', params: { length: 50 } }, { study: 'rsi', params: { length: 14 } }, { study: 'volume' }] },
    body: `
## The idea
In a healthy uptrend, price does not rise in a straight line. It surges, rests, and surges again. Buying the **rest** rather than the surge gives a better entry and a much closer stop.

## What a healthy pullback looks like
- The stock is in an **established uptrend**: higher highs and higher lows, price above a rising 50-day EMA.
- The pullback is **orderly**: smaller candles, lighter volume than the advance, sliding down to the 20 or 50-day EMA.
- **RSI cools** toward 40 to 50 without collapsing.

## Rules
1. **Trend filter**: 20 EMA above 50 EMA, both rising.
2. **Location**: price pulls back to the 20 EMA (strong trend) or the 50 EMA (normal trend), ideally where an earlier swing low or resistance-turned-support sits.
3. **Trigger**: a bullish candle that closes back up (a hammer or engulfing candle), or a close above the prior day's high.
4. **Stop**: below the pullback's low, or below the 50 EMA.
5. **Target**: the previous swing high (first target), then trail with the 20 EMA.

## When it fails
If price **slices through the 50 EMA on heavy volume** and the averages flatten, the pullback is a trend change. That is the stop's job; do not average down.

## Common mistakes
- Buying the first touch of the average without waiting for a sign that buyers returned.
- Choosing a stock that is only up because of one news spike, with no real trend.
- Setting a target beyond the previous high without a plan for the resistance there.

## Practice
Find a stock in a clear uptrend. Mark three pullbacks that held the 20 or 50 EMA and one that did not. What differed: volume, depth, the candle at the low? Ask Claude to find the pullbacks and mark them.
`,
    quiz: [
      { q: 'Why is buying a pullback usually a better trade than buying a breakout to a new high, from a risk view?', a: 'The stop can be much closer (just under the pullback low), so the same dollar risk buys more shares and reward-to-risk is better. The trade-off is you may never get a pullback.' },
      { q: 'A pullback falls through the 50 EMA on rising volume and the averages flatten. What should you conclude?', a: 'Probably a trend change, not a healthy rest. The stop should already have taken you out; do not add to the position.' },
      { q: 'What does an RSI near 45 to 50 during an uptrend pullback suggest?', a: 'Momentum has cooled from overbought without turning bearish, which is typical of a healthy rest within an uptrend.' }
    ]
  }),
  doc({
    id: 'breakout-volume', title: 'Breakouts with volume confirmation', category: 'Breakouts', level: 'intermediate', minutes: 15,
    summary: 'Trade the move when price leaves a tight range, and learn how volume separates real breakouts from traps.',
    tags: ['breakout', 'consolidation', 'Donchian', 'volume'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'donchian', params: { length: 20 } }, { study: 'volume' }] },
    body: `
## The idea
When price trades in a tight range, buyers and sellers are in balance. When it closes decisively outside, one side has won, and stops and new orders can fuel a move in that direction.

## The setup
- **Consolidation**: at least a few weeks in a range with clear resistance above (a flat top or a tightening triangle). Tighter and longer generally means more energy stored.
- **Trigger**: a **close** above resistance, or above the 20-day high (the Donchian upper band).
- **Volume confirmation**: the breakout day's volume should be well above average, often 1.5 times or more. A breakout on thin volume lacks conviction.

## Rules
1. **Entry**: on the breakout close, or on a retest of the broken level if you prefer a safer entry.
2. **Stop**: back inside the range, below the breakout level (or the range midpoint for a looser stop).
3. **Target**: the height of the range added to the breakout level (measured move), or the next resistance. Trail under swing lows after that.
4. **Skip it** if the reward-to-risk to the first target is under 2 to 1.

## False breakouts
Many breakouts fail. Warning signs: low volume, a long upper wick on the breakout candle (rejection), the market as a whole falling that day, and a breakout straight into a major overhead level. A quick close back below the level is your exit signal, not a reason to hope.

## Common mistakes
- Buying the moment price touches the level intraday, before the close confirms it.
- Chasing a stock already extended far above the level. The stop then becomes too far away.
- Ignoring the earnings calendar. A gap through your stop can cost far more than planned.

## Practice
Find two breakouts on the chart: one on strong volume that followed through and one on weak volume that failed. Compare volume, candle shape and what price did over the next 10 bars.
`,
    quiz: [
      { q: 'Why wait for a close beyond the level instead of buying the first intraday poke above it?', a: 'Intraday pokes are often false breakouts that reverse. A close shows buyers held the move into the end of the period.' },
      { q: 'A stock breaks out on volume 40% below average. What does that suggest?', a: 'Weak conviction. It has a higher chance of failing, so reduce size or skip it.' },
      { q: 'How do you estimate a first target for a range breakout?', a: 'Measured move: add the height of the range to the breakout level. Then check it against the next resistance and require reasonable reward-to-risk.' }
    ]
  }),
  doc({
    id: 'rsi-mean-reversion', title: 'RSI mean reversion (with a trend filter)', category: 'Mean reversion & momentum', level: 'intermediate', minutes: 15,
    summary: 'Buy short-term oversold dips in stocks that are otherwise healthy, and know why "RSI below 30" is not a buy signal by itself.',
    tags: ['RSI', 'oversold', 'mean reversion'],
    chartSetup: { range: '1Y', interval: '1day', type: 'candles', studies: [{ study: 'rsi', params: { length: 14 } }, { study: 'sma', params: { length: 200 } }, { study: 'volume' }] },
    body: `
## The idea
Prices stretch away from their average and often snap back. **RSI** (0 to 100) measures how strong recent gains were compared with recent losses. Below 30 is conventionally "oversold", above 70 "overbought".

## The trap
In a strong downtrend, RSI can stay below 30 for weeks while price keeps falling. **"Oversold" is not "about to rise".** Mean reversion works best when the dip is a temporary drop inside a larger uptrend.

## Rules (long side)
1. **Trend filter**: price above the **200-day SMA**. You are buying dips in healthy stocks, not catching falling knives.
2. **Oversold**: RSI(14) drops below 30 (or below about 35 for stronger stocks).
3. **Trigger**: wait for RSI to **turn up and cross back above 30**, or a bullish reversal candle. This avoids buying while it is still falling.
4. **Stop**: below the recent low, or about 1.5 to 2 ATR under your entry.
5. **Exit**: RSI back near 50 to 60, or a close above the 5 to 10-day average. These are short trades, days not weeks.

## When it fails
- The drop comes from **real news** (an earnings miss, a lawsuit). The fair price has changed and the old average is irrelevant. Check the news first.
- The whole market is in a sell-off; dips keep getting bought lower.

## Common mistakes
- Buying at RSI below 30 with no trend filter and no trigger.
- Holding a losing mean-reversion trade past the stop, waiting for it to "come back".
- Using the same rules on a stock in a long downtrend.

## Practice
On a 1-year daily chart, mark every time RSI crossed back above 30 while price was above the 200-day. What happened over the next 5 and 10 days? Repeat for a stock below its 200-day and compare.
`,
    quiz: [
      { q: 'Why add a 200-day SMA filter to an RSI oversold strategy?', a: 'It keeps you buying dips in stocks that are in a long-term uptrend. In a downtrend RSI can stay oversold while price keeps falling, so oversold readings are unreliable.' },
      { q: 'What is the advantage of waiting for RSI to cross back above 30 rather than buying when it first drops below?', a: 'It shows the selling is easing and momentum turned. Buying while it is still falling often means catching the knife too early.' },
      { q: 'Before buying an oversold dip, what should you check that indicators cannot tell you?', a: 'Why it dropped: news. If the drop was caused by fundamental bad news, the price may have reset lower for good.' }
    ]
  }),
  doc({
    id: 'bollinger-squeeze', title: 'Bollinger Bands: squeezes and reversion', category: 'Mean reversion & momentum', level: 'intermediate', minutes: 15,
    summary: 'Use volatility bands to spot quiet periods before big moves, and to judge when price is stretched.',
    tags: ['Bollinger', 'volatility', 'squeeze'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'bb', params: { length: 20, mult: 2 } }, { study: 'volume' }] },
    body: `
## The idea
Bollinger Bands draw a 20-period average with bands two standard deviations above and below. The bands **widen when volatility rises and narrow when it falls**, and volatility tends to come in cycles: quiet periods precede active ones.

## Two ways to use them
**1. The squeeze (expect a move).** When the bands contract to their narrowest in months, the market is coiled. It does not tell you the direction. Wait for a **close outside the band with volume**, then trade in that direction with a stop back inside the bands.

**2. Reversion (expect a snap-back).** In a **range-bound** market, price touching the upper band is stretched and often returns toward the 20-day average. In a trending market, price can "walk the band" for weeks, so fading it is dangerous.

## Rules for a squeeze breakout
1. Bands at a multi-month narrowest width.
2. Price closes outside a band, on above-average volume.
3. **Entry** on that close or the next bar. **Stop**: the 20-day average (or the opposite side of the recent range). **Target**: a measured move, or trail behind the 20-day average.

## Rules for range reversion
1. First confirm the market is ranging: flat 20-day average, repeated turns.
2. Price closes outside the lower band, then back inside: consider a long, targeting the average. Stop below the recent low.
3. If price keeps hugging the band and the average is sloping, stand aside.

## Common mistakes
- Treating a band touch as a signal by itself. It only says price is stretched.
- Fading a strong trend because "it touched the upper band".
- Taking the squeeze direction guess before the market shows its hand.

## Practice
Find the tightest squeeze on the 6-month chart. Note how long it lasted, which way price broke and how far it moved. Then find a band touch that reverted and one that walked the band.
`,
    quiz: [
      { q: 'Does a Bollinger squeeze tell you which way price will break?', a: 'No. It signals that volatility is unusually low and a larger move is likely, but direction comes from the breakout itself.' },
      { q: 'Why can fading the upper band be dangerous?', a: 'In a strong uptrend price can stay near or above the upper band for a long time ("walking the band"), so a short at the touch keeps losing.' },
      { q: 'What do the bands do when volatility rises?', a: 'They widen, because they are set by the standard deviation of recent prices.' }
    ]
  }),
  doc({
    id: 'macd-momentum', title: 'MACD momentum signals', category: 'Mean reversion & momentum', level: 'intermediate', minutes: 12,
    summary: 'Read MACD crossovers and the histogram as a gauge of momentum, and combine them with trend to cut false signals.',
    tags: ['MACD', 'momentum', 'crossover'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'macd', params: { fast: 12, slow: 26, signal: 9 } }, { study: 'sma', params: { length: 50 } }, { study: 'volume' }] },
    body: `
## The idea
**MACD** is the difference between a fast (12) and slow (26) exponential average. A **signal line** (a 9-period average of MACD) smooths it, and the **histogram** shows the gap between the two. It measures whether momentum is speeding up or slowing down.

## Signals
- **Signal-line cross**: MACD crossing above the signal line is a bullish momentum shift; below is bearish.
- **Zero-line cross**: MACD crossing above zero means the fast average is above the slow average, which is bullish trend momentum.
- **Histogram shrinking**: while price still rises, a shrinking histogram warns that momentum is fading before price turns.
- **Divergence**: price makes a new high but MACD does not. A warning, not a sell signal.

## Rules (with a trend filter)
1. **Trend**: price above the 50-day SMA (for longs).
2. **Entry**: MACD crosses above the signal line, ideally while still below or near zero (early in a move).
3. **Stop**: below the recent swing low.
4. **Exit**: MACD crosses back below the signal line, or price closes under the 50-day.

## Limits
MACD is built from moving averages, so it **lags** and gives many false crosses in sideways markets. Using it alone leads to overtrading. Its value is confirmation: a level or pullback setup with a MACD turn in your favour is stronger than either alone.

## Common mistakes
- Trading every crossover regardless of trend or market conditions.
- Treating divergence as an instant reversal signal. Divergence can last a long time.
- Optimising the 12/26/9 settings until they fit the past perfectly. That rarely holds going forward.

## Practice
On the 6-month chart, mark each MACD signal-line cross. Note which happened with price above the 50-day and which below. Which set worked better?
`,
    quiz: [
      { q: 'Why is a MACD crossover in a sideways market unreliable?', a: 'MACD is built from moving averages, so in a range the lines keep crossing back and forth, producing repeated false signals.' },
      { q: 'What does a shrinking histogram during a rally tell you?', a: 'Upward momentum is slowing. It warns that the move may be running out of steam, though price can still rise for a while.' },
      { q: 'What is the safest way to use MACD?', a: 'As confirmation of a setup you already have (a level, a pullback in a trend), not as a stand-alone signal.' }
    ]
  }),
  doc({
    id: 'opening-range-breakout', title: 'Opening range breakout (intraday)', category: 'Intraday', level: 'advanced', minutes: 15,
    summary: 'Use the first 15 to 30 minutes of the session to define a range, and trade the break with VWAP as context.',
    tags: ['intraday', 'opening range', 'VWAP', 'day trading'],
    chartSetup: { range: '1D', interval: '5min', type: 'candles', studies: [{ study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
The first minutes of the US session (09:30 to 09:45 or 10:00 New York time) carry the day's heaviest volume and biggest disagreements. The **opening range** is the high and low of that window. A break beyond it often shows which side won the early fight.

## The setup
1. Mark the **opening range high (ORH) and low (ORL)** of the first 15 or 30 minutes.
2. Note **VWAP**, the volume-weighted average price for the day. Price above VWAP means buyers control the day so far.
3. Prefer stocks that are in the news, gapping, or have unusually high volume. Quiet stocks give quiet breaks.

## Rules (long)
- **Entry**: a 5-minute candle **closes above the ORH**, with price above VWAP and above-average volume.
- **Stop**: back inside the range, below the ORH, or below the range midpoint. If the range is wide, the stop is wide, so the position must be small.
- **Target**: 1 to 2 times the range height, or a round number or previous-day high. Trail under the last higher low.
- **Time stop**: if it has not worked in 30 to 60 minutes, exit. Breakouts that stall usually fail.
- Mirror for shorts below the ORL and VWAP (your paper account can sell short).

## Risks specific to intraday
- **Speed and costs**: spreads and slippage matter far more on short trades.
- **Fake-outs** are common in the first hour. Wait for the close of the 5-minute candle.
- **News and halts** can gap a stock straight through a stop.
- Overtrading: cap yourself at a few setups per day and a maximum daily loss.

## Common mistakes
- Trading without checking the wider picture: the broad market and the daily chart levels above you.
- A stop wider than the range with a full-size position.
- Chasing a break that is already far extended from the range.

## Practice
Open a 5-minute chart for today. Mark the opening range and VWAP. Did price break out, and was the break above VWAP on high volume? What happened over the next hour?
`,
    quiz: [
      { q: 'Why is a 5-minute candle close beyond the range better than a touch?', a: 'Early in the session price pokes beyond levels and reverses often. Requiring a close filters some fake-outs.' },
      { q: 'What does trading above VWAP indicate?', a: 'On average, buyers who traded today are in profit and control the day so far. It gives long trades a supportive backdrop.' },
      { q: 'Why use a time stop on intraday breakouts?', a: 'A real breakout should move promptly. One that stalls suggests the move lacks fuel, and holding ties up risk for little reason.' }
    ]
  }),
  doc({
    id: 'earnings-awareness', title: 'Trading around earnings', category: 'Events & options', level: 'intermediate', minutes: 14,
    summary: 'Why earnings are a different kind of risk, how gaps break stops, and how to prepare rather than gamble.',
    tags: ['earnings', 'gaps', 'event risk', 'analysts'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
Four times a year a company reports results. Price often **gaps** at the open: it jumps or drops without trading at the prices in between. Stops do not protect you from a gap: a stop at $95 on a stock that opens at $85 fills near $85.

## What moves the price
It is rarely the raw result. It is the result **versus expectations**, plus the company's **guidance** for the next quarter. A record profit that is smaller than analysts hoped can send a stock down. The consensus estimates (revenue, EPS) are visible on the Analyst screen, including how past reports compared.

## Preparing
1. **Know the date.** Check it before entering any position.
2. **Read the expectation.** Look at estimates and how the stock reacted to previous reports (the chart's earnings-day candles show typical size).
3. **See what options imply.** The expected move from options tells you how large a move the market prices in. Compare it with past moves.
4. **Decide your plan beforehand:** hold through it (accepting gap risk with a small position), reduce size, or close before.

## Choices around the event
- **Stay out** and trade the reaction afterwards. Often the cleanest: wait for the first hour, then use a range breakout or a level.
- **Hold with reduced size**, sized so a gap of twice the typical move still fits your risk limit.
- **Never** hold a full-size position through earnings because the chart looks good.

## Common mistakes
- Forgetting the date and getting gapped.
- Treating a good chart as protection against a bad report.
- Sizing by the stop distance when a gap can be several times larger.
- Chasing the first spike after the report, which often reverses.

## Practice
Pick a stock and find its last four earnings-day candles on the daily chart. Measure each gap in percent. Then look at the analyst estimates: did the company beat them? Did beating always mean the stock rose?
`,
    quiz: [
      { q: 'You hold a stock with a stop at $95. It reports earnings and opens at $85. Where does your stop fill?', a: 'Around $85 (the open), not $95. A stop becomes a market order once triggered and cannot protect against a gap.' },
      { q: 'A company beats profit estimates but the stock falls 8%. Give one possible reason.', a: 'Expectations were even higher, or guidance for the next period disappointed. Price reacts to results versus expectations, not to the result alone.' },
      { q: 'How should the earnings gap affect position size?', a: 'Size for a gap larger than a normal stop, for example twice the typical earnings move, so that a bad outcome still fits inside your risk limit.' }
    ]
  }),
  doc({
    id: 'options-basics', title: 'Options basics (learning only)', category: 'Events & options', level: 'advanced', minutes: 20,
    summary: 'Calls, puts, strikes and expiries; what implied volatility, delta and theta mean; and two beginner-friendly income ideas. Analysis only: the paper account trades stocks.',
    tags: ['options', 'delta', 'theta', 'implied volatility', 'covered call'],
    chartSetup: null,
    body: `
## The idea
An **option** is a contract giving the right, not the obligation, to buy or sell 100 shares at a fixed price (the **strike**) by a date (the **expiry**). You pay a **premium** for that right.
- A **call** gains when the stock rises. A **put** gains when it falls.
- Prices are quoted per share, so a $2.50 premium costs $250 per contract.

## What sets the price
- **Intrinsic value**: how far the option is in the money (a $100 call on a $105 stock has $5).
- **Time value**: what buyers pay for the chance of more movement. It **decays** as expiry nears, fastest in the last weeks.
- **Implied volatility (IV)**: the movement the market expects. Higher IV means pricier options. Before earnings IV rises and then **collapses** after the report ("IV crush"), which can make a correct direction still lose money.

## The Greeks in plain words
- **Delta**: roughly the share exposure per contract (0.50 is about 50 shares) and a rough chance of finishing in the money.
- **Theta**: the dollars an option loses per day from time passing. Buyers pay it, sellers collect it.
- **Vega**: how much the price changes per point of IV.
- **Gamma**: how fast delta changes. Highest near the strike close to expiry.

## Two beginner ideas (educational)
- **Covered call**: own 100 shares, sell a call above the price. You collect premium but cap your upside above the strike.
- **Cash-secured put**: hold cash to buy 100 shares, sell a put below the price. You collect premium and agree to buy at the strike if assigned.

## Risks
- Long options can lose 100% of the premium, and time works against you.
- Short options can lose far more than the premium collected.
- Wide bid-ask spreads make illiquid options expensive to trade.
- Assignment and expiry mechanics catch beginners out.

## In this app
The Option Stats screen shows a real, delayed options chain with implied volatility, expected move and open interest. You cannot place option orders in the paper account: use the screen to learn how options are priced.

## Practice
Open Option Stats for a stock you know. Find the at-the-money call and put for the next expiry. Compute the straddle cost and compare with the expected move. Which contracts have the highest volume?
`,
    quiz: [
      { q: 'Why can you be right about direction on a call bought before earnings and still lose money?', a: 'Implied volatility usually collapses after the report (IV crush), shrinking the option\'s time value, and time decay continues. The move must exceed what was already priced in.' },
      { q: 'An option has a delta of 0.30. Roughly what does that mean?', a: 'It behaves like about 30 shares per contract, and the market implies roughly a 30% chance of it finishing in the money.' },
      { q: 'What is the main trade-off of a covered call?', a: 'You collect premium now but give up gains above the strike, while still carrying the downside risk of owning the stock.' }
    ]
  })
]

export const builtinById = (id: string) => BUILTIN_STRATEGIES.find((s) => s.id === id)
