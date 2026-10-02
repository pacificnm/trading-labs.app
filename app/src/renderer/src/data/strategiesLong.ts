import type { StrategyDoc } from '../../../shared/strategies'
import { doc } from './strategyDoc'

// Longer-horizon lessons: investing, plus swing trading and trade management (which sit with Trend and Foundations).
export const LONG_TERM: StrategyDoc[] = [
  doc({
    id: 'investing-vs-trading', title: 'Investing vs trading: pick your time horizon', category: 'Long-term investing', level: 'beginner', minutes: 12,
    summary: 'How the goal, the time you hold and the tools you use differ between long-term investing, swing trading and day trading.',
    tags: ['investing', 'basics', 'time horizon', 'planning'],
    chartSetup: { range: '5Y', interval: '1week', type: 'candles', studies: [{ study: 'sma', params: { length: 40 } }] },
    body: `
## The idea
Before choosing a method, choose a **time horizon**. It decides what you analyse, how much you risk, how often you act and how much a bad month matters.

## Three common horizons
| | Day trading | Swing trading | Long-term investing |
|---|---|---|---|
| Holding time | Minutes to hours | Days to weeks | Years |
| Main tools | 1 to 15 minute charts, VWAP, volume | Daily charts, trends, pullbacks | Fundamentals, valuation, diversification |
| Profit comes from | Small moves, many times | Medium moves | Business growth, dividends and compounding |
| Time needed | Hours every session | Minutes a day | Hours a month |
| Costs and taxes | Highest | Medium | Lowest |

## Why the horizon matters
- **Noise shrinks with time.** Over minutes, price is mostly noise. Over years, it follows earnings, growth and the economy.
- **Costs compound too.** Frequent trading pays the spread, fees and often higher taxes each time.
- **Your temperament decides.** Someone who panics at a 5% daily move will find long-term investing easier than day trading.

## Matching goals to horizon
- Money you need in **under 3 to 5 years** (a house deposit, tuition) should not be fully exposed to stocks.
- Money for **decades away** (retirement) can ride out large swings, and benefits most from compounding.
- You can combine them: a long-term core of diversified holdings, and a **small** trading account for learning.

## Common mistakes
- Day trading money you cannot afford to lose.
- Turning a losing short-term trade into a "long-term investment" to avoid taking the loss.
- Mixing methods without a plan: a stock bought on a breakout and then held "for the dividend".

## Practice
Write one sentence for each pot of money you have: what it is for, when you need it, and which horizon fits. Then decide which parts of this app you will use for each.
`,
    quiz: [
      { q: 'Why is a 5-year chart more informative about a business than a 5-minute chart?', a: 'Short-term price is mostly noise. Over years price follows earnings, growth and the economy much more closely.' },
      { q: 'What should you do with money you need in two years?', a: 'Keep most of it out of volatile stocks. A large drop close to the time you need it cannot be recovered.' },
      { q: 'What is the problem with calling a loser a "long-term investment"?', a: 'It avoids a decision. A trade that broke its plan should be closed, not renamed.' }
    ]
  }),
  doc({
    id: 'diversification-allocation', title: 'Diversification and asset allocation', category: 'Long-term investing', level: 'beginner', minutes: 14,
    summary: 'Why not putting everything in one stock or sector protects you, and how to think about the mix of assets you hold.',
    tags: ['investing', 'diversification', 'asset allocation', 'risk', 'ETF'],
    chartSetup: null,
    body: `
## The idea
Diversification means holding assets that do not all fall together. It does not raise the best case, it limits the **worst case**. Very few investors get rich picking the one winner, and many are hurt by the one loser.

## Two levels
1. **Asset allocation**: the split between broad groups such as stocks, bonds and cash. This drives most of a portfolio's ups and downs.
2. **Diversification inside each group**: many companies, sectors and regions instead of a handful.

## Concentration risk
- A single stock can fall 50% or more and never recover. A broad index has very rarely done that.
- Owning five tech stocks is **not** five independent bets. They often move together.
- Your job and your home may already tie you to one industry or region.

## Ways to diversify
- **Broad index funds and ETFs** hold hundreds or thousands of companies in one purchase, at low cost.
- **Sector and regional spread** so one industry or country does not dominate.
- **Bonds and cash** reduce swings, in exchange for lower expected growth.

## Choosing a mix
There is no number that is right for everyone. The factors are:
- **Time horizon**: longer allows more stocks.
- **Risk tolerance**: how would you act if the portfolio fell 40%? Be honest. Selling at the bottom is the real danger.
- **Needs**: income, goals and other assets.
Example mixes you will see quoted (such as 60% stocks and 40% bonds) are illustrations, not recommendations.

## What diversification does not do
- It does not prevent losses in a broad market fall, when most stocks drop together.
- Too many holdings can mean you own the index with extra fees and effort.

## Common mistakes
- Believing a familiar company is "safe" so it can be a large share.
- Mistaking many positions for diversification when they are all the same theme.
- Never looking at the whole portfolio, only individual positions.

## Practice
Open the **Account** screen and list your positions. For each, write its sector. What share of your money is in the largest one, and in the largest sector? Is that what you intended?
`,
    quiz: [
      { q: 'Why is owning five technology stocks not real diversification?', a: 'They tend to move together because they respond to the same news and trends. One bad sector day can hit all five.' },
      { q: 'What does diversification not protect against?', a: 'A broad market decline, when most stocks fall together. It limits single-company and single-sector risk, not market risk.' },
      { q: 'Why ask how you would react to a 40% fall?', a: 'A mix you would abandon in a crash is too aggressive. Selling at the low locks in the loss.' }
    ]
  }),
  doc({
    id: 'dca-rebalancing', title: 'Dollar-cost averaging and rebalancing', category: 'Long-term investing', level: 'beginner', minutes: 12,
    summary: 'Investing a fixed amount on a schedule, and restoring your target mix on a rule, instead of guessing market tops and bottoms.',
    tags: ['investing', 'dollar-cost averaging', 'rebalancing', 'discipline'],
    chartSetup: { range: '5Y', interval: '1week', type: 'line', studies: [] },
    body: `
## Dollar-cost averaging (DCA)
Invest a **fixed amount at regular intervals** (for example every month), whatever the price. You buy more shares when prices are low and fewer when high, and you never have to pick the moment.

**Strengths**
- Removes the pressure of timing the market.
- Builds the habit, and fits a paycheck.
- Reduces the regret of investing everything just before a drop.

**Honest limits**
- If you already hold a lump sum, investing it all at once has historically beaten spreading it out **more often than not**, because markets rise more often than they fall. DCA trades some expected return for a smoother ride.
- DCA does not make a bad investment good. It only changes **when** you buy.

## Rebalancing
Over time the winners grow and your mix drifts. If your target was 70% stocks and 30% bonds, a strong year can leave you at 80/20 and with more risk than you planned.

**Rebalancing** means selling some of what has grown and buying what has lagged, to return to the target. You can do it:
- **On a schedule** (once or twice a year), or
- **On a threshold** (when any holding is more than 5 percentage points from its target).

Directing new money to the underweight holdings rebalances without selling. In taxable accounts selling can create taxes, so rules differ by country.

## Why these are useful
Both are **rules that remove emotion**. The hardest moments to follow them are the same moments they matter most: buying when news is awful, trimming when everything is soaring.

## Common mistakes
- Stopping a DCA plan after a market fall, which is when it buys the most.
- Rebalancing so often that costs and taxes eat the benefit.
- Having no target mix, so there is nothing to rebalance to.

## Practice
Pick a symbol and look at a 5-year weekly chart. Imagine putting the same amount in every month. Mark a few points where it would have bought at a high and at a low, and notice how the average cost sits between them.
`,
    quiz: [
      { q: 'Why does dollar-cost averaging buy more shares when the price is low?', a: 'The amount is fixed, so a lower price buys more shares for the same money.' },
      { q: 'Is DCA always better than investing a lump sum immediately?', a: 'No. Historically a lump sum has done better more often, because markets rise more often than they fall. DCA mainly reduces timing regret and risk.' },
      { q: 'What does rebalancing do?', a: 'It returns a drifted portfolio to its target mix by trimming what has grown and adding to what has lagged, keeping risk where you planned it.' }
    ]
  }),
  doc({
    id: 'fundamentals-valuation', title: 'Reading fundamentals and valuation', category: 'Long-term investing', level: 'intermediate', minutes: 18,
    summary: 'Growth, margins, cash flow, debt and the common valuation ratios, and how to compare a company with its peers rather than in isolation.',
    tags: ['fundamentals', 'valuation', 'P/E', 'cash flow', 'investing'],
    chartSetup: { range: '5Y', interval: '1week', type: 'candles', studies: [{ study: 'sma', params: { length: 40 } }] },
    body: `
## The idea
A share is a slice of a business. Fundamentals describe the business: how fast it grows, how much it keeps, what it owes. **Valuation** asks what you are paying for that.

## What to look at
**Growth**
- **Revenue growth**: is the business selling more each year?
- **Earnings and free cash flow growth**: is that turning into profit and cash?

**Quality**
- **Margins** (gross, operating, net): how much of each dollar of sales is kept. Stable or rising margins suggest pricing power.
- **Return on equity / invested capital**: how well management turns money into profit. Consistently high is a good sign, unless debt inflates it.
- **Free cash flow**: cash left after running costs and investment. Profit on paper that never becomes cash is a warning.

**Safety**
- **Debt compared with earnings or cash flow**, and whether interest is easily covered.
- **Cash** on the balance sheet.

## Valuation ratios
| Ratio | Question it answers | Watch out |
|---|---|---|
| **P/E** (price to earnings) | How many years of earnings am I paying for? | Earnings can be one-off or negative |
| **Forward P/E** | The same, on estimated next-year earnings | Estimates can be wrong |
| **PEG** | P/E relative to growth | Growth forecasts are uncertain |
| **P/S** (price to sales) | Useful when there are no profits yet | Ignores margins |
| **EV/EBITDA** | Includes debt, good for comparing companies | EBITDA ignores capital spending |
| **Free cash flow yield** | Cash earned per dollar of price | Can swing year to year |

## Rules of thumb
- **Compare with peers and the company's own history.** A P/E of 30 is high for a bank and ordinary for some software firms.
- **Use several measures.** Any one ratio can mislead.
- **A cheap stock can be cheap for a reason** (a "value trap"): shrinking sales, rising debt.
- **A great company can be a poor investment at too high a price.**

## In the app
Open **Fundamentals** and **Analyst Reports** for a symbol. Look at the growth and margin trends, the ratios, and how analysts' targets compare with the price. Remember these are opinions and estimates.

## Common mistakes
- Buying only because the P/E looks low.
- Comparing ratios across different industries.
- Treating analyst targets as predictions.
- Looking at a single year instead of a trend.

## Practice
Pick two companies in the same industry. Write down growth, margin, debt and P/E for each. Which would you rather own, and what would change your mind?
`,
    quiz: [
      { q: 'Why can a low P/E be a trap?', a: 'The earnings may be about to fall, be one-off, or the business may be shrinking. The low price can reflect real problems.' },
      { q: 'Why compare ratios within an industry?', a: 'Normal levels differ widely between industries. A figure that looks expensive in one can be ordinary in another.' },
      { q: 'What does free cash flow tell you that profit does not?', a: 'Whether profit is turning into actual cash after running costs and investment. Accounting profit alone can be misleading.' }
    ]
  }),
  doc({
    id: 'growth-vs-value', title: 'Growth investing and value investing', category: 'Long-term investing', level: 'intermediate', minutes: 12,
    summary: 'Two classic styles: paying up for fast growth, or buying established businesses priced below what they seem to be worth.',
    tags: ['investing', 'growth', 'value', 'style', 'valuation'],
    chartSetup: { range: '5Y', interval: '1week', type: 'candles', studies: [{ study: 'sma', params: { length: 40 } }] },
    body: `
## Two styles
**Growth investing** buys companies whose sales and profits are growing quickly, often at high valuation ratios, expecting the growth to carry the price higher.

**Value investing** buys companies that look cheap compared with their earnings, assets or cash flow, expecting the price to move toward what the business is worth.

## Side by side
| | Growth | Value |
|---|---|---|
| Typical profile | Fast sales growth, reinvests profit | Mature, steady, may pay dividends |
| Valuation | High P/E, P/S | Low P/E, P/B |
| What drives the price | Growth continuing or accelerating | The market re-rating the business |
| Main risk | Growth slows and the price falls hard | A "value trap" that stays cheap or gets worse |
| Does well | When rates are low and optimism is high | Often after a growth sell-off |

## How leadership rotates
Neither style wins forever. Growth has led for long stretches, then value has taken over, usually when interest rates, inflation or optimism change. Holding both is a form of diversification.

## Checks that apply to both
- **Quality**: strong margins, manageable debt, positive free cash flow.
- **A reason to own it**: for growth, how long can it keep growing? For value, what will make the market change its mind?
- **A margin of safety**: do not pay a price that needs everything to go right.

## Common mistakes
- Paying any price for a good story.
- Buying cheap stocks without checking why they are cheap.
- Switching style after every bad year, selling at the wrong moments.

## Practice
Use the **Stock screener** to list a few large, fast-growing companies and a few with low P/E. Open **Fundamentals** for one of each. Write what would have to be true for each to be a good investment in five years.
`,
    quiz: [
      { q: 'What is the main risk of growth investing?', a: 'That growth slows. A high price assumes continued growth, so a disappointment can cause a large fall.' },
      { q: 'What is a value trap?', a: 'A stock that looks cheap on a ratio but is cheap because the business is deteriorating, so it stays cheap or falls further.' },
      { q: 'Why might someone hold both styles?', a: 'Leadership rotates unpredictably. Holding both spreads the risk of being in the wrong style when it changes.' }
    ]
  }),
  doc({
    id: 'long-term-trend', title: 'Long-term trend: weekly charts and the 200-day average', category: 'Long-term investing', level: 'intermediate', minutes: 14,
    summary: 'Use the weekly chart and a long moving average to stay with big uptrends and reduce exposure when the trend breaks, and learn what that costs.',
    tags: ['trend', 'weekly', 'moving average', '200-day', 'investing'],
    chartSetup: { range: '5Y', interval: '1week', type: 'candles', studies: [{ study: 'sma', params: { length: 10 } }, { study: 'sma', params: { length: 40 } }] },
    body: `
## The idea
Long-term trends last for months or years. A simple way to describe them is with a **long moving average**: the 200-day average on a daily chart, or the **40-week** average on a weekly chart (about the same period). A rule that says "hold while price is above it" aims to **stay in big advances and step aside in big declines**.

## The setup
- **Chart**: weekly candles, 5 years.
- **Lines**: the 10-week and 40-week averages.
- **Uptrend**: price above a rising 40-week average. **Downtrend**: price below a falling one.

## A simple rule set (study only)
- **Hold or add** while the weekly close stays above the 40-week average and it is rising.
- **Reduce** after a **weekly close below it** with the average flattening or turning down.
- **Return** when price closes back above a rising average.
- Use **weekly closes**, not daily wiggles, to avoid reacting to noise.

## What it does well, and what it costs
**Helps**
- It keeps you in long advances.
- It has often reduced the damage of large, prolonged declines.

**Costs**
- **Whipsaws**: in sideways markets price crosses the line repeatedly, producing small losses and trades.
- **Lag**: it signals after the move has begun, so you give back part of the gain at both ends.
- It may **lag a simple buy-and-hold** in a steady uptrend because of those exits. Taxes and costs on every sale make that gap larger.

## Using it with other tools
- Combine it with valuation: a good company in an uptrend is better than a cheap one in a downtrend.
- Use it to **time adding money**, not to predict tops and bottoms.

## Common mistakes
- Using one rule on a thin, volatile stock where it whipsaws constantly.
- Changing the average length after seeing results (curve fitting).
- Expecting it to sell the top. It never does.

## Practice
On a 5-year weekly chart, mark each close below the 40-week line and what happened over the next few months. How many were true warnings, and how many whipsaws?
`,
    quiz: [
      { q: 'Why use weekly closes instead of daily prices for a long-term rule?', a: 'They filter out daily noise, so you react to real changes in the trend and trade much less often.' },
      { q: 'What is a whipsaw?', a: 'A signal that reverses soon after: price crosses the average, you act, then it crosses back, leaving a small loss. Common in sideways markets.' },
      { q: 'Why can a trend rule lag buy-and-hold in a steady uptrend?', a: 'Its signals come late and sometimes exit then re-enter higher, and trading creates costs and taxes.' }
    ]
  }),
  doc({
    id: 'drawdowns-bear-markets', title: 'Drawdowns, bear markets and staying invested', category: 'Long-term investing', level: 'beginner', minutes: 12,
    summary: 'The arithmetic of losses, how large and how long market declines have been, and how to prepare so you do not sell at the bottom.',
    tags: ['drawdown', 'bear market', 'risk', 'psychology', 'investing'],
    chartSetup: { range: '5Y', interval: '1week', type: 'candles', studies: [] },
    body: `
## The idea
A **drawdown** is the fall from a previous peak to a later low. Everyone who invests for long enough lives through several. How you handle them often matters more than which stock you pick.

## The arithmetic of recovery
Losses need larger gains to recover:
| Loss | Gain needed to get back |
|---|---|
| -10% | +11% |
| -25% | +33% |
| -50% | +100% |
| -75% | +300% |
This is why **avoiding very large losses** matters, and why concentrated, leveraged or speculative positions are dangerous.

## How big can it get?
Broad US stock indexes have repeatedly fallen by about a fifth or more: roughly **-34% in a month in early 2020**, about **-25% in 2022**, and over **-50% from 2007 to 2009**, which took years to recover. Individual stocks fall much further, and some never come back. Past declines do not set a limit on future ones.

## Bear markets and corrections
- A **correction** is usually a fall of 10% or more from a peak.
- A **bear market** is usually a fall of 20% or more.
- Their length varies: some end in weeks, others take years.

## Preparing before it happens
- **Know your number**: how much of a fall can you accept without changing course? Size your stock share accordingly.
- **Keep an emergency fund** so you never have to sell investments at a low to pay bills.
- **Diversify** and avoid leverage.
- **Write a plan** for what you will do in a fall, while calm.
- **Look at the long chart**, not the scary week.

## The costly mistake
Selling after a large fall turns a temporary loss into a permanent one, and many investors then miss the recovery, because the best days often occur close to the worst days. Trying to avoid the bad days usually means missing some of the good ones too.

## Common mistakes
- Checking the portfolio constantly during a decline.
- Buying more risk just after a long rise because it feels safe.
- Treating the plan as optional when headlines are bad.

## Practice
Open a 5-year weekly chart and mark the largest drawdown from peak to trough. Compute it as a percent, then work out the gain needed to recover. How would you have felt holding through it?
`,
    quiz: [
      { q: 'Why does a 50% loss need a 100% gain to recover?', a: 'The gain is measured on a smaller base. Falling from 100 to 50 and then needing to get back to 100 is a doubling.' },
      { q: 'What is the difference between a correction and a bear market?', a: 'A correction is typically a fall of 10% or more from a peak; a bear market is typically 20% or more.' },
      { q: 'What does an emergency fund have to do with investing?', a: 'It prevents forced selling of investments at a market low to cover living costs.' }
    ]
  }),
  doc({
    id: 'dividends-total-return', title: 'Dividends and total return', category: 'Long-term investing', level: 'intermediate', minutes: 12,
    summary: 'How dividends work, why total return is the number that matters, and how to spot a payout that cannot last.',
    tags: ['dividends', 'total return', 'income', 'investing', 'yield'],
    chartSetup: { range: '5Y', interval: '1week', type: 'candles', studies: [{ study: 'sma', params: { length: 40 } }] },
    body: `
## The idea
Some companies pay part of their profit to shareholders as a **dividend**. An investor's real result is **total return**: price change **plus** dividends received (and reinvested).

## Key terms
- **Dividend yield**: the yearly dividend divided by the share price. A rising yield can simply mean a falling price.
- **Payout ratio**: the share of earnings (or free cash flow) paid out. A very high ratio leaves little room for a bad year.
- **Ex-dividend date**: you must own the stock **before** this date to receive the next dividend. On that date the price usually drops by about the dividend amount.
- **Dividend growth**: raising the payout year after year signals confidence and is often more valuable than a high starting yield.

## Reasons to like dividends
- A steady income stream, and a sign of a mature, profitable business.
- **Reinvesting** dividends buys more shares and compounds the result over decades.
- Cash discipline: a company paying out cash has less to waste.

## Watch out for
- **The high-yield trap**: a very high yield can mean the market expects a cut. Check that earnings and cash flow cover the payout.
- **Cuts**: when a dividend is cut the price often falls sharply.
- **No free lunch**: a dividend is money leaving the company, so the price does not keep the amount, and the receiver may owe tax (rules differ by country).
- Companies that pay nothing are not worse: they may reinvest profit that grows the business.

## A quick health check
1. Is the payout covered by **free cash flow**?
2. Is debt manageable?
3. Has the dividend been maintained or raised through a recession?
4. Is the business growing, or only paying out shrinking profit?

## In this app
**Quote Details** shows the dividend yield, and **Fundamentals** shows free cash flow and the other figures you need to judge whether a payout is covered. **The paper account does not credit dividends**, so simulated results exclude them. Treat paper returns of dividend stocks as understating their total return.

## Common mistakes
- Choosing stocks by highest yield alone.
- Ignoring total return and looking only at income.
- Buying just before the ex-dividend date to "capture" it: the price drops by about that amount.

## Practice
Pick two dividend stocks. For each, find the yield, the payout ratio and whether the dividend has grown. Which dividend looks safer, and why?
`,
    quiz: [
      { q: 'Why can a very high dividend yield be a warning?', a: 'The price may have fallen because the market expects a dividend cut, or the payout may not be covered by earnings or cash flow.' },
      { q: 'What usually happens to the price on the ex-dividend date?', a: 'It drops by about the amount of the dividend, so buying just before it does not create a free profit.' },
      { q: 'Why does this app understate the return of dividend stocks?', a: 'The paper account does not credit dividends, so only price change appears in simulated results.' }
    ]
  }),
  doc({
    id: 'sector-cycles', title: 'Sectors, market cycles and relative strength', category: 'Long-term investing', level: 'intermediate', minutes: 14,
    summary: 'How sectors lead and lag through the economic cycle, and how to use the Market performance screen to see where money is flowing.',
    tags: ['sectors', 'market cycle', 'relative strength', 'rotation', 'investing'],
    chartSetup: { range: '1Y', interval: '1week', type: 'candles', studies: [{ study: 'sma', params: { length: 40 } }] },
    body: `
## The idea
The economy moves through phases (expansion, slowdown, contraction, recovery), and different **sectors** tend to lead in different phases. Money moves, or "rotates", between sectors as expectations change.

## A rough, simplified picture
- **Early recovery**: financials, consumer discretionary and industrials often lead as rates are low and growth returns.
- **Expansion**: technology and industrials do well on strong earnings.
- **Slowdown**: defensive sectors such as utilities, consumer staples and health care hold up better.
- **Contraction**: investors favour safety, and cyclical sectors fall the most.
This pattern is a **tendency, not a rule**. Each cycle differs, and markets look ahead, so sectors often move before the economy does.

## Relative strength
**Relative strength** compares a sector or stock with the market. If a sector keeps rising when the market is flat, or falls less when the market drops, it is showing strength. Strong areas tend to stay strong for a while, which is a form of momentum.

## Using the app
- **Market performance** shows how sectors and industries have done over different periods. Look for sectors that are strong over several periods, not only one.
- Open the strongest sector's names in the **Stock screener**.
- On a stock's chart, ask whether it is **above its 40-week average** and leading its sector.

## A practical approach
1. Check the **market's** trend first.
2. Find **leading sectors** and the leaders within them.
3. Apply your usual **entry, stop and size** rules.
4. Review regularly: leadership changes.

## Common mistakes
- Chasing last month's top sector at its peak.
- Treating the cycle chart as a timetable.
- Holding a strong stock in a sector that has turned weak, without a plan.

## Practice
Open **Market performance** and rank the sectors over one month and one year. Which are strong on both? Which are strong short term but weak long term, and what might that mean?
`,
    quiz: [
      { q: 'Which kinds of sectors tend to hold up better in a slowdown?', a: 'Defensive ones such as utilities, consumer staples and health care. People keep buying their products.' },
      { q: 'What is relative strength?', a: 'A comparison of a stock or sector with the market. Rising when the market is flat, or falling less when it drops, shows strength.' },
      { q: 'Why is a sector cycle chart a tendency rather than a timetable?', a: 'Each cycle differs and markets anticipate change, so sectors often move before the economy does.' }
    ]
  }),
  doc({
    id: 'swing-trading', title: 'Swing trading: holding days to weeks', category: 'Trend', level: 'intermediate', minutes: 14,
    summary: 'Trade daily-chart setups that play out over several days, and manage the new risks of holding overnight.',
    tags: ['swing trading', 'daily', 'trend', 'overnight risk', 'position size'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'ema', params: { length: 20 } }, { study: 'ema', params: { length: 50 } }, { study: 'atr', params: { length: 14 } }, { study: 'volume' }] },
    body: `
## The idea
A swing trade tries to capture one "swing" in price, a move that lasts a few days to a few weeks, using the **daily chart**. It needs far less screen time than day trading and fewer trades than active scalping, with moderate costs.

## Where setups come from
- **Pullbacks in an uptrend** to the 20 or 50 EMA (see the pullback lesson).
- **Breakouts** from a consolidation on rising volume.
- **Support bounces** at a level that has held before.
Choose stocks that are **liquid** and already trending, with the broad market on your side.

## Rules (long)
- **Entry**: when the setup confirms, for example a close back up from the average or a break above the prior day's high.
- **Stop**: under the pullback low or support, **a bit wider than on intraday charts**, so normal daily noise does not knock you out. Use ATR as a guide, for example 1.5 to 2 ATR from the entry.
- **Size**: from the stop distance with the **Position Calculator**, so a wider stop means fewer shares.
- **Target**: the next resistance or at least 2R. Trail under higher lows or an EMA.
- **Time stop**: if nothing has happened in 5 to 10 days, reconsider the idea.

## The risks that come with holding
- **Overnight gaps**: price can open beyond your stop, and your loss can exceed the planned risk. Real fills can be worse than your stop, so paper results can look better than real ones.
- **Earnings and news**: check the earnings date before entering. Many swing traders close before earnings.
- **Market-wide moves** can hit every position at once, so avoid too many similar trades.
- **Weekends and holidays** add event risk.

## Common mistakes
- Putting an intraday-sized stop on a daily-chart idea.
- Holding through earnings without meaning to.
- Taking too many positions in one sector and being exposed to one risk.
- Adding to a loser.

## Practice
Find a stock in an uptrend with an upcoming earnings date. Write two plans: one that exits before earnings and one that holds through. Which has the risk you would accept?
`,
    quiz: [
      { q: 'Why is a swing-trade stop usually wider than a day-trade stop?', a: 'Daily candles move more than 5-minute candles, so a tight stop would be hit by normal noise. The position size is reduced to keep risk the same.' },
      { q: 'What is overnight gap risk?', a: 'Price can open well beyond your stop after news or events while the market is closed, so the actual loss can exceed what you planned.' },
      { q: 'Why check the earnings date before a swing trade?', a: 'Earnings can move price sharply and gap through a stop. You should decide in advance whether to hold through them.' }
    ]
  }),
  doc({
    id: 'trade-management', title: 'Managing a trade: scaling, trailing and adding', category: 'Foundations', level: 'intermediate', minutes: 14,
    summary: 'What to do after you enter: moving stops, taking partial profits, trailing a winner, and why you should not average down.',
    tags: ['trade management', 'trailing stop', 'scaling', 'risk', 'R multiple'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'atr', params: { length: 14 } }, { study: 'ema', params: { length: 20 } }, { study: 'volume' }] },
    body: `
## The idea
Entries get the attention, but **results are decided after the entry**. Managing a trade means deciding in advance what you will do as the price moves for you or against you.

## Before you enter, write down
- The **stop**, the **target** and the **size**.
- What you will do at **1R** profit.
- What would make you exit early.

## Tools
**Moving the stop to breakeven**
After a gain of about 1R, some traders move the stop to the entry. It removes the risk of a loser, but it can also stop you out on a normal pullback just before the real move. Use it deliberately, not by reflex.

**Scaling out**
Sell part of the position at the first target (for example half at 1R or 2R) and let the rest run with a trailing stop. It lowers the average result of big winners but makes holding easier. There is no best split.

**Trailing a stop**
- **Under higher lows** (structure).
- **Under an EMA**, such as the 20 EMA.
- **ATR-based**: a stop a set number of ATRs below the highest high, for example 2 to 3 ATR, which widens in volatile times.

**Adding to a winner**
Adding when a trade is working and has made a new setup (a fresh pullback and a raised stop) can be sound, as long as total risk stays inside your limit. **Pyramid** with smaller additions.

## Never average down
Adding to a position **because it is losing** increases risk on a trade that is already wrong. A planned entry in several parts, defined in advance, is different from adding in hope.

## Exits: the three kinds
1. **The stop**: the plan is wrong.
2. **The target**: the plan worked.
3. **The time or event exit**: nothing is happening, or a risk (earnings) arrives.

## Common mistakes
- Moving a stop **further away** to avoid a loss.
- Cutting winners at 0.5R but letting losers run.
- Changing the plan in the middle of the trade because of a feeling.

## Practice
Take a past winner from your journal. Compare the actual result with what a 2-ATR trailing stop, or a half-at-2R exit, would have given.
`,
    quiz: [
      { q: 'Why is adding to a losing position different from a planned scale-in?', a: 'A scale-in is part of the original plan with a known total risk. Adding to a loser raises risk on a trade that has already proved wrong.' },
      { q: 'What is the trade-off of moving a stop to breakeven early?', a: 'It removes the chance of a loss, but a normal pullback can stop you out before the trade works.' },
      { q: 'Why is an ATR-based trailing stop useful?', a: 'It adapts to volatility, staying wider when the stock moves a lot, so noise is less likely to knock you out.' }
    ]
  })
]
