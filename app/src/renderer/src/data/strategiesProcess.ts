import type { StrategyDoc } from '../../../shared/strategies'
import { doc } from './strategyDoc'

// The habits around trading: a written plan, the mind, and reviewing results with numbers.
export const PROCESS: StrategyDoc[] = [
  doc({
    id: 'trading-plan', title: 'Writing your trading plan', category: 'Process & psychology', level: 'beginner', minutes: 12,
    summary: 'A one-page plan that says what you trade, when you enter and exit, how much you risk and when you stop, written before the market moves.',
    tags: ['plan', 'discipline', 'risk', 'process', 'basics'],
    chartSetup: null,
    body: `
## The idea
A trading plan is a set of rules you write **while calm** and follow **while excited or afraid**. Without one, every decision is made under pressure, which is when decisions are worst.

## What goes in it
1. **Goal and horizon**: what the account is for and how long you hold (see the investing-versus-trading lesson).
2. **Markets and instruments**: which stocks or ETFs you trade, and which you leave alone (for example thin or very low-priced ones).
3. **Setups**: the one to three patterns you trade, each with exact conditions. If you cannot write the entry rule in two sentences, you do not have one.
4. **Entry**: the trigger, and the checks before it (trend, volume, market direction).
5. **Stop**: where the idea is proven wrong, set **before** entry.
6. **Target and trade management**: the profit target, any scaling, how you will trail.
7. **Risk**: the maximum per trade (a small percent of the account), the maximum total exposure, and the maximum loss for a day or week.
8. **When you do not trade**: before big news, after hitting your loss limit, when you are tired or upset.
9. **Review**: when you will look at your journal, and what you will measure.

## A short template
\`\`\`
Setup: pullback to the 20 EMA in an uptrend (daily chart)
Entry: close back above the EMA, above-average volume
Stop: below the pullback low
Target: 2R, trail the rest under higher lows
Risk: 0.5% of account per trade, max 3 open trades, max 1.5% lost in a week
No trade: day of earnings, after 2 losses in a row
\`\`\`

## Making it work
- Keep it to **one page**. A plan you will not reread is useless.
- **Test it on paper** for a set number of trades before using real money.
- Change it only **after a review**, never in the middle of a trade or a bad day.
- Record in your journal whether each trade **followed the plan**.

## Common mistakes
- A plan with vague words such as "buy when it looks strong".
- Different rules for each trade.
- Dropping the plan after two losses, which is exactly when it is needed.

## Practice
Write your own plan with every heading above. Then use the Journal to record your next ten paper trades and mark each one followed plan or broke plan.
`,
    quiz: [
      { q: 'Why write the plan while the market is closed?', a: 'Decisions made under pressure are worse. A calm, written rule does not depend on how you feel when the price moves.' },
      { q: 'Why must the stop be decided before entry?', a: 'After entering you will be tempted to move it or hope. A pre-set stop defines the risk and the size of the position.' },
      { q: 'When is it right to change the plan?', a: 'After a review of enough trades shows a problem, not in the middle of a trade or after one bad day.' }
    ]
  }),
  doc({
    id: 'trading-psychology', title: 'Trading psychology: fear, greed and discipline', category: 'Process & psychology', level: 'beginner', minutes: 14,
    summary: 'The common emotional traps (FOMO, revenge trading, overconfidence, hope) and the practical habits that keep them from running your account.',
    tags: ['psychology', 'discipline', 'FOMO', 'revenge trading', 'process'],
    chartSetup: null,
    body: `
## The idea
Most trading errors are not analysis errors. People know the rule and break it. Knowing your own habits is part of the edge, and paper trading is a safe place to notice them, even though real money makes them stronger.

## The usual traps
| Trap | What it looks like | What helps |
|---|---|---|
| **FOMO** (fear of missing out) | Chasing a stock after it has already jumped | Wait for your setup. There is always another trade |
| **Revenge trading** | Bigger, faster trades right after a loss | A rule to stop after a set loss, and a break |
| **Overconfidence** | Raising size after a winning streak | Fixed risk per trade, whatever the recent results |
| **Hope** | Holding a loser past the stop, or moving the stop away | Stops entered when the trade is opened |
| **Loss aversion** | Selling winners too early, keeping losers too long | Pre-set targets and a trailing rule |
| **Confirmation bias** | Reading only news that supports your trade | Ask what would prove you wrong |
| **Boredom** | Taking low-quality trades because nothing is happening | A short list of setups and permission to do nothing |

## Why losing feels bad, and why it is normal
Even a good method loses often. A system that wins 40% of the time and makes twice what it risks can be very profitable, but it also loses six times out of ten. If you take every loss personally, you will abandon good rules.

## Practical habits
- **Fixed risk per trade**, so no single trade matters much.
- **Pre-trade checklist**: setup present? stop set? size calculated? market direction checked? If any answer is no, do not enter.
- **Limits**: a maximum daily loss and a stop after consecutive losses.
- **Journal the feeling** as well as the trade. Notes such as "anxious" or "rushed" show patterns later.
- **Breaks, sleep and exercise** affect decisions more than people expect.
- **Turn off the screen** when you are done. You do not need to watch every tick.

## Using the app
- The **Journal** has fields for your reasoning and review. Write the emotion next to the result.
- **Claude** can review your trades and ask questions about why you broke a rule. It does not replace your discipline, and it cannot place trades for you.

## Common mistakes
- Believing willpower alone is enough, with no rules to lean on.
- Judging a decision by the outcome of one trade.
- Trading to "feel something" or to recover from a bad day.

## Practice
In your next ten journal entries, add one word for how you felt at entry and at exit. After ten trades, which feeling goes with your worst results?
`,
    quiz: [
      { q: 'What is revenge trading and how do you guard against it?', a: 'Taking larger or hasty trades right after a loss to win it back. A stop-after-loss rule and a break before trading again prevent it.' },
      { q: 'Why can a method that loses six trades in ten still be profitable?', a: 'If the average winner is much larger than the average loser (for example twice as large), the winners outweigh the losers.' },
      { q: 'Why record how you felt in the journal?', a: 'Patterns appear over time, such as always breaking rules when rushed, and you can then design rules against that specific habit.' }
    ]
  }),
  doc({
    id: 'expectancy-review', title: 'Measuring your results: win rate, expectancy and review', category: 'Process & psychology', level: 'intermediate', minutes: 15,
    summary: 'Turn your journal into numbers: win rate, average win and loss, expectancy in R, and how many trades you need before the numbers mean something.',
    tags: ['expectancy', 'win rate', 'R multiple', 'journal', 'review', 'statistics'],
    chartSetup: null,
    body: `
## The idea
Feelings about your trading are unreliable. **Numbers from your journal** tell you whether the method works, which setups to keep, and what to fix.

## The core measures
- **Win rate**: the share of trades that make money.
- **Average win** and **average loss**, ideally in **R** (multiples of the amount you risked).
- **Expectancy**: the average result per trade.

**Expectancy (in R) = (win rate x average win in R) - (loss rate x average loss in R)**

Example: wins 40% of the time, the average win is 2R, the average loss is 1R.
Expectancy = 0.40 x 2 - 0.60 x 1 = **+0.2R per trade**. Risk $100 per trade, and over 100 trades the method would be expected to make about $2,000 before costs.

## Why win rate alone misleads
| Win rate | Average win : average loss | Expectancy |
|---|---|---|
| 70% | 0.3R : 1R | 0.7 x 0.3 - 0.3 x 1 = **-0.09R** |
| 40% | 2R : 1R | **+0.2R** |
A high win rate with small wins and big losses can still lose money.

## How many trades are enough
Small samples fool you. Ten trades tell you almost nothing, and thirty are still shaky. Aim for **50 to 100 trades of one setup** before judging it, and expect real trading to differ from paper results because of costs and emotions.

## A monthly review routine
1. **Group trades by setup** and compute win rate, average R and expectancy for each.
2. Find the **worst habits**: trades marked broke plan, trades after a loss, certain times of day.
3. Check the **largest losses**: were they planned stops, or ignored ones?
4. Look at **drawdown**: the largest fall of your account from a high.
5. **Decide one change** for next month. Changing everything makes it impossible to see what helped.

## In the app
- The **Journal** computes each closed trade's result in **R** from your actual fills, and its review section summarises the results.
- Ask **Claude** to summarise your journal by setup and to point out patterns. It reads the same data, but check its numbers against the Journal.

## Common mistakes
- Dropping a setup after five losses, or loving one after five wins.
- Ignoring costs, which do not appear in paper results.
- Not recording the trades you skipped or the ones that broke the plan.

## Practice
Take your last 20 journal entries. Compute the win rate, the average win and loss in R, and the expectancy. Is your result a method or just luck so far?
`,
    quiz: [
      { q: 'A setup wins 35% of the time with an average win of 3R and an average loss of 1R. What is the expectancy?', a: '0.35 x 3 - 0.65 x 1 = 1.05 - 0.65 = +0.4R per trade.' },
      { q: 'Why can a 70% win rate lose money?', a: 'If the average loss is much bigger than the average win, the few big losses outweigh the many small gains.' },
      { q: 'Why change only one thing after a review?', a: 'With several changes at once you cannot tell which one improved or hurt the results.' }
    ]
  })
]
