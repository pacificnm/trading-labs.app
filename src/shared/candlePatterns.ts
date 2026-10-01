// Candlestick pattern library: teaching text, a drawn example for each pattern, and exact detectors.
// Pure TypeScript (no Electron/React) so the Strategies screen and Claude's find_candle_pattern tool share it.

export interface Bar { time: number; open: number; high: number; low: number; close: number }
export type Bias = 'bullish' | 'bearish' | 'neutral'
export type Group = 'Single candle' | 'Two candles' | 'Three candles' | 'Four or five candles'
/** A rough, qualitative guide to how often a pattern shows up on ordinary daily charts. Measure it on a real chart for real numbers. */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare'
/** [open, high, low, close] on a 0-100 scale, used only to draw the example. */
export type Sketch = [number, number, number, number]

export interface CandlePattern {
  id: string
  name: string
  bias: Bias
  group: Group
  rarity: Rarity
  /** number of candles that make up the pattern; the last bars of `example` */
  size: number
  /** where it matters: the trend it should appear after */
  context: string
  summary: string
  /** the shape, as checkable rules */
  rules: string[]
  /** what the candle says about buyers and sellers */
  story: string
  confirm: string
  caution: string
  example: Sketch[]
}

// Context bars for the drawings: n steady candles ending at the given close.
const dn = (end: number, n = 3): Sketch[] => Array.from({ length: n }, (_, i) => { const k = n - 1 - i, c = end + k * 8; return [c + 8, c + 10, c - 2, c] as Sketch })
const up = (end: number, n = 3): Sketch[] => Array.from({ length: n }, (_, i) => { const k = n - 1 - i, c = end - k * 8; return [c - 8, c + 2, c - 10, c] as Sketch })

