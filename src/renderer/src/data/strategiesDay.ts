import type { StrategyDoc } from '../../../shared/strategies'
import { doc } from './strategyDoc'

// Day trading lessons. They sit in the "Intraday" category next to the opening range breakout.
export const DAY_TRADING: StrategyDoc[] = [
  doc({
    id: 'day-trading-reality', title: 'Day trading: what it really takes', category: 'Intraday', level: 'beginner', minutes: 12,
    summary: 'Before any setup: the odds, the real costs, the rules, and what a paper account cannot teach you about day trading.',
    tags: ['day trading', 'basics', 'costs', 'risk'],
    chartSetup: { range: '1D', interval: '5min', type: 'candles', studies: [{ study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
Day trading means opening and closing positions within the same session, so nothing is held overnight. It is the most demanding way to trade: decisions are fast, small mistakes repeat many times a day, and costs add up.

## The honest odds
Studies of retail day traders in several countries have found that **most lose money over time**, and only a small minority are consistently profitable. That is not a reason to give up learning, but it is a reason to treat this as a skill you practise for months before real money is involved, and to expect to lose some of it anyway.

## What eats the profit
- **Spread and slippage**: you buy near the ask and sell near the bid. On a fast stock the price you get can differ from the price you saw.
- **Commissions and fees**, where your broker charges them.
- **Taxes**: in many countries short-term gains are taxed at a higher rate than long-term gains. Check your own rules.
- **Time**: it is close to a full-time job during market hours.

## Rules you must know before you start
- In the US, a margin account that makes four or more day trades within five business days can be flagged a **pattern day trader**, which has required a minimum account equity (long set at $25,000). The rules have been under review, so **check the current requirement with your broker**.
- **Settled cash**: in a cash account you can only trade with money from settled sales.
- Short selling needs a margin account and available shares to borrow.

## What the paper account does not teach
Trading Lab fills orders from real 1-minute bars with **no slippage, commissions, partial fills, extended hours or market holidays**. Paper results will look better than real results would. Also, **real money changes behaviour**: fear and greed are mostly absent when nothing is at stake.

## A sensible way to start
1. Paper trade **one setup** (for example the opening range breakout) for at least 30 sessions.
2. Journal every trade with the plan, the result in **R**, and a screenshot.
3. Cap risk per trade at a small fixed amount and set a **maximum daily loss** (see the routine lesson).
4. Only judge the method after enough trades. A few days of wins or losses means very little.

## Common mistakes
- Starting with real money before a written, tested plan.
- Trading all day instead of only during the best hours (the first and last hour usually have the most volume).
- Increasing size after a win or to win back a loss.

## Practice
Open today's 5-minute chart with VWAP and volume. Without trading, mark where you would have entered and exited following a plan you write first. At the close, note what the price actually did.
`,
    quiz: [
      { q: 'Name three costs that make real day trading harder than paper trading.', a: 'Spread and slippage, commissions or fees, and taxes (short-term gains are often taxed more heavily). Paper fills here have none of these.' },
      { q: 'Why judge a day-trading method over dozens of trades rather than a few days?', a: 'Short stretches are dominated by luck. Only a larger sample shows whether the method has an edge once costs are included.' },
      { q: 'What is the pattern day trader rule?', a: 'A US regulation affecting margin accounts that make four or more day trades in five business days, which has required a minimum equity. It is under review, so check the current rule with your broker.' }
    ]
  }),
  doc({
    id: 'vwap-trading', title: 'VWAP: trend days and reversion', category: 'Intraday', level: 'intermediate', minutes: 14,
    summary: 'Use the volume-weighted average price as the day\'s fair-value line: stay with the trend above it, and know when stretched prices snap back.',
    tags: ['intraday', 'VWAP', 'day trading', 'trend', 'mean reversion'],
    chartSetup: { range: '1D', interval: '5min', type: 'candles', studies: [{ study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
**VWAP** is the average price paid today, weighted by volume. It **resets every morning** and builds from the open. Large traders use it as a benchmark, so price often reacts around it: it acts like a moving "fair value" for the session.

## Two ways to use it
**1. As a trend filter.** Price holding above VWAP means buyers who traded today are mostly in profit and in control. Long ideas are better above it, short ideas below it.

**2. As a pullback and reversion line.**
- On a **trend day**, price often dips to VWAP and bounces. That is a lower-risk place to join the trend.
- On a **range day**, price that stretches far above or below VWAP tends to drift back toward it.

## Telling the two days apart
- Trend day: price stays on one side of VWAP for hours, VWAP slopes the same way, pullbacks are shallow.
- Range day: price crosses VWAP repeatedly and VWAP is flat.
If price keeps crossing it, the line is not helping. Stand aside.

## Rules (long, trend day)
- **Context**: price above a rising VWAP, and the broad market is not falling hard.
- **Entry**: a pullback toward VWAP that holds, with a candle closing back up and volume drying up on the dip.
- **Stop**: just below VWAP or the pullback low. A close below VWAP on volume is the exit signal.
- **Target**: the day's high, then trail. Take at least part at 1R to 2R.
- Mirror for shorts under VWAP (your paper account needs to be a margin account to sell short).

## Limits
- VWAP is **only meaningful on intraday charts**, and it is **unstable in the first 15 minutes** when little volume has traded.
- It is a lagging average. It does not predict, it describes.

## Common mistakes
- Treating every touch as a buy signal on a day when price chops through it.
- Buying a stock stretched far above VWAP "because it is strong".
- Putting the stop far below VWAP, which makes the position too big for the risk.

## Practice
On a 5-minute chart, note when VWAP acted as support or resistance today and when it was ignored. Which kind of day was it?
`,
    quiz: [
      { q: 'Why does VWAP reset each day, and what does that mean for a daily chart?', a: 'It averages the current session only, so it starts again each morning. On daily or longer charts it carries no useful meaning.' },
      { q: 'How can you tell a range day from a trend day using VWAP?', a: 'On a trend day price stays on one side and VWAP slopes. On a range day price crosses it repeatedly and VWAP is flat.' },
      { q: 'Why is VWAP unreliable in the first 15 minutes?', a: 'Very little volume has traded, so one or two large prints swing the average.' }
    ]
  }),
  doc({
    id: 'gap-trading', title: 'Trading gaps', category: 'Intraday', level: 'intermediate', minutes: 14,
    summary: 'What a gap is, why some gaps keep running and others fill, and how to tell them apart with volume and the first minutes.',
    tags: ['gaps', 'intraday', 'day trading', 'catalyst', 'volume'],
    chartSetup: { range: '5D', interval: '5min', type: 'candles', studies: [{ study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
A **gap** is when a stock opens away from the previous close, leaving empty space on the chart. It happens when news or demand arrives while the market is closed: earnings, upgrades, guidance, market-wide moves.

## Gap and go versus gap fill
- **Gap and go**: the opening move continues in the gap's direction. More likely when there is a **real catalyst**, **unusually high volume**, and price holds the gap and VWAP.
- **Gap fill (fade)**: price moves back to the previous close, "filling" the gap. More likely for **small gaps with no news** and weak volume, but a fill is common, not guaranteed.

## What to check first
1. **Why** did it gap? A clear catalyst beats a random move. Use the Symbol news and Market news screens.
2. **Size** compared with the stock's normal range (ATR). A gap of half a day's usual range is small; several times that is large.
3. **Relative volume**: heavy trading in the first minutes shows real interest.
4. **Where is the previous close**, and are there daily levels nearby?

## A simple gap-and-go plan (long)
- Wait for the **first 5 or 15 minutes** to set a high and low. Do not buy the opening print.
- **Entry**: a close above the opening range high, above VWAP, on rising volume.
- **Stop**: below the opening range low or VWAP.
- **Target**: 2R, or the next daily level; trail the rest.

## Gap fill (fade) as a study only
Selling a gap-up that fails (price loses VWAP and the opening range low) aims at the previous close. It fights momentum, so the stop must be tight and the position small. Never fade a gap that has a strong catalyst and heavy volume.

## What this app cannot show
Trading Lab shows **regular-session** bars only, so you cannot see pre-market action, which is where many real gap traders do their preparation. Paper fills also ignore the wide spreads at the open.

## Common mistakes
- Buying the open because "it is gapping up".
- Ignoring that a gap into a major resistance level can stall at once.
- Fading a gap that has news behind it.

## Practice
Use the Stock screener or Market movers to find a stock that gapped today. Write down the catalyst, the gap size in ATRs, and whether it filled or ran. Repeat for a few days.
`,
    quiz: [
      { q: 'What makes a gap more likely to continue than to fill?', a: 'A clear catalyst, unusually high volume, and price holding above the gap area and VWAP in the first minutes.' },
      { q: 'Why wait for the first 5 to 15 minutes instead of buying the open?', a: 'The opening prints are volatile and spreads are wide. A range after a few minutes gives a defined level and stop.' },
      { q: 'What can this app not show that gap traders usually study?', a: 'Pre-market and other extended-hours trading. Only regular-session bars are available.' }
    ]
  }),
  doc({
    id: 'intraday-pullback', title: 'Intraday trend pullbacks (EMA and VWAP)', category: 'Intraday', level: 'intermediate', minutes: 14,
    summary: 'Join an intraday trend after a shallow, low-volume dip to the 9 or 20 EMA or VWAP, with a stop under the pullback.',
    tags: ['intraday', 'pullback', 'EMA', 'VWAP', 'day trading'],
    chartSetup: { range: '1D', interval: '5min', type: 'candles', studies: [{ study: 'ema', params: { length: 9 } }, { study: 'ema', params: { length: 20 } }, { study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
The intraday cousin of the daily pullback: when a stock trends up on a 5-minute chart, it moves in steps, rising, pausing, rising again. The **pause is the entry**, because the stop can be close.

## Identify the trend first
- A series of **higher highs and higher lows**.
- Price above **VWAP** and above a rising **20 EMA**.
- The wider picture agrees: the daily chart is not slamming into resistance and the broad market is not falling.

## The setup (long)
1. Price makes a new high with strong volume.
2. It **pulls back for 2 to 5 candles** on shrinking volume, to the 9 EMA, the 20 EMA or VWAP.
3. A candle **closes back up** from that area (a rejection of lower prices).

## Rules
- **Entry**: above the high of that rejection candle.
- **Stop**: under the pullback low, or just under the 20 EMA / VWAP.
- **Target**: the prior high first (often about 1R), then trail under each new higher low.
- **Skip it** if the pullback is deep, has heavy volume, or breaks VWAP.

## Why it works, and when it does not
Shallow, quiet pullbacks suggest sellers are not committed. It fails in **ranges** (the EMAs flatten and tangle), around **news**, and late in the day when the trend runs out of energy.

## Common mistakes
- Buying a pullback in a market with no trend.
- Entering before the rejection candle closes.
- Letting a winner turn into a loser: decide how you will trail before you enter.
- Taking the setup three times after it has failed twice.

## Practice
On a 5-minute chart, find today's best pullback. Mark the entry, stop and first target, and measure the reward-to-risk in R.
`,
    quiz: [
      { q: 'What two features make an intraday pullback more attractive?', a: 'It is shallow and it happens on shrinking volume, which suggests sellers are not committed.' },
      { q: 'Where does the stop go, and why does that help?', a: 'Just under the pullback low or the 20 EMA / VWAP. It is close, so the same risk buys a larger position and a better reward-to-risk.' },
      { q: 'When should you skip the setup?', a: 'When the EMAs are flat and tangled (a range), the pullback is deep or on heavy volume, VWAP breaks, or news is due.' }
    ]
  }),
  doc({
    id: 'stocks-in-play', title: 'Choosing stocks in play: relative volume and catalysts', category: 'Intraday', level: 'beginner', minutes: 12,
    summary: 'A day trader needs movement and liquidity. How to build a short watchlist each morning from news, movers and the screener.',
    tags: ['day trading', 'screener', 'relative volume', 'catalyst', 'watchlist'],
    chartSetup: { range: '1M', interval: '1day', type: 'candles', studies: [{ study: 'atr', params: { length: 14 } }, { study: 'volume' }] },
    body: `
## The idea
Even a perfect setup needs a stock that is **moving** and easy to trade. Day traders concentrate on a handful of "stocks in play" instead of scanning hundreds.

## What makes a stock in play
- **A catalyst**: earnings, an upgrade or downgrade, guidance, a product or regulatory announcement, or a big move in its sector.
- **Relative volume**: trading far more than its normal volume for that time of day.
- **Range**: its typical daily movement (ATR) is large enough that a trade can reach 2R and still pay for costs.
- **Liquidity**: heavy volume and a tight spread, so entering and leaving costs little.

## A morning routine in the app
1. **Market news** and **Market performance**: which sectors are leading or lagging?
2. **Stock screener**: filter for a minimum price, large volume and a sector, then sort by the day's change.
3. **Watchlists**: put your three to five best names into a list so their live prices sit in one place.
4. For each name, note the **catalyst**, the **key daily levels**, and the **ATR**.

## Skip these
- Stocks with wide spreads or thin volume: stops fill badly.
- Stocks with a news release due in minutes, unless you intend to trade the news and accept the gap risk.
- Names you cannot explain. If you do not know why it is moving, you do not know when it stops.

## Common mistakes
- Watching too many stocks, which means seeing none of them well.
- Picking by the biggest percentage move alone (these are often cheap, thin and dangerous).
- Ignoring the broad market direction.

## Practice
Build tomorrow's watchlist tonight: five symbols, with the reason each one might move, the level you care about, and its ATR.
`,
    quiz: [
      { q: 'What is relative volume and why does it matter?', a: 'Volume compared with the stock\'s normal volume at that time of day. A high figure shows unusual interest and makes follow-through more likely.' },
      { q: 'Why include ATR in your checklist?', a: 'It shows how far the stock normally moves. If the range is tiny, costs eat the profit; if it is large, positions must be smaller.' },
      { q: 'Why avoid thinly traded stocks?', a: 'Spreads are wide and stops fill badly, so real results will be worse than the plan.' }
    ]
  }),
  doc({
    id: 'failed-breakout-fade', title: 'Failed breakouts and range fades', category: 'Intraday', level: 'advanced', minutes: 14,
    summary: 'When a break above a range fails and price closes back inside, trapped buyers can fuel a move to the other side. How to trade it with a tight stop.',
    tags: ['intraday', 'failed breakout', 'range', 'reversal', 'day trading'],
    chartSetup: { range: '5D', interval: '15min', type: 'candles', studies: [{ study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
A breakout makes buyers who chase it feel clever, until it fails. When price pushes above a clear high, cannot hold, and **closes back inside the range**, those buyers are trapped and their stops become selling pressure. That is the fuel for a **failed breakout** (a "false breakout" or "fakeout").

## Where it works
- **Range days**: price has been oscillating between a clear high and low, and VWAP is flat.
- **Obvious levels**: yesterday's high or low, the opening range, a round number.

## The setup (short, after a failed break above)
1. A clear **resistance** level has held at least twice.
2. Price pushes **above** it, ideally on weak or fading volume.
3. A candle **closes back below** the level. That close is the signal, not the poke above.

## Rules
- **Entry**: after the close back inside the range, or on a break of that candle's low.
- **Stop**: **above the extreme of the false break**. This is the main strength of the setup: the stop is tight.
- **Target**: the middle of the range first, then the other side of the range.
- Mirror for failed breaks below support. Shorting needs a margin paper account.

## When not to fade
- A break on **heavy volume with a news catalyst** may be the start of a real trend day.
- A broad market moving strongly in the same direction.
- If price re-takes the level and **holds above it**, the failure has failed. Exit, do not argue.

## Common mistakes
- Fading the first poke instead of waiting for the close back inside.
- A target beyond the range with a stop that is not tight.
- Treating it as a reversal of the trend rather than a trade back inside a range.

## Practice
Find three levels on today's 15-minute chart that were pushed through. For each, was the break held (a breakout) or failed (a fakeout)? What did volume do on the break?
`,
    quiz: [
      { q: 'Why is the signal the close back inside the range, not the break above it?', a: 'Price often pokes through a level and keeps going. The close back inside shows the break failed and buyers are trapped.' },
      { q: 'Where does the stop go on a failed-breakout short?', a: 'Above the extreme of the false break. If price returns there, the idea is wrong, and the stop is close.' },
      { q: 'When is fading a break dangerous?', a: 'When it comes on heavy volume with a real catalyst or the whole market is moving the same way: it may be a genuine trend day.' }
    ]
  }),
  doc({
    id: 'day-trader-routine', title: 'A day-trading routine and daily loss limits', category: 'Intraday', level: 'intermediate', minutes: 12,
    summary: 'Preparation before the open, rules for the session, a hard daily loss limit and a short review after the close.',
    tags: ['day trading', 'routine', 'risk', 'discipline', 'journal'],
    chartSetup: { range: '1D', interval: '5min', type: 'candles', studies: [{ study: 'vwap' }, { study: 'volume' }] },
    body: `
## The idea
Day traders rarely fail for lack of a setup. They fail because one bad day, or one angry hour, undoes weeks of work. A routine and hard limits are what keep a bad day small.

## Before the open
- **Market**: what are the indexes doing, and is there scheduled news (rate decisions, jobs data, big earnings)?
- **Your list**: three to five stocks in play, each with a catalyst, levels and a plan.
- **Your limits for the day**, written down: risk per trade, maximum daily loss, maximum number of trades.

## During the session
- Trade **only your list and your setups**. If it is not in the plan, it is not a trade.
- Use the **Position Calculator** so every trade risks the same amount.
- After a loss, **wait**. Take a short break rather than trading to get it back.
- The **first and last hour** usually offer the best volume. The middle of the day is often slow and choppy, and a fine time to stop.

## Hard limits (decide them in advance)
| Limit | Example | Why |
|---|---|---|
| Risk per trade | 0.25% to 1% of the account | A losing streak cannot hurt much |
| Max daily loss | 2 to 3 times your risk per trade (2 to 3 R) | Stops a bad day from becoming a disaster |
| Max trades | A fixed number, such as 3 to 5 | Stops overtrading |
| Stop after | 2 to 3 losses in a row | Protects against tilt |
These numbers are examples, not advice. What matters is that they are written down before the market opens and followed.

## After the close
- **Journal** every trade: the plan, the entry and exit, the result in R, and whether you followed your rules.
- Mark each trade **followed plan** or **broke plan**. A winning trade that broke the rules is still a mistake.
- Write one thing to do better tomorrow.

## Common mistakes
- Moving the daily loss limit because "this setup is special".
- Revenge trading: larger size right after a loss.
- Skipping the review because the day was good.

## Practice
Tonight, write your own one-page plan with the limits above. Tomorrow, paper trade with it and count how many trades broke the plan.
`,
    quiz: [
      { q: 'Why set the maximum daily loss before the market opens?', a: 'Once you are losing, judgement is poor. A rule written in advance does not depend on how you feel mid-session.' },
      { q: 'A trade followed none of your rules but made money. How should you record it?', a: 'As a broken-plan trade. The profit was luck, and repeating the behaviour will eventually cost money.' },
      { q: 'Why stop after two or three losses in a row?', a: 'A streak can mean the market does not suit your setup today, and emotions (tilt) make the next decisions worse.' }
    ]
  })
]