const RAW: Omit<CandlePattern, 'rarity'>[] = [
  {
    id: 'doji', name: 'Doji', bias: 'neutral', group: 'Single candle', size: 1, context: 'After a strong move or at a key level',
    summary: 'Open and close almost equal, with wicks on both sides: a tie between buyers and sellers.',
    rules: ['Body is tiny, 10% of the candle range or less.', 'Upper and lower wicks are both noticeable (each at least a quarter of the range).'],
    story: 'Price moved both ways during the period and ended where it started. Neither side won. After a long run, that pause can mean the move is tiring.',
    confirm: 'Wait for the next candle. A close beyond the doji in the opposite direction of the prior move is the signal; a close in the same direction means the trend simply paused.',
    caution: 'A doji in the middle of a sideways range means almost nothing.',
    example: [...up(60), [60, 68, 53, 60.5]]
  },
  {
    id: 'dragonfly-doji', name: 'Dragonfly doji', bias: 'bullish', group: 'Single candle', size: 1, context: 'After a decline, near support',
    summary: 'Open, high and close all at the top, with a long lower wick: sellers pushed down and lost.',
    rules: ['Body is tiny and sits at the top of the range.', 'Almost no upper wick.', 'Lower wick is at least 60% of the range.'],
    story: 'Sellers drove price far lower, then buyers took it all the way back to the open. The rejection of lower prices is the message.',
    confirm: 'A green candle that closes above the dragonfly\'s high.',
    caution: 'In an uptrend or with no support nearby it is just a long-legged bar.',
    example: [...dn(40), [40, 41, 22, 40.5]]
  },
  {
    id: 'gravestone-doji', name: 'Gravestone doji', bias: 'bearish', group: 'Single candle', size: 1, context: 'After a rise, near resistance',
    summary: 'Open, low and close all at the bottom, with a long upper wick: buyers pushed up and lost.',
    rules: ['Body is tiny and sits at the bottom of the range.', 'Almost no lower wick.', 'Upper wick is at least 60% of the range.'],
    story: 'Buyers drove price higher, then sellers pushed it all the way back to the open. Higher prices were rejected.',
    confirm: 'A red candle that closes below the gravestone\'s low.',
    caution: 'At the bottom of a decline it can be a harmless pause.',
    example: [...up(60), [60, 78, 59, 59.5]]
  },
  {
    id: 'spinning-top', name: 'Spinning top', bias: 'neutral', group: 'Single candle', size: 1, context: 'After a trend, as a warning of slowing momentum',
    summary: 'A small body with wicks both ways: a fight with no clear winner.',
    rules: ['Body is between 10% and 30% of the range.', 'Both wicks are at least as long as the body.'],
    story: 'More decisive than a doji but still indecisive. After a run of big candles, a spinning top shows momentum fading.',
    confirm: 'Look at what the next candle does relative to the spinning top\'s high and low.',
    caution: 'Common in quiet markets. Compare its size to recent candles before reading anything into it.',
    example: [...up(60), [58, 70, 48, 62]]
  },
  {
    id: 'hammer', name: 'Hammer', bias: 'bullish', group: 'Single candle', size: 1, context: 'After a decline',
    summary: 'A small body near the top and a long lower wick: buyers stepped in.',
    rules: ['Appears after a decline.', 'Lower wick is at least twice the body.', 'Little or no upper wick.'],
    story: 'Sellers pushed price down hard, but buyers absorbed it and pushed it back near the open. Sellers lost control, at least for one period.',
    confirm: 'A green candle that closes above the hammer\'s body. Volume above average on the hammer helps.',
    caution: 'It matters at support after a real decline. In the middle of a range it is noise.',
    example: [...dn(40), [37, 40, 20, 39]]
  },
  {
    id: 'hanging-man', name: 'Hanging man', bias: 'bearish', group: 'Single candle', size: 1, context: 'After a rise',
    summary: 'The hammer shape at the top of an advance: a first crack in the buyers\' control.',
    rules: ['Appears after a rise.', 'Lower wick is at least twice the body.', 'Little or no upper wick.'],
    story: 'Sellers pushed price sharply lower during the period before buyers recovered. The recovery looks strong, but the fact sellers could do that at the highs is a warning.',
    confirm: 'A red candle that closes below the hanging man\'s body. Without it, treat the pattern as unconfirmed.',
    caution: 'The weakest of the reversal candles on its own. Needs confirmation more than any other.',
    example: [...up(60), [59, 62, 42, 61]]
  },
  {
    id: 'inverted-hammer', name: 'Inverted hammer', bias: 'bullish', group: 'Single candle', size: 1, context: 'After a decline',
    summary: 'A small body near the bottom and a long upper wick: buyers tried and sellers only just held.',
    rules: ['Appears after a decline.', 'Upper wick is at least twice the body.', 'Little or no lower wick.'],
    story: 'Buyers pushed price well above the open. They did not hold it, but the attempt shows the selling is weakening.',
    confirm: 'A green candle that opens and closes above the inverted hammer\'s body.',
    caution: 'Looks identical to a shooting star. The prior trend is the only difference.',
    example: [...dn(40), [39, 58, 38, 41]]
  },
  {
    id: 'shooting-star', name: 'Shooting star', bias: 'bearish', group: 'Single candle', size: 1, context: 'After a rise, near resistance',
    summary: 'A small body near the bottom and a long upper wick: buyers were rejected.',
    rules: ['Appears after a rise.', 'Upper wick is at least twice the body.', 'Little or no lower wick.'],
    story: 'Buyers pushed price much higher, then sellers shoved it back near the open. The higher prices were rejected.',
    confirm: 'A red candle that closes below the shooting star\'s body.',
    caution: 'More meaningful at a known resistance level and on heavy volume.',
    example: [...up(60), [63, 80, 60, 61]]
  },
  {
    id: 'bullish-marubozu', name: 'Bullish marubozu', bias: 'bullish', group: 'Single candle', size: 1, context: 'Any, strongest when breaking a level',
    summary: 'A long green body with almost no wicks: buyers controlled the whole period.',
    rules: ['Body is at least 90% of the range.', 'Green (close above open).', 'Larger than recent candles.'],
    story: 'Price opened at the low and closed at the high. Buyers were in charge from the first trade to the last.',
    confirm: 'Follow-through the next period. Buyers who are still in control keep price above the marubozu\'s midpoint.',
    caution: 'After a long run it can be an exhaustion move. Check where it sits.',
    example: [[48, 52, 46, 50], [50, 53, 47, 49], [30, 70, 30, 70]]
  },
  {
    id: 'bearish-marubozu', name: 'Bearish marubozu', bias: 'bearish', group: 'Single candle', size: 1, context: 'Any, strongest when breaking a level',
    summary: 'A long red body with almost no wicks: sellers controlled the whole period.',
    rules: ['Body is at least 90% of the range.', 'Red (close below open).', 'Larger than recent candles.'],
    story: 'Price opened at the high and closed at the low. Sellers were in charge from the first trade to the last.',
    confirm: 'Follow-through the next period, with price staying below the marubozu\'s midpoint.',
    caution: 'After a long fall it can mark a capitulation low instead of the start of more selling.',
    example: [[52, 54, 48, 50], [50, 53, 47, 51], [70, 70, 30, 30]]
  },
  {
    id: 'bullish-engulfing', name: 'Bullish engulfing', bias: 'bullish', group: 'Two candles', size: 2, context: 'After a decline',
    summary: 'A green candle whose body completely covers the previous red body.',
    rules: ['Appears after a decline.', 'First candle is red, second is green.', 'Second body opens at or below the first close and closes at or above the first open.'],
    story: 'Sellers had the last candle, then buyers opened lower and drove price past where the sellers started. Control changed hands in one period.',
    confirm: 'Price holding above the engulfing candle\'s low. A stop just below that low defines the risk.',
    caution: 'Stronger at support and when volume on the green candle is clearly above average.',
    example: [...dn(40), [38, 56, 36, 54]]
  },
  {
    id: 'bearish-engulfing', name: 'Bearish engulfing', bias: 'bearish', group: 'Two candles', size: 2, context: 'After a rise',
    summary: 'A red candle whose body completely covers the previous green body.',
    rules: ['Appears after a rise.', 'First candle is green, second is red.', 'Second body opens at or above the first close and closes at or below the first open.'],
    story: 'Buyers had the last candle, then sellers opened higher and drove price below where the buyers started.',
    confirm: 'Price staying below the engulfing candle\'s high. A stop just above that high defines the risk.',
    caution: 'Stronger at resistance. In a strong uptrend, many of these are only pullbacks.',
    example: [...up(60), [62, 64, 44, 46]]
  },
  {
    id: 'bullish-harami', name: 'Bullish harami', bias: 'bullish', group: 'Two candles', size: 2, context: 'After a decline',
    summary: 'A small green body held inside the previous large red body.',
    rules: ['Appears after a decline.', 'First candle is a large red candle.', 'Second is green with a body no more than half the first and entirely inside it.'],
    story: 'Selling momentum stalls: after a big down candle, the next one cannot get anywhere. It is a pause, not yet a turn.',
    confirm: 'A close above the first candle\'s open turns the pause into a real signal.',
    caution: 'One of the weaker patterns. Do not act on the harami alone.',
    example: [...dn(40), [43, 47, 41, 45]]
  },
  {
    id: 'bearish-harami', name: 'Bearish harami', bias: 'bearish', group: 'Two candles', size: 2, context: 'After a rise',
    summary: 'A small red body held inside the previous large green body.',
    rules: ['Appears after a rise.', 'First candle is a large green candle.', 'Second is red with a body no more than half the first and entirely inside it.'],
    story: 'Buying momentum stalls: after a big up candle the next cannot extend it.',
    confirm: 'A close below the first candle\'s open.',
    caution: 'Weak on its own. Treat it as a reason to look closer, not a signal.',
    example: [...up(60), [58, 59, 53, 54]]
  },
  {
    id: 'piercing-line', name: 'Piercing line', bias: 'bullish', group: 'Two candles', size: 2, context: 'After a decline',
    summary: 'A red candle, then a green one that opens lower and closes above the red body\'s midpoint.',
    rules: ['Appears after a decline.', 'Second candle opens below the first candle\'s low.', 'It closes above the middle of the first body but below its open.'],
    story: 'Price gaps down and sellers look in control, then buyers recover more than half of the prior drop in one period.',
    confirm: 'Next candle closing higher. A stop below the second candle\'s low.',
    caution: 'Less decisive than a bullish engulfing because it does not take back the whole body.',
    example: [...dn(40), [36, 46, 34, 45]]
  },
  {
    id: 'dark-cloud-cover', name: 'Dark cloud cover', bias: 'bearish', group: 'Two candles', size: 2, context: 'After a rise',
    summary: 'A green candle, then a red one that opens higher and closes below the green body\'s midpoint.',
    rules: ['Appears after a rise.', 'Second candle opens above the first candle\'s high.', 'It closes below the middle of the first body but above its open.'],
    story: 'Price gaps up and buyers look in control, then sellers erase more than half of the prior gain.',
    confirm: 'Next candle closing lower. A stop above the second candle\'s high.',
    caution: 'Gaps are common in stocks and the signal depends on one. In a strong uptrend it often fails.',
    example: [...up(60), [64, 66, 54, 55]]
  },
  {
    id: 'tweezer-bottom', name: 'Tweezer bottom', bias: 'bullish', group: 'Two candles', size: 2, context: 'After a decline, at support',
    summary: 'Two candles with matching lows, red then green: the same floor held twice.',
    rules: ['Appears after a decline.', 'First candle red, second green.', 'Both lows are within a hair of each other.'],
    story: 'Price tested the same low twice in a row and was bought both times. A level that holds twice is a level worth noticing.',
    confirm: 'A close above the pair\'s highs. The matching low is the natural stop.',
    caution: 'Judge "matching" against the recent average range, not by eye.',
    example: [...dn(40), [41, 46, 38, 45]]
  },
  {
    id: 'tweezer-top', name: 'Tweezer top', bias: 'bearish', group: 'Two candles', size: 2, context: 'After a rise, at resistance',
    summary: 'Two candles with matching highs, green then red: the same ceiling held twice.',
    rules: ['Appears after a rise.', 'First candle green, second red.', 'Both highs are within a hair of each other.'],
    story: 'Price tested the same high twice and was sold both times.',
    confirm: 'A close below the pair\'s lows. The matching high is the natural stop.',
    caution: 'A single re-test of a high is a thin signal; it is stronger at a level you already marked.',
    example: [...up(60), [59, 62, 54, 55]]
  },
  {
    id: 'inside-bar', name: 'Inside bar', bias: 'neutral', group: 'Two candles', size: 2, context: 'After a trend or in a squeeze before a breakout',
    summary: 'A candle whose whole range sits inside the previous one: compression.',
    rules: ['High is below the previous high.', 'Low is above the previous low.', 'The previous ("mother") candle is larger than normal.'],
    story: 'Volatility contracts. Neither side could even push beyond the prior range. Contraction is often followed by expansion.',
    confirm: 'A close beyond the mother bar\'s high (long) or low (short) decides the direction. The inside bar gives no direction itself.',
    caution: 'Breakouts in both directions fail. Place the stop on the other side of the mother bar and size accordingly.',
    example: [...up(40, 2), [40, 66, 38, 62], [52, 58, 48, 55]]
  },
  {
    id: 'morning-star', name: 'Morning star', bias: 'bullish', group: 'Three candles', size: 3, context: 'After a decline',
    summary: 'Big red candle, a small candle that gaps lower, then a big green candle: selling gives way to buying.',
    rules: ['Appears after a decline.', 'First: a large red candle.', 'Second: a small body that sits below the first body.', 'Third: a green candle that closes above the middle of the first body.'],
    story: 'Sellers push down, then stall (the small candle), then buyers take over decisively. A full change of mood in three steps.',
    confirm: 'The third candle is the confirmation. Stop below the star\'s low.',
    caution: 'Rare, which is part of why it is respected. Check volume on the third candle.',
    example: [...dn(46), [40, 42, 36, 38], [41, 56, 39, 54]]
  },
  {
    id: 'evening-star', name: 'Evening star', bias: 'bearish', group: 'Three candles', size: 3, context: 'After a rise',
    summary: 'Big green candle, a small candle that gaps higher, then a big red candle: buying gives way to selling.',
    rules: ['Appears after a rise.', 'First: a large green candle.', 'Second: a small body that sits above the first body.', 'Third: a red candle that closes below the middle of the first body.'],
    story: 'Buyers push up, then stall, then sellers take over decisively.',
    confirm: 'The third candle is the confirmation. Stop above the star\'s high.',
    caution: 'Rare. In strong uptrends a single evening star often ends up as just a pullback.',
    example: [...up(54), [58, 64, 56, 60], [58, 60, 44, 46]]
  },
  {
    id: 'three-white-soldiers', name: 'Three white soldiers', bias: 'bullish', group: 'Three candles', size: 3, context: 'After a decline or a quiet base',
    summary: 'Three green candles in a row, each opening inside the last body and closing higher.',
    rules: ['Three green candles with decent-sized bodies.', 'Each opens within the previous body and closes above the previous close.', 'Small upper wicks: each closes near its high.'],
    story: 'Steady, persistent buying with no meaningful pushback: a new uptrend announcing itself.',
    confirm: 'The pattern is the confirmation, but the move may already be extended, so entries are better on a small pullback.',
    caution: 'After a long rise, it can mark exhaustion: three big up days can be the last.',
    example: [...dn(40, 2), [40, 52, 38, 50], [48, 60, 46, 58], [56, 68, 54, 66]]
  },
  {
    id: 'three-black-crows', name: 'Three black crows', bias: 'bearish', group: 'Three candles', size: 3, context: 'After a rise or at a top',
    summary: 'Three red candles in a row, each opening inside the last body and closing lower.',
    rules: ['Three red candles with decent-sized bodies.', 'Each opens within the previous body and closes below the previous close.', 'Small lower wicks: each closes near its low.'],
    story: 'Steady, persistent selling with no meaningful bounce: control has changed hands.',
    confirm: 'The pattern is the confirmation, but price may already be well off its high.',
    caution: 'After a long fall it can mark capitulation. Check where it sits relative to support.',
    example: [...up(60, 2), [60, 62, 48, 50], [52, 54, 40, 42], [44, 46, 32, 34]]
  },
  {
    id: 'long-legged-doji', name: 'Long-legged doji', bias: 'neutral', group: 'Single candle', size: 1, context: 'After a strong move, or before news',
    summary: 'A doji with very long wicks both ways: a big fight that ended exactly where it began.',
    rules: ['Body is tiny, 10% of the range or less.', 'Both wicks are long, each at least 40% of the range.', 'The candle is much bigger than recent candles.'],
    story: 'Price swung far in both directions and nothing was settled. That much volatility with no result often shows up when the market is waiting on something: earnings, a report or a decision.',
    confirm: 'The next candle breaking out of the long-legged doji\'s range shows who won.',
    caution: 'It says "uncertainty", not a direction. Do not guess which way it will break.',
    example: [...up(60), [60, 80, 40, 61]]
  },
  {
    id: 'bullish-belt-hold', name: 'Bullish belt hold', bias: 'bullish', group: 'Single candle', size: 1, context: 'After a decline',
    summary: 'A long green candle that opens right at its low: buyers took over from the first trade.',
    rules: ['Appears after a decline.', 'Opens at (or within a hair of) the low: no lower wick.', 'Body is at least 60% of the range, but with a small upper wick (not a marubozu).'],
    story: 'After a decline, price opened lower still, then buyers drove it up all period without ever letting it back to the open.',
    confirm: 'A close above the belt hold\'s high. The candle\'s low is the natural stop.',
    caution: 'A one-candle signal and a weak one. It needs support nearby to carry weight.',
    example: [...dn(40), [34, 52, 34, 50]]
  },
  {
    id: 'bearish-belt-hold', name: 'Bearish belt hold', bias: 'bearish', group: 'Single candle', size: 1, context: 'After a rise',
    summary: 'A long red candle that opens right at its high: sellers took over from the first trade.',
    rules: ['Appears after a rise.', 'Opens at (or within a hair of) the high: no upper wick.', 'Body is at least 60% of the range, but with a small lower wick (not a marubozu).'],
    story: 'After a rise, price opened higher still, then sellers pushed it down all period without ever letting it back to the open.',
    confirm: 'A close below the belt hold\'s low. The candle\'s high is the natural stop.',
    caution: 'A one-candle signal and a weak one. It needs resistance nearby to carry weight.',
    example: [...up(60), [66, 66, 48, 50]]
  },
  {
    id: 'rising-window', name: 'Rising window (gap up)', bias: 'bullish', group: 'Two candles', size: 2, context: 'During an uptrend',
    summary: 'A candle whose low is above the previous candle\'s high: price gapped up and left empty space behind.',
    rules: ['Appears in an uptrend.', 'Today\'s low is above yesterday\'s high, by a meaningful amount.'],
    story: 'Buyers were so eager that no trades happened in the gap. The gap often acts as support, and a continuation signal while price stays above it.',
    confirm: 'Price holding above the gap. A close back inside it weakens the signal, and below it fails it.',
    caution: 'Many gaps get filled within days. Gaps after earnings or news behave differently from gaps on nothing.',
    example: [...up(60), [68, 72, 66, 71]]
  },
  {
    id: 'falling-window', name: 'Falling window (gap down)', bias: 'bearish', group: 'Two candles', size: 2, context: 'During a downtrend',
    summary: 'A candle whose high is below the previous candle\'s low: price gapped down and left empty space above.',
    rules: ['Appears in a downtrend.', 'Today\'s high is below yesterday\'s low, by a meaningful amount.'],
    story: 'Sellers were so eager that no trades happened in the gap. The gap often acts as resistance, and a continuation signal while price stays below it.',
    confirm: 'Price staying below the gap. A close back inside it weakens the signal, and above it fails it.',
    caution: 'Many gaps get filled within days. Gaps on news behave differently from gaps on nothing.',
    example: [...dn(40), [32, 34, 28, 29]]
  },
  {
    id: 'matching-low', name: 'Matching low', bias: 'bullish', group: 'Two candles', size: 2, context: 'After a decline, at support',
    summary: 'Two red candles that close at the same price: sellers could not push below it twice.',
    rules: ['Appears after a decline.', 'Both candles are red.', 'Both closes are within a hair of each other.'],
    story: 'A second attempt to move lower ended exactly where the first did. A closing price that holds twice suggests buyers are defending it.',
    confirm: 'A green candle that closes above the two candles\' opens.',
    caution: 'Weak and rare. The shared close is a level, not a signal.',
    example: [...dn(40), [46, 47, 39, 40]]
  },
  {
    id: 'bullish-kicker', name: 'Bullish kicker', bias: 'bullish', group: 'Two candles', size: 2, context: 'After a decline, usually on news',
    summary: 'A red candle, then a green one that gaps up above where the red candle opened: sentiment flipped overnight.',
    rules: ['Appears after a decline.', 'First candle is red with a solid body.', 'Second candle is green, opens above the first candle\'s open and never trades back into it (no overlap).'],
    story: 'Overnight news or events reversed the mood so completely that the market opened above the prior candle\'s entire range. One of the strongest reversal signals, and one of the rarest.',
    confirm: 'The gap holding as support. A close back inside the gap means the news was not enough.',
    caution: 'Needs a real catalyst. Check the news before trusting it.',
    example: [...dn(46, 2), [52, 53, 44, 45], [56, 66, 55, 65]]
  },
  {
    id: 'bearish-kicker', name: 'Bearish kicker', bias: 'bearish', group: 'Two candles', size: 2, context: 'After a rise, usually on news',
    summary: 'A green candle, then a red one that gaps down below where the green candle opened: sentiment flipped overnight.',
    rules: ['Appears after a rise.', 'First candle is green with a solid body.', 'Second candle is red, opens below the first candle\'s open and never trades back into it (no overlap).'],
    story: 'Overnight news reversed the mood so completely that the market opened below the prior candle\'s entire range.',
    confirm: 'The gap holding as resistance.',
    caution: 'Needs a real catalyst. Check the news before trusting it.',
    example: [...up(54, 2), [48, 56, 47, 55], [44, 45, 34, 35]]
  },
  {
    id: 'three-inside-up', name: 'Three inside up', bias: 'bullish', group: 'Three candles', size: 3, context: 'After a decline',
    summary: 'A bullish harami followed by a green candle that closes above the first candle\'s open: the harami confirmed.',
    rules: ['Appears after a decline.', 'First two candles form a bullish harami.', 'Third candle is green and closes above the first candle\'s open.'],
    story: 'The harami showed selling stalling. The third candle is the proof: buyers recovered the whole first drop.',
    confirm: 'The third candle is the confirmation. Stop below the harami\'s low.',
    caution: 'Entering after the third candle means a wider stop than entering on the harami. Size accordingly.',
    example: [...dn(40), [43, 47, 41, 45], [45, 56, 44, 54]]
  },
  {
    id: 'three-inside-down', name: 'Three inside down', bias: 'bearish', group: 'Three candles', size: 3, context: 'After a rise',
    summary: 'A bearish harami followed by a red candle that closes below the first candle\'s open: the harami confirmed.',
    rules: ['Appears after a rise.', 'First two candles form a bearish harami.', 'Third candle is red and closes below the first candle\'s open.'],
    story: 'The harami showed buying stalling. The third candle is the proof: sellers erased the whole first advance.',
    confirm: 'The third candle is the confirmation. Stop above the harami\'s high.',
    caution: 'Entering after the third candle means a wider stop than entering on the harami.',
    example: [...up(60), [58, 59, 53, 54], [54, 55, 44, 46]]
  },
  {
    id: 'three-outside-up', name: 'Three outside up', bias: 'bullish', group: 'Three candles', size: 3, context: 'After a decline',
    summary: 'A bullish engulfing followed by another green candle that closes higher: the engulfing confirmed.',
    rules: ['Appears after a decline.', 'First two candles form a bullish engulfing.', 'Third candle is green and closes above the engulfing candle\'s close.'],
    story: 'The engulfing candle showed control changing hands. The third candle extends it: buyers are following through.',
    confirm: 'The third candle is the confirmation. Stop below the engulfing candle\'s low.',
    caution: 'More reliable than a lone engulfing, but the move may already be under way when it completes.',
    example: [...dn(40), [38, 56, 36, 54], [54, 62, 52, 60]]
  },
  {
    id: 'three-outside-down', name: 'Three outside down', bias: 'bearish', group: 'Three candles', size: 3, context: 'After a rise',
    summary: 'A bearish engulfing followed by another red candle that closes lower: the engulfing confirmed.',
    rules: ['Appears after a rise.', 'First two candles form a bearish engulfing.', 'Third candle is red and closes below the engulfing candle\'s close.'],
    story: 'The engulfing candle showed control changing hands. The third candle extends it: sellers are following through.',
    confirm: 'The third candle is the confirmation. Stop above the engulfing candle\'s high.',
    caution: 'More reliable than a lone engulfing, but the move may already be under way when it completes.',
    example: [...up(60), [62, 64, 44, 46], [46, 48, 38, 40]]
  },
  {
    id: 'bullish-abandoned-baby', name: 'Bullish abandoned baby', bias: 'bullish', group: 'Three candles', size: 3, context: 'After a decline',
    summary: 'A morning star where the middle doji is completely cut off from both neighbours by gaps.',
    rules: ['Appears after a decline.', 'First: a solid red candle.', 'Second: a doji that gaps below the first candle\'s low.', 'Third: a green candle that gaps above the doji\'s high.'],
    story: 'Price gaps down into a doji, then gaps back up, leaving the doji isolated on the chart. A sharp and total change of sentiment.',
    confirm: 'The gap up holding. Stop below the doji\'s low.',
    caution: 'Very rare on liquid stocks, because both gaps must be clean. Treat any you find with respect, but check for news.',
    example: [...dn(46), [38, 40, 36, 38.2], [43, 56, 42, 54]]
  },
  {
    id: 'bearish-abandoned-baby', name: 'Bearish abandoned baby', bias: 'bearish', group: 'Three candles', size: 3, context: 'After a rise',
    summary: 'An evening star where the middle doji is completely cut off from both neighbours by gaps.',
    rules: ['Appears after a rise.', 'First: a solid green candle.', 'Second: a doji that gaps above the first candle\'s high.', 'Third: a red candle that gaps below the doji\'s low.'],
    story: 'Price gaps up into a doji, then gaps back down, leaving the doji isolated on the chart. A sharp and total change of sentiment.',
    confirm: 'The gap down holding. Stop above the doji\'s high.',
    caution: 'Very rare on liquid stocks. Check for news.',
    example: [...up(54), [62, 64, 60, 62.2], [58, 59, 44, 46]]
  },
  {
    id: 'rising-three-methods', name: 'Rising three methods', bias: 'bullish', group: 'Four or five candles', size: 5, context: 'During an uptrend',
    summary: 'A big green candle, three small candles that stay inside its range, then another big green candle: a rest, not a reversal.',
    rules: ['Appears in an uptrend.', 'First: a long green candle.', 'Next three: small candles that stay within the first candle\'s high and low.', 'Fifth: a long green candle that closes above the first close.'],
    story: 'Sellers tried to turn the trend over three candles and could not even break the first candle\'s range. When buyers returned, the uptrend continued.',
    confirm: 'The fifth candle is the confirmation. The low of the pullback is the natural stop.',
    caution: 'A continuation pattern that takes patience: most pullbacks do not look this tidy.',
    example: [...up(40), [40, 60, 38, 58], [56, 58, 50, 52], [52, 54, 46, 48], [49, 53, 45, 52], [52, 70, 50, 68]]
  },
  {
    id: 'falling-three-methods', name: 'Falling three methods', bias: 'bearish', group: 'Four or five candles', size: 5, context: 'During a downtrend',
    summary: 'A big red candle, three small candles that stay inside its range, then another big red candle: a bounce, not a reversal.',
    rules: ['Appears in a downtrend.', 'First: a long red candle.', 'Next three: small candles that stay within the first candle\'s high and low.', 'Fifth: a long red candle that closes below the first close.'],
    story: 'Buyers tried to turn the trend over three candles and could not even break the first candle\'s range. When sellers returned, the downtrend continued.',
    confirm: 'The fifth candle is the confirmation. The high of the bounce is the natural stop.',
    caution: 'A continuation pattern that takes patience: most bounces do not look this tidy.',
    example: [...dn(60), [60, 62, 40, 42], [44, 50, 42, 48], [48, 52, 46, 50], [50, 56, 48, 52], [50, 52, 32, 34]]
  },
  {
    id: 'bullish-three-line-strike', name: 'Bullish three line strike', bias: 'bullish', group: 'Four or five candles', size: 4, context: 'After a decline',
    summary: 'Three falling red candles, then one big green candle that erases all three.',
    rules: ['Appears after a decline.', 'Three red candles, each closing lower than the last.', 'Fourth: green, opens below the third close and closes above the first candle\'s open.'],
    story: 'Three candles of steady selling, then buyers wiped them all out in a single period. A hard rejection of the lows.',
    confirm: 'Price holding above the strike candle\'s low.',
    caution: 'Rare, and traditionally considered a continuation pattern in some books. Check the trend and the level before taking it as a reversal.',
    example: [...dn(56, 2), [56, 58, 48, 50], [50, 52, 42, 44], [44, 46, 36, 38], [36, 60, 34, 58]]
  },
  {
    id: 'bearish-three-line-strike', name: 'Bearish three line strike', bias: 'bearish', group: 'Four or five candles', size: 4, context: 'After a rise',
    summary: 'Three rising green candles, then one big red candle that erases all three.',
    rules: ['Appears after a rise.', 'Three green candles, each closing higher than the last.', 'Fourth: red, opens above the third close and closes below the first candle\'s open.'],
    story: 'Three candles of steady buying, then sellers wiped them all out in a single period. A hard rejection of the highs.',
    confirm: 'Price staying below the strike candle\'s high.',
    caution: 'Rare, and traditionally considered a continuation pattern in some books. Check the trend and the level before taking it as a reversal.',
    example: [...up(44, 2), [44, 52, 42, 50], [50, 58, 48, 56], [56, 64, 54, 62], [64, 66, 40, 42]]
  }
]

// Most tiers come from running the detectors over simulated daily price paths (about 1,260 bars = 5 years): common = 30+ matches, uncommon = 8-30,
// rare = 1.5-8, very rare = fewer. Simulated prices have no real overnight gaps or unusually large days, so the gap patterns and the long-legged doji keep a
// reasoned tier instead. It is a rough guide; the Measure button on the Strategies screen counts real bars.
const RARITY: Record<string, Rarity> = {
  'doji': 'common', 'dragonfly-doji': 'uncommon', 'gravestone-doji': 'uncommon',
  'spinning-top': 'common', 'hammer': 'uncommon', 'hanging-man': 'uncommon',
  'inverted-hammer': 'uncommon', 'shooting-star': 'uncommon', 'bullish-marubozu': 'common',
  'bearish-marubozu': 'common', 'bullish-engulfing': 'uncommon', 'bearish-engulfing': 'uncommon',
  'bullish-harami': 'rare', 'bearish-harami': 'rare', 'piercing-line': 'rare',
  'dark-cloud-cover': 'rare', 'tweezer-bottom': 'uncommon', 'tweezer-top': 'uncommon',
  'inside-bar': 'common', 'morning-star': 'rare', 'evening-star': 'rare',
  'three-white-soldiers': 'rare', 'three-black-crows': 'very rare', 'long-legged-doji': 'rare',
  'bullish-belt-hold': 'uncommon', 'bearish-belt-hold': 'uncommon', 'rising-window': 'uncommon',
  'falling-window': 'uncommon', 'matching-low': 'very rare', 'bullish-kicker': 'very rare',
  'bearish-kicker': 'very rare', 'three-inside-up': 'rare', 'three-inside-down': 'rare',
  'three-outside-up': 'rare', 'three-outside-down': 'rare', 'bullish-abandoned-baby': 'very rare',
  'bearish-abandoned-baby': 'very rare', 'rising-three-methods': 'very rare', 'falling-three-methods': 'very rare',
  'bullish-three-line-strike': 'very rare', 'bearish-three-line-strike': 'very rare'
}

export const CANDLE_PATTERNS: CandlePattern[] = RAW.map((p) => ({ ...p, rarity: RARITY[p.id] ?? 'uncommon' }))

export const RARITY_NOTE: Record<Rarity, string> = {
  'common': 'Shows up often on most charts.',
  'uncommon': 'Turns up from time to time.',
  'rare': 'Only occasionally; a stock can go a year or more without one.',
  'very rare': 'Almost never; a stock can go years without one, and the rules are strict.'
}


export const PATTERN_IDS = CANDLE_PATTERNS.map((p) => p.id)
export const patternById = (id: string) => CANDLE_PATTERNS.find((p) => p.id === id)

// ---- detectors ------------------------------------------------------------------------------

type Trend = 'up' | 'down' | 'flat' | null
const range = (b: Bar) => b.high - b.low
const body = (b: Bar) => Math.abs(b.close - b.open)
const top = (b: Bar) => Math.max(b.open, b.close)
const bot = (b: Bar) => Math.min(b.open, b.close)
const green = (b: Bar) => b.close > b.open
const red = (b: Bar) => b.close < b.open

/** Average range of the (up to 10) bars before index s. */
function avgRange(c: Bar[], s: number): number | null {
  if (s < 5) return null
  let sum = 0, n = 0
  for (let k = Math.max(0, s - 10); k < s; k++) { sum += range(c[k]); n++ }
  return n && sum > 0 ? sum / n : null
}

/** Direction of the four bars ending just before index s: a move bigger than one average bar counts as a trend. */
function trendBefore(c: Bar[], s: number): Trend {
  const avg = avgRange(c, s)
  if (avg == null) return null
  const ch = c[s - 1].close - c[s - 5].close
  return ch > avg ? 'up' : ch < -avg ? 'down' : 'flat'
}

type Detector = (c: Bar[], i: number, avg: number) => boolean

const shape = (b: Bar) => { const r = range(b); return { r, body: body(b), up: b.high - top(b), lo: bot(b) - b.low } }

const DETECT: Record<string, Detector> = {
  'doji': (c, i, avg) => { const s = shape(c[i]); return s.r >= avg * 0.5 && s.body <= 0.1 * s.r && s.up >= 0.25 * s.r && s.lo >= 0.25 * s.r && !(s.up >= 0.4 * s.r && s.lo >= 0.4 * s.r && s.r >= 1.5 * avg) },
  'long-legged-doji': (c, i, avg) => { const s = shape(c[i]); return s.r >= avg * 1.5 && s.body <= 0.1 * s.r && s.up >= 0.4 * s.r && s.lo >= 0.4 * s.r },
  'dragonfly-doji': (c, i, avg) => { const s = shape(c[i]); return s.r >= avg * 0.5 && s.body <= 0.1 * s.r && s.up <= 0.1 * s.r && s.lo >= 0.6 * s.r },
  'gravestone-doji': (c, i, avg) => { const s = shape(c[i]); return s.r >= avg * 0.5 && s.body <= 0.1 * s.r && s.lo <= 0.1 * s.r && s.up >= 0.6 * s.r },
  'spinning-top': (c, i, avg) => { const s = shape(c[i]); return s.r >= avg * 0.5 && s.body > 0.1 * s.r && s.body <= 0.3 * s.r && s.up >= s.body && s.lo >= s.body },
  'hammer': (c, i, avg) => { const s = shape(c[i]); return trendBefore(c, i) === 'down' && s.r >= avg * 0.5 && s.body > 0.05 * s.r && s.lo >= 2 * s.body && s.up <= 0.15 * s.r },
  'hanging-man': (c, i, avg) => { const s = shape(c[i]); return trendBefore(c, i) === 'up' && s.r >= avg * 0.5 && s.body > 0.05 * s.r && s.lo >= 2 * s.body && s.up <= 0.15 * s.r },
  'inverted-hammer': (c, i, avg) => { const s = shape(c[i]); return trendBefore(c, i) === 'down' && s.r >= avg * 0.5 && s.body > 0.05 * s.r && s.up >= 2 * s.body && s.lo <= 0.15 * s.r },
  'shooting-star': (c, i, avg) => { const s = shape(c[i]); return trendBefore(c, i) === 'up' && s.r >= avg * 0.5 && s.body > 0.05 * s.r && s.up >= 2 * s.body && s.lo <= 0.15 * s.r },
  'bullish-marubozu': (c, i, avg) => { const s = shape(c[i]); return green(c[i]) && s.r >= avg * 0.9 && s.body >= 0.9 * s.r },
  'bearish-marubozu': (c, i, avg) => { const s = shape(c[i]); return red(c[i]) && s.r >= avg * 0.9 && s.body >= 0.9 * s.r },
  'bullish-engulfing': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'down' && red(p) && green(n) && n.open <= p.close && n.close >= p.open && body(n) > body(p) && body(p) >= avg * 0.2 },
  'bearish-engulfing': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'up' && green(p) && red(n) && n.open >= p.close && n.close <= p.open && body(n) > body(p) && body(p) >= avg * 0.2 },
  'bullish-harami': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'down' && red(p) && green(n) && body(p) >= avg * 0.6 && top(n) <= p.open && bot(n) >= p.close && body(n) <= 0.5 * body(p) },
  'bearish-harami': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'up' && green(p) && red(n) && body(p) >= avg * 0.6 && top(n) <= p.close && bot(n) >= p.open && body(n) <= 0.5 * body(p) },
  'piercing-line': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'down' && red(p) && green(n) && body(p) >= avg * 0.5 && n.open < p.low && n.close > (p.open + p.close) / 2 && n.close < p.open },
  'dark-cloud-cover': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'up' && green(p) && red(n) && body(p) >= avg * 0.5 && n.open > p.high && n.close < (p.open + p.close) / 2 && n.close > p.open },
  'tweezer-bottom': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'down' && red(p) && green(n) && Math.abs(p.low - n.low) <= 0.1 * avg },
  'tweezer-top': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'up' && green(p) && red(n) && Math.abs(p.high - n.high) <= 0.1 * avg },
  'inside-bar': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && range(p) >= avg * 0.8 && n.high < p.high && n.low > p.low },
  'morning-star': (c, i, avg) => { const a = c[i - 2], b = c[i - 1], d = c[i]; return i >= 2 && trendBefore(c, i - 2) === 'down' && red(a) && body(a) >= avg * 0.5 && body(b) <= 0.3 * body(a) && top(b) < a.close && green(d) && d.close > (a.open + a.close) / 2 },
  'evening-star': (c, i, avg) => { const a = c[i - 2], b = c[i - 1], d = c[i]; return i >= 2 && trendBefore(c, i - 2) === 'up' && green(a) && body(a) >= avg * 0.5 && body(b) <= 0.3 * body(a) && bot(b) > a.close && red(d) && d.close < (a.open + a.close) / 2 },
  'bullish-belt-hold': (c, i, avg) => { const s = shape(c[i]); return trendBefore(c, i) === 'down' && green(c[i]) && s.r >= avg && s.lo <= 0.05 * s.r && s.body >= 0.6 * s.r && s.body < 0.9 * s.r },
  'bearish-belt-hold': (c, i, avg) => { const s = shape(c[i]); return trendBefore(c, i) === 'up' && red(c[i]) && s.r >= avg && s.up <= 0.05 * s.r && s.body >= 0.6 * s.r && s.body < 0.9 * s.r },
  'rising-window': (c, i, avg) => i >= 1 && trendBefore(c, i - 1) === 'up' && c[i].low - c[i - 1].high >= 0.25 * avg,
  'falling-window': (c, i, avg) => i >= 1 && trendBefore(c, i - 1) === 'down' && c[i - 1].low - c[i].high >= 0.25 * avg,
  'matching-low': (c, i, avg) => { const p = c[i - 1], n = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'down' && red(p) && red(n) && body(p) >= 0.3 * avg && body(n) >= 0.3 * avg && Math.abs(p.close - n.close) <= 0.1 * avg },
  'bullish-kicker': (c, i, avg) => { const a = c[i - 1], b = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'down' && red(a) && green(b) && body(a) >= 0.5 * avg && body(b) >= 0.5 * avg && b.open > a.open && b.low > a.high },
  'bearish-kicker': (c, i, avg) => { const a = c[i - 1], b = c[i]; return i >= 1 && trendBefore(c, i - 1) === 'up' && green(a) && red(b) && body(a) >= 0.5 * avg && body(b) >= 0.5 * avg && b.open < a.open && b.high < a.low },
  'three-inside-up': (c, i, avg) => i >= 2 && DETECT['bullish-harami'](c, i - 1, avg) && green(c[i]) && c[i].close > c[i - 2].open,
  'three-inside-down': (c, i, avg) => i >= 2 && DETECT['bearish-harami'](c, i - 1, avg) && red(c[i]) && c[i].close < c[i - 2].open,
  'three-outside-up': (c, i, avg) => i >= 2 && DETECT['bullish-engulfing'](c, i - 1, avg) && green(c[i]) && c[i].close > c[i - 1].close,
  'three-outside-down': (c, i, avg) => i >= 2 && DETECT['bearish-engulfing'](c, i - 1, avg) && red(c[i]) && c[i].close < c[i - 1].close,
  'bullish-abandoned-baby': (c, i, avg) => { const a = c[i - 2], b = c[i - 1], d = c[i]; return i >= 2 && trendBefore(c, i - 2) === 'down' && red(a) && body(a) >= 0.5 * avg && range(b) > 0 && body(b) <= 0.1 * range(b) && b.high < a.low && green(d) && d.low > b.high },
  'bearish-abandoned-baby': (c, i, avg) => { const a = c[i - 2], b = c[i - 1], d = c[i]; return i >= 2 && trendBefore(c, i - 2) === 'up' && green(a) && body(a) >= 0.5 * avg && range(b) > 0 && body(b) <= 0.1 * range(b) && b.low > a.high && red(d) && d.high < b.low },
  'rising-three-methods': (c, i, avg) => {
    if (i < 4 || trendBefore(c, i - 4) !== 'up') return false
    const a = c[i - 4], e = c[i], mid = [c[i - 3], c[i - 2], c[i - 1]]
    return green(a) && body(a) >= 0.6 * avg && mid.every((m) => body(m) <= 0.5 * body(a) && m.high <= a.high && m.low >= a.low) && green(e) && body(e) >= 0.6 * avg && e.close > a.close
  },
  'falling-three-methods': (c, i, avg) => {
    if (i < 4 || trendBefore(c, i - 4) !== 'down') return false
    const a = c[i - 4], e = c[i], mid = [c[i - 3], c[i - 2], c[i - 1]]
    return red(a) && body(a) >= 0.6 * avg && mid.every((m) => body(m) <= 0.5 * body(a) && m.high <= a.high && m.low >= a.low) && red(e) && body(e) >= 0.6 * avg && e.close < a.close
  },
  'bullish-three-line-strike': (c, i, avg) => {
    if (i < 3 || trendBefore(c, i - 3) !== 'down') return false
    const t = [c[i - 3], c[i - 2], c[i - 1]]
    return t.every((b) => red(b) && body(b) >= 0.3 * avg) && t[1].close < t[0].close && t[2].close < t[1].close && green(c[i]) && c[i].open < t[2].close && c[i].close > t[0].open
  },
  'bearish-three-line-strike': (c, i, avg) => {
    if (i < 3 || trendBefore(c, i - 3) !== 'up') return false
    const t = [c[i - 3], c[i - 2], c[i - 1]]
    return t.every((b) => green(b) && body(b) >= 0.3 * avg) && t[1].close > t[0].close && t[2].close > t[1].close && red(c[i]) && c[i].open > t[2].close && c[i].close < t[0].open
  },
  'three-white-soldiers': (c, i, avg) => {
    if (i < 2 || trendBefore(c, i - 2) === 'up') return false
    const t = [c[i - 2], c[i - 1], c[i]]
    return t.every((b) => green(b) && body(b) >= avg * 0.5 && b.high - b.close <= 0.3 * body(b)) && t[1].open > t[0].open && t[1].open <= t[0].close && t[2].open > t[1].open && t[2].open <= t[1].close && t[1].close > t[0].close && t[2].close > t[1].close
  },
  'three-black-crows': (c, i, avg) => {
    if (i < 2 || trendBefore(c, i - 2) === 'down') return false
    const t = [c[i - 2], c[i - 1], c[i]]
    return t.every((b) => red(b) && body(b) >= avg * 0.5 && b.close - b.low <= 0.3 * body(b)) && t[1].open < t[0].open && t[1].open >= t[0].close && t[2].open < t[1].open && t[2].open >= t[1].close && t[1].close < t[0].close && t[2].close < t[1].close
  }
}

/** Indexes of the bar that completes the pattern, oldest first. Bars before index 5 are skipped (no context to judge by). */
export function findPattern(id: string, c: Bar[]): number[] {
  const det = DETECT[id]
  const p = patternById(id)
  if (!det || !p) return []
  const out: number[] = []
  for (let i = Math.max(5, p.size - 1); i < c.length; i++) {
    const avg = avgRange(c, i - p.size + 1)
    if (avg != null && det(c, i, avg)) out.push(i)
  }
  return out
}
