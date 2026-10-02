import type { StrategyDoc } from '../../../shared/strategies'
import { diagram, doc, flip, type Diagram } from './strategyDoc'

// Chart patterns and drawing. Diagrams are schematics on a 0-100 grid (y up), not real prices.
// Every pattern is subjective: the lessons say so, and stress confirmation, stops and failure.

const BREAK_RETEST: Diagram = {
  title: 'Breakout and retest',
  path: [[5, 40], [15, 52], [25, 42], [35, 52], [45, 43], [55, 53], [65, 68], [75, 57], [85, 55], [95, 75]],
  lines: [{ a: [10, 53], b: [72, 53], label: 'Resistance', style: 'dashed' }],
  notes: [{ at: [65, 73], text: 'Breakout' }, { at: [83, 49], text: 'Retest' }]
}

const UPTREND: Diagram = {
  title: 'Uptrend line and channel',
  path: [[5, 28], [10, 20], [18, 30], [25, 36], [33, 27], [40, 34], [48, 44], [55, 50], [62, 42], [70, 48], [78, 58], [85, 64], [93, 56]],
  lines: [
    { a: [10, 20], b: [92, 58] },
    { a: [25, 36], b: [92, 67], style: 'dashed' }
  ],
  notes: [{ at: [10, 15], text: '1' }, { at: [40, 29], text: '2' }, { at: [70, 43], text: '3' }, { at: [36, 62], text: 'Channel top' }, { at: [66, 27], text: 'Trendline along the lows' }]
}
const DOWN_BREAK: Diagram = {
  title: 'Downtrend line, then a break',
  path: [[5, 72], [10, 80], [18, 68], [25, 70], [33, 60], [40, 66], [48, 54], [55, 56], [62, 46], [70, 52], [78, 62], [85, 72], [93, 78]],
  lines: [{ a: [10, 80], b: [90, 43] }],
  notes: [{ at: [80, 68], text: 'Break' }, { at: [48, 74], text: 'Trendline along the highs' }]
}

const BULL_FLAG: Diagram = {
  title: 'Bull flag',
  path: [[5, 14], [12, 26], [20, 40], [28, 52], [34, 45], [38, 49], [44, 41], [48, 45], [54, 37], [58, 42], [62, 52], [72, 62], [82, 70], [92, 80]],
  lines: [
    { a: [28, 52], b: [60, 41], style: 'dashed' },
    { a: [30, 46], b: [60, 36], style: 'dashed' },
    { a: [62, 79], b: [96, 79], label: 'Target', tone: 'target', style: 'dashed' }
  ],
  notes: [{ at: [14, 36], text: 'Pole' }, { at: [46, 56], text: 'Flag' }, { at: [66, 46], text: 'Breakout' }]
}
const BULL_PENNANT: Diagram = {
  title: 'Bull pennant',
  path: [[5, 14], [12, 26], [20, 40], [28, 52], [32, 40], [38, 49], [42, 41.5], [47, 47], [51, 43], [55, 45], [58, 44], [63, 54], [72, 62], [82, 70], [92, 80]],
  lines: [
    { a: [28, 52], b: [60, 44], style: 'dashed' },
    { a: [30, 40], b: [60, 43.5], style: 'dashed' },
    { a: [62, 82], b: [96, 82], label: 'Target', tone: 'target', style: 'dashed' }
  ],
  notes: [{ at: [14, 36], text: 'Pole' }, { at: [45, 57], text: 'Pennant' }, { at: [67, 48], text: 'Breakout' }]
}

const ASCENDING: Diagram = {
  title: 'Ascending triangle',
  path: [[4, 28], [10, 30], [18, 60], [26, 45], [32, 41], [40, 60], [48, 52], [54, 52], [62, 60], [68, 58], [72, 61], [78, 70], [88, 76], [96, 84]],
  lines: [{ a: [14, 60], b: [74, 60], style: 'dashed' }, { a: [10, 30], b: [68, 59] }],
  notes: [{ at: [78, 75], text: 'Breakout' }, { at: [42, 69], text: 'Flat resistance' }, { at: [48, 33], text: 'Rising lows' }]
}
const DESCENDING: Diagram = {
  title: 'Descending triangle',
  path: [[4, 62], [10, 60], [18, 30], [26, 45], [32, 49], [40, 30], [48, 40], [54, 38], [62, 30], [66, 33], [70, 30], [76, 20], [86, 14], [96, 8]],
  lines: [{ a: [14, 30], b: [74, 30], style: 'dashed' }, { a: [10, 60], b: [68, 31] }],
  notes: [{ at: [76, 14], text: 'Breakdown' }, { at: [42, 20], text: 'Flat support' }, { at: [46, 62], text: 'Falling highs' }]
}
const SYMMETRICAL: Diagram = {
  title: 'Symmetrical triangle',
  path: [[2, 48], [8, 70], [18, 28], [28, 64], [38, 34], [48, 58], [58, 40], [68, 53], [74, 47], [80, 62], [88, 72], [96, 82]],
  lines: [{ a: [8, 70], b: [80, 49] }, { a: [8, 25], b: [80, 46] }],
  notes: [{ at: [86, 77], text: 'Breakout' }, { at: [46, 76], text: 'Falling highs' }, { at: [46, 18], text: 'Rising lows' }]
}

const RISING_WEDGE: Diagram = {
  title: 'Rising wedge',
  path: [[2, 34], [8, 50], [16, 34], [28, 55], [38, 44.5], [48, 60.4], [58, 54], [66, 65], [72, 60], [78, 48], [86, 40], [94, 30]],
  lines: [{ a: [8, 50], b: [70, 66], style: 'dashed' }, { a: [8, 30], b: [72, 61], style: 'dashed' }],
  notes: [{ at: [86, 46], text: 'Break down' }, { at: [30, 66], text: 'Upper line' }, { at: [52, 40], text: 'Lower line' }]
}

const HEAD_SHOULDERS: Diagram = {
  title: 'Head and shoulders',
  path: [[2, 24], [10, 38], [20, 60], [30, 44], [38, 62], [45, 78], [52, 62], [60, 44], [68, 58], [75, 60], [80, 52], [86, 42], [92, 32], [98, 26]],
  lines: [{ a: [22, 44], b: [90, 44], label: 'Neckline', lx: 58, below: true, style: 'dashed' }, { a: [84, 10], b: [98, 10], label: 'Target', tone: 'target', style: 'dashed' }],
  notes: [{ at: [20, 65], text: 'Left shoulder' }, { at: [45, 82], text: 'Head' }, { at: [75, 65], text: 'Right shoulder' }]
}

const DOUBLE_TOP: Diagram = {
  title: 'Double top',
  path: [[2, 22], [10, 40], [20, 70], [28, 58], [38, 45], [47, 58], [56, 69], [64, 58], [72, 45], [78, 36], [88, 28], [96, 22]],
  lines: [{ a: [14, 70], b: [62, 70], style: 'dashed' }, { a: [30, 45], b: [82, 45], label: 'Neckline', lx: 62, below: true, style: 'dashed' }, { a: [76, 20], b: [98, 20], label: 'Target', below: true, tone: 'target', style: 'dashed' }],
  notes: [{ at: [20, 75], text: 'Top 1' }, { at: [56, 74], text: 'Top 2' }]
}

const CUP_HANDLE: Diagram = {
  title: 'Cup and handle',
  path: [[5, 60], [10, 50.1], [15, 42.2], [20, 36.2], [25, 32.2], [30, 30.2], [35, 30.2], [40, 32.2], [45, 36.2], [50, 42.2], [55, 50.1], [60, 60], [64, 56], [68, 52], [73, 50], [77, 55], [81, 64], [88, 72], [96, 80]],
  lines: [{ a: [5, 60], b: [79, 60], style: 'dashed' }, { a: [82, 90], b: [98, 90], label: 'Target', tone: 'target', style: 'dashed' }],
  notes: [{ at: [32, 24], text: 'Cup' }, { at: [70, 44], text: 'Handle' }, { at: [84, 68], text: 'Breakout' }, { at: [30, 65], text: 'Rim (breakout level)' }]
}

const FIB: Diagram = {
  title: 'Fibonacci retracement of an up-move',
  path: [[30, 26], [37, 20], [45, 45], [54, 60], [60, 70], [65, 80], [69, 70], [73, 60], [77, 52], [80, 45], [83, 43], [87, 52], [92, 66], [97, 80]],
  lines: [
    { a: [28, 80], b: [98, 80], label: '0 (high)', lx: 27 },
    { a: [28, 65.8], b: [98, 65.8], label: '0.236', lx: 27, style: 'dashed' },
    { a: [28, 57.1], b: [98, 57.1], label: '0.382', lx: 27, style: 'dashed' },
    { a: [28, 50], b: [98, 50], label: '0.5', lx: 27, style: 'dashed' },
    { a: [28, 42.9], b: [98, 42.9], label: '0.618', lx: 27, style: 'dashed' },
    { a: [28, 32.8], b: [98, 32.8], label: '0.786', lx: 27, style: 'dashed' },
    { a: [28, 20], b: [98, 20], label: '1 (low)', lx: 27 }
  ],
  notes: [{ at: [80, 36], text: 'Pullback holds near 0.618' }]
}

const RANGE: Diagram = {
  title: 'Range (rectangle) and breakout',
  path: [[2, 42], [10, 62], [18, 40], [26, 61], [34, 38], [42, 62], [50, 40], [58, 61], [66, 42], [74, 64], [82, 72], [90, 80], [98, 78]],
  lines: [{ a: [8, 62], b: [72, 62], style: 'dashed' }, { a: [8, 38], b: [72, 38], style: 'dashed' }, { a: [74, 86], b: [98, 86], label: 'Target', tone: 'target', style: 'dashed' }],
  notes: [{ at: [80, 60], text: 'Breakout' }, { at: [38, 69], text: 'Top of range' }, { at: [38, 30], text: 'Bottom of range' }]
}

export const CHART_PATTERNS: StrategyDoc[] = [
  doc({
    id: 'chart-patterns-overview', title: 'Chart patterns: how to read and trade them', category: 'Chart patterns', level: 'beginner', minutes: 14,
    summary: 'What chart patterns are, the difference between continuation and reversal shapes, and the rules every pattern trade shares: confirmation, stop, target and failure.',
    tags: ['chart patterns', 'basics', 'breakout', 'retest', 'continuation', 'reversal'],
    chartSetup: { range: '1Y', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A **chart pattern** is a recognisable shape that price draws over weeks or months, such as a flag, a triangle or a head and shoulders. Traders use them because the shapes show a battle between buyers and sellers building toward a decision, and the break out of the shape gives a place to enter with a clear stop.

## Two families
- **Continuation patterns** are pauses inside a trend, after which it tends to carry on: flags, pennants, most triangles, rectangles, cup and handle.
- **Reversal patterns** form at the end of a trend and suggest it may turn: head and shoulders, double tops and bottoms, wedges.
Which family a shape belongs to depends on the trend **before** it. A triangle in an uptrend usually points up. The same triangle after a long fall points down.

## The rules every pattern shares
1. **A prior trend.** A reversal needs something to reverse. A continuation needs something to continue.
2. **Defined lines.** You can place the lines on obvious highs and lows, with at least two touches each.
3. **Falling volume inside the pattern**, then **a pick-up on the breakout**. Volume is the best simple check.
4. **A confirmed break.** Wait for a candle to **close** beyond the line, not just poke through it.
5. **A stop on the other side.** If price returns inside the pattern, the idea is wrong.
6. **A target from the pattern's height** (the *measured move*), not from hope.
${diagram(BREAK_RETEST)}
## Retests and false breakouts
After a breakout, price often comes back to touch the broken line (the **retest**). If the old resistance now acts as support, the breakout is stronger, and the retest is a lower-risk entry than chasing. A break that quickly falls back inside the pattern is a **false breakout**, and it is common. It is why you wait for the close and place a stop.

## The honest part
Chart patterns are **subjective**. Two people draw the same pattern differently, and plenty of patterns fail. The measured-move targets are guides, not forecasts, and the results are worse in thin, choppy or news-driven markets. Use patterns together with the trend, volume and your risk rules, and test them on paper.

## Drawing them here
The pen icon in the chart header has a trendline, ray, horizontal line, rectangle and Fibonacci tool. You can also ask Claude to draw a pattern it finds, and then check its work. See the *Drawing tools* Help page.

## Common mistakes
- Seeing patterns everywhere (hindsight is generous).
- Entering before the break closes.
- No stop, or a stop inside the pattern's noise.
- Ignoring the bigger trend and the market.

## Practice
Open a daily chart and scroll back a year. Find two shapes you think are patterns. Draw their lines, mark the break, and note whether volume confirmed it and whether the target was reached.
`,
    quiz: [
      { q: 'What decides whether a triangle is bullish or bearish?', a: 'The trend before it. A triangle after an uptrend usually resolves upward, and after a downtrend usually downward. The break direction confirms it.' },
      { q: 'Why wait for a candle close beyond the line?', a: 'Price often pokes through a line and reverses. A close shows more commitment and filters some false breakouts.' },
      { q: 'What is a retest and why is it useful?', a: 'Price returning to the broken line. If it holds as the new support (or resistance), the breakout is confirmed, and the entry has a closer stop than chasing.' }
    ]
  }),
  doc({
    id: 'drawing-trendlines-channels', title: 'Drawing trendlines and channels', category: 'Chart patterns', level: 'beginner', minutes: 14,
    summary: 'How to draw a trendline correctly, when a third touch makes it valid, how to add a parallel channel, and what a break means.',
    tags: ['trendline', 'channel', 'drawing', 'trend', 'support', 'resistance'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A **trendline** is a straight line along a series of swing lows (in an uptrend) or swing highs (in a downtrend). It shows the angle of the trend and gives a level where price may bounce or where the trend may be failing.

## Drawing an uptrend line
${diagram(UPTREND)}
1. Zoom out until you can see the whole trend.
2. Find two clear **swing lows**, a low with lower prices on both sides. The first is where the trend really began to turn up.
3. Choose the **Trendline** tool, click the first low, then the second low.
4. Extend it to the right (or use a **Ray**), so you can see where it will be next.
5. The **third touch** is the test. A line that price respects three times is far more reliable than one drawn through two points.

## Rules for a good line
- Connect **lows to lows** in an uptrend and **highs to highs** in a downtrend. Do not mix them.
- Be consistent: use **wicks** or **bodies**, not a bit of each.
- A **steep line** is easy to break. A very steep trend usually does not last.
- Redraw when the trend changes angle. Lines are tools, not laws.
- On a long chart use the **log scale** (in Chart Settings) so a line stays straight across big price changes.

## Channels
Draw a second line **parallel** to the first through the highest swing high between the two lows. Price often swings between the two lines.
- Buy near the lower line, take profit near the upper line, and stop under the lower line.
- A strong move **through the top** can mean the trend is accelerating. A fall **through the bottom** can mean it is ending.

## What a break means
${diagram(DOWN_BREAK)}
A **close through a trendline**, especially on rising volume, is the first sign a trend is changing. It does not mean it has reversed. Often price breaks the line, retests it from the other side, and then goes the new way. A break back across is a false signal.

## Using the tools
- **Trendline** for the line between two points, **Ray** to project it.
- Ask Claude: *Draw the main uptrend line on this chart*. It uses the same tools. Check where it put the points, and move them if you disagree.

## Common mistakes
- Forcing a line through points that do not line up.
- Treating a two-point line as proof.
- Redrawing the line after every break to keep it "valid".
- Trading the first touch without a stop.

## Practice
Pick a stock in a clear trend on a 6-month daily chart. Draw the trendline from two lows, then check whether a third low touched it. Add the channel and note where price turned.
`,
    quiz: [
      { q: 'How many touches make a trendline more reliable?', a: 'Two points define a line, but a third touch that holds is the test. The more times price respects it, the more traders watch it.' },
      { q: 'In an uptrend, which swing points do you connect?', a: 'The swing lows. In a downtrend you connect the swing highs.' },
      { q: 'What does a close below an uptrend line suggest, and what should you wait for?', a: 'The trend may be weakening. Wait for a retest from below or further lower closes before treating it as a reversal.' }
    ]
  }),
  doc({
    id: 'flags-pennants', title: 'Flags and pennants', category: 'Chart patterns', level: 'intermediate', minutes: 14,
    summary: 'A sharp move, a short tight pause, then a continuation. How to spot a flag or pennant, where to enter, and how to measure the target.',
    tags: ['flag', 'pennant', 'continuation', 'chart patterns', 'measured move'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A **flag** or **pennant** is a short rest after a sharp, fast move (the **pole**). The market catches its breath, then very often continues in the same direction. They are among the most popular continuation patterns because the pause is short and the stop is close.

## The shapes
${diagram(BULL_FLAG)}
- **Flag**: the rest drifts slightly **against** the pole in a narrow, parallel channel. After a rise the flag slopes down.
${diagram(BULL_PENNANT)}
- **Pennant**: the rest is a small **symmetrical triangle** that narrows toward a point.
Bear versions are the same upside down: a sharp fall, then a small rest drifting up (or a small triangle), then another leg down.

## What to check
- **The pole is sharp and clean**: a big move in a few bars, ideally on high volume.
- **The pause is short**: usually 5 to 20 bars on a daily chart. A very long pause is a different pattern.
- **Volume dries up** during the flag, then rises on the breakout.
- **The pullback is shallow**: it keeps less than about half of the pole. A deep pullback weakens the pattern.

## Rules (bull flag)
- **Entry**: a close above the top of the flag, ideally with volume rising. Some traders enter on the break of the flag's high, with a stop, and accept more false signals.
- **Stop**: below the flag's low (or below its lowest third if the flag is wide).
- **Target**: the **height of the pole added to the breakout point**. Take part of the profit there and trail the rest.
- **Skip it** if the breakout candle is huge and far from the flag, or the market is falling hard.

## When it fails
A flag that slopes **up** after a rise, or a pause that goes on too long, often becomes a reversal. A close back inside the flag after a breakout is a warning. If it breaks the low, exit at the stop and move on.

## Drawing it
Use the **Trendline** tool for the flag's upper and lower line, and a **Horizontal line** at the target price. Ask Claude to mark the pole with a **Rectangle**.

## Common mistakes
- Calling any pause a flag, with no sharp pole before it.
- Buying inside the flag, before the break.
- Ignoring that a big pole means a big target but also a wider stop. Size the position by the stop.

## Practice
Scan a few strong stocks on the daily chart for a sharp move followed by a tight pause. Draw the flag lines, measure the pole, and mark where price went after the breakout. Count how many reached the target.
`,
    quiz: [
      { q: 'What is the difference between a flag and a pennant?', a: 'A flag pauses in a narrow parallel channel sloping against the move. A pennant pauses in a small symmetrical triangle that narrows.' },
      { q: 'How is the target of a flag measured?', a: 'Add the height of the pole to the breakout price. It is a guide, not a promise.' },
      { q: 'What volume pattern do you want to see?', a: 'Volume falling during the pause and rising on the breakout.' }
    ]
  }),
  doc({
    id: 'triangles', title: 'Triangles: ascending, descending and symmetrical', category: 'Chart patterns', level: 'intermediate', minutes: 15,
    summary: 'Price squeezes between two converging lines. How each triangle is drawn, which way it tends to break, and how to avoid the false break.',
    tags: ['triangle', 'ascending', 'descending', 'symmetrical', 'chart patterns', 'breakout'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A **triangle** forms when the swings get smaller, with price squeezed between two lines that converge. The squeeze stores energy, and the break out of it is often sharp. The three kinds differ in which line is flat.

## Ascending triangle (usually bullish)
${diagram(ASCENDING)}
- A **flat resistance** at the top and **rising lows** underneath.
- Buyers step in at higher prices each time while sellers hold one price. When the sellers run out, price breaks up.
- **Entry**: a close above the flat top, with volume. **Stop**: under the last higher low. **Target**: the triangle's widest height added to the break.

## Descending triangle (usually bearish)
${diagram(DESCENDING)}
- A **flat support** at the bottom and **falling highs** above.
- Sellers hit lower prices each time while buyers defend one level. A break below the support often accelerates.
- **Entry**: a close below the flat bottom. **Stop**: above the last lower high. **Target**: the height of the triangle subtracted from the break.

## Symmetrical triangle (direction decided by the trend)
${diagram(SYMMETRICAL)}
- **Falling highs and rising lows**: both sides retreating equally. It is a pause, and it usually breaks in the **direction of the trend before it**, though not always.
- Wait for the break and trade that direction.

## Checks for all three
- **At least two touches on each line** (four points).
- **Volume shrinks** as the triangle narrows and **grows on the break**.
- The best breaks come **about two-thirds to three-quarters of the way** to the point where the lines meet. A break very near the tip is weaker and a long drift past it means the pattern failed.
- Wait for a **close** beyond the line.

## When they fail
A break that returns inside within a day or two is a **false breakout**, and triangles produce plenty of them. The stop just beyond the opposite line limits the damage. A break in the opposite direction to the "usual" bias is allowed: trade what price does, not what the book says.

## Drawing them
Use the **Trendline** tool for each side (extend with **Ray**) and a **Horizontal line** for a flat side. A **Rectangle** around the triangle helps you measure its height.

## Common mistakes
- Assuming a direction before the break.
- Entering on the first touch of a line.
- A target far beyond the nearest resistance or support.

## Practice
Find one triangle of each kind on daily charts. Draw both lines and mark where the break happened relative to the tip. Did volume confirm?
`,
    quiz: [
      { q: 'Which line is flat in an ascending triangle, and which way does it usually break?', a: 'The top line is flat (resistance) and the lows rise. It usually breaks upward.' },
      { q: 'How do you choose a direction for a symmetrical triangle?', a: 'Wait for the break and follow it. It usually follows the trend before the triangle, but the break decides.' },
      { q: 'Why is a break right at the tip of the triangle weaker?', a: 'There is little room left and little stored energy. Better breaks come earlier, about two-thirds to three-quarters of the way in.' }
    ]
  }),
  doc({
    id: 'wedges', title: 'Rising and falling wedges', category: 'Chart patterns', level: 'intermediate', minutes: 12,
    summary: 'Both lines slope the same way and converge: a rising wedge is a warning in an uptrend, and a falling wedge a hint of a bottom.',
    tags: ['wedge', 'rising wedge', 'falling wedge', 'reversal', 'chart patterns'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
In a **wedge** both trendlines slope in the same direction but converge. Price keeps making new highs (or lows) but with less force each time. The market is moving in a narrowing range that is running out of momentum.

## Rising wedge (usually bearish)
${diagram(RISING_WEDGE)}
- Both lines slope **up**, and the lower line rises faster, so they close in.
- Each new high gains less than the one before. Buyers are tiring.
- It often appears at the end of an advance, but can also be a bounce inside a downtrend.
- **Entry**: a close **below the lower line**. **Stop**: above the last high. **Target**: back to where the wedge started, or the wedge's widest height.

## Falling wedge (usually bullish)
It is the same picture upside down: both lines slope **down** and converge, and selling pressure shrinks.
${diagram(flip(RISING_WEDGE, 'Falling wedge', { 'Break down': 'Break up', 'Upper line': 'Lower line', 'Lower line': 'Upper line' }))}
- **Entry**: a close **above the upper line**. **Stop**: below the last low. **Target**: back to where the wedge began.

## What to check
- **A prior trend** in the other direction (a rising wedge after a rise).
- **Falling volume** inside the wedge, then rising volume on the break.
- **At least two touches on each line.**
- A wedge **takes weeks to months**. A wedge over a few days is probably just a short move.

## Things to know
- **Wedges are harder to read** than flags or triangles. Some wedges break in the "wrong" direction, and the break is the signal, not the shape.
- A rising wedge in an **uptrend** is a **reversal warning**, but a rising wedge in a **downtrend** can just be a rally inside it, with the trend resuming downward.
- Do not short just because a wedge is rising. Wait for the break.

## Drawing them
Use two **Trendline** tools extended with **Ray**, and add a **Horizontal line** at the target. Check that the lines converge.

## Common mistakes
- Acting before the break.
- Treating a steep channel (parallel lines) as a wedge.
- Ignoring volume, which is the best clue to fading momentum.

## Practice
Find a rising wedge and a falling wedge on a daily chart. Draw both lines. Did volume shrink? Where did price go after the break?
`,
    quiz: [
      { q: 'How is a wedge different from a channel?', a: 'The wedge lines converge. In a channel they stay parallel.' },
      { q: 'Why is a rising wedge a warning in an uptrend?', a: 'New highs are made with shrinking strength, and the narrowing range shows buyers losing control. A break below the lower line confirms it.' },
      { q: 'What is the entry signal?', a: 'A close beyond the line the wedge points away from: below the lower line for a rising wedge, above the upper line for a falling wedge.' }
    ]
  }),
  doc({
    id: 'head-and-shoulders', title: 'Head and shoulders (and the inverse)', category: 'Chart patterns', level: 'intermediate', minutes: 15,
    summary: 'The classic reversal: three peaks with the middle one highest, a neckline, and a measured target. Includes the inverse pattern at bottoms.',
    tags: ['head and shoulders', 'reversal', 'neckline', 'chart patterns', 'measured move'],
    chartSetup: { range: '1Y', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A **head and shoulders top** is one of the best-known reversal patterns. After an uptrend, price makes a peak (the **left shoulder**), a higher peak (the **head**), and a lower peak again (the **right shoulder**). Buyers could not make a new high on the last rally, and the trend may be over.
${diagram(HEAD_SHOULDERS)}
## The parts
- **Left shoulder**: a rally to a high, then a pullback.
- **Head**: a rally to a higher high, then a pullback to about the same level as the first.
- **Right shoulder**: a rally that fails to reach the head's height, then a decline.
- **Neckline**: the line through the two pullback lows. It is often flat but can slope.

## Rules
- **A prior uptrend**, so there is something to reverse.
- **Entry**: a **close below the neckline**. Aggressive traders enter on the right shoulder's failure, with more risk.
- **Stop**: above the right shoulder (a tighter one above the neckline after a retest).
- **Target**: the **distance from the head to the neckline**, subtracted from the breakout.
- **Volume** is often highest on the left shoulder and head, lighter on the right shoulder, and rises on the break.

## The retest
After the neckline breaks, price often rallies back to it. If the old support now acts as **resistance**, the pattern is confirmed. The retest is a better entry with a closer stop, but it does not always occur, so decide beforehand whether you will wait.

## Inverse head and shoulders (bottom)
${diagram(flip(HEAD_SHOULDERS, 'Inverse head and shoulders', { 'Left shoulder': 'Left shoulder', 'Right shoulder': 'Right shoulder' }))}
It is the same pattern upside down after a **downtrend**. A **close above the neckline** is the buy signal, and the target is the head's depth added to the breakout.

## When it fails
- Price breaks the neckline and quickly **closes back above it** (a false breakout).
- The right shoulder rises **above the head**, so the pattern is gone.
- The shape is **uneven or sloppy**. If you have to squint, it is probably not one.

## Drawing it
Use the **Trendline** tool for the neckline, a **Horizontal line** for the target, and ask Claude to mark the three peaks. A **Rectangle** over the head helps you measure its height.

## Common mistakes
- Shorting the right shoulder without any confirmation.
- Calling any three peaks a head and shoulders.
- Targets taken before the neckline has broken.

## Practice
Find one head and shoulders and one inverse on a one-year daily chart (an index chart works well). Mark the neckline, the break, the retest and the measured target. Did price reach it?
`,
    quiz: [
      { q: 'What is the neckline and when is the pattern confirmed?', a: 'The line through the lows between the peaks. The pattern is confirmed when price closes beyond it (below for a top, above for an inverse).' },
      { q: 'How do you calculate the target?', a: 'Measure from the head to the neckline and project that distance from the breakout in the direction of the break.' },
      { q: 'What makes it fail?', a: 'A quick return across the neckline, a right shoulder rising above the head, or a sloppy, uneven shape.' }
    ]
  }),
  doc({
    id: 'double-tops-bottoms', title: 'Double tops and double bottoms', category: 'Chart patterns', level: 'intermediate', minutes: 12,
    summary: 'Price tests the same level twice and fails: the M and W shapes, how to tell a double top from a plain range, and where the target sits.',
    tags: ['double top', 'double bottom', 'reversal', 'neckline', 'chart patterns'],
    chartSetup: { range: '1Y', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
A **double top** looks like the letter **M**: price rallies to a high, falls back, rallies to about the same high again, and fails. The same ceiling held twice, which tells you sellers are waiting there. A **double bottom** is the **W**: the same floor held twice.
${diagram(DOUBLE_TOP)}
## Double top
- **Prior uptrend.**
- **Two peaks at about the same price**, within a small margin, with a clear dip between them. A few weeks apart is typical.
- **Neckline**: the low of the dip between the peaks.
- **Entry**: a **close below the neckline**, not the second peak itself. Many second peaks just become new highs.
- **Stop**: above the second peak (or above the neckline once it is retested).
- **Target**: the height from the peaks to the neckline, subtracted from the break.
- **Volume** is often lower on the second peak, a sign of fading buying.

## Double bottom
${diagram(flip(DOUBLE_TOP, 'Double bottom', { 'Two similar highs': 'Two similar lows', 'Top 1': 'Bottom 1', 'Top 2': 'Bottom 2' }))}
The mirror image after a **downtrend**: two lows at the same level, then a **close above the neckline** (the high between them). The target is the depth of the pattern added to the break. Volume often rises on the rally off the second low.

## Triple tops and bottoms
The same idea with three touches. A level that holds three times is strong, so the break afterwards is often more decisive.

## Telling it from a range
A pattern after a trend with a dip between the peaks and a break of the dip's low is a double top. Two touches inside a long sideways range are just range behaviour and carry no reversal signal. The neckline break is what turns the shape into a pattern.

## When it fails
- **Price makes a new high** above the second peak, so the pattern is cancelled.
- A **break that closes back above the neckline**.
- The two peaks are **too far apart in price or time**.

## Drawing it
A **Horizontal line** at the two peaks and another at the neckline. A **Rectangle** from the peaks to the neckline shows the height you will project.

## Common mistakes
- Shorting the second peak before the neckline breaks.
- Treating any two highs as a double top.
- Targets that run past the next support.

## Practice
Find a double top and a double bottom on a one-year daily chart. Mark both peaks, the neckline and the target. How many of the double tops you can find actually broke the neckline?
`,
    quiz: [
      { q: 'When is a double top confirmed?', a: 'When price closes below the neckline, the low of the dip between the two peaks. The second peak alone is not a signal.' },
      { q: 'How do you work out the target?', a: 'Measure from the peaks down to the neckline and subtract that distance from the breakdown.' },
      { q: 'What cancels the pattern?', a: 'A new high above the second peak, or a break below the neckline that quickly closes back above it.' }
    ]
  }),
  doc({
    id: 'cup-and-handle', title: 'Cup and handle', category: 'Chart patterns', level: 'intermediate', minutes: 12,
    summary: 'A rounded base followed by a small pullback, then a breakout to new highs: a long-term continuation pattern popular with growth investors.',
    tags: ['cup and handle', 'base', 'continuation', 'breakout', 'chart patterns'],
    chartSetup: { range: '1Y', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
The **cup and handle** is a base that forms **after an uptrend** and can last from a couple of months to a year. It shows a stock being sold, then slowly bought back to where it started, and then taking a short, final rest before a breakout. It is mostly a **continuation** pattern, so the prior uptrend matters.
${diagram(CUP_HANDLE)}
## The parts
- **Left rim**: the high where the decline starts.
- **The cup**: a **rounded, U-shaped** drop and recovery. A sharp V is not the same: the rounded base shows a gradual change of mind.
- **The right rim**: price comes back up near the left rim's high.
- **The handle**: a **short, small pullback** (often a week or more) on lower volume, usually in the **upper half** of the cup.
- **The breakout**: a close above the rim (the top of the handle).

## Rules
- **Depth**: the cup usually falls about 15% to 35% from the rim. Very deep cups are a sign of weakness.
- **Entry**: a close above the handle's high / the rim, **with volume well above average**.
- **Stop**: below the handle's low (a tighter stop than below the whole cup).
- **Target**: the **depth of the cup added to the breakout**.
- **Volume** dries up in the handle and expands on the breakout.

## Quality checks
- The cup is **rounded**, not a V.
- The handle is **short and shallow**, and slopes slightly down or sideways.
- The stock was in an **uptrend** and the **market is healthy**. A cup and handle in a falling market fails more often.
- The breakout is **not already extended**. Buying 10% above the rim is chasing.

## When it fails
A handle that **goes deeper than half the cup**, a breakout on weak volume, or a close back below the rim all point to a failed pattern. Take the loss at the stop.

## Drawing it
Use a **Horizontal line** at the rim (the breakout level) and another at the target. A **Rectangle** around the cup helps you measure its depth.

## Common mistakes
- Calling any bounce a cup.
- Buying the handle before it forms, or the rim before the break.
- Using this on a stock that is not in an uptrend.

## Practice
Look at a year of daily candles of a few strong stocks. Find a rounded base followed by a small pullback. Mark the rim and handle, and check whether volume expanded on the breakout.
`,
    quiz: [
      { q: 'Why does a rounded cup matter more than a V-shaped one?', a: 'A gradual rounded recovery suggests selling was absorbed over time. A sharp V can reverse just as sharply.' },
      { q: 'Where does the handle usually sit and what should volume do?', a: 'In the upper half of the cup, as a short shallow pullback, with volume drying up before the breakout.' },
      { q: 'How is the target set?', a: 'Add the depth of the cup (rim to bottom) to the breakout price. It is a guide, not a promise.' }
    ]
  }),
  doc({
    id: 'fibonacci-retracements', title: 'Fibonacci retracements', category: 'Chart patterns', level: 'intermediate', minutes: 13,
    summary: 'How to draw a Fibonacci grid on a swing, which levels traders watch, and the honest limits of the tool.',
    tags: ['fibonacci', 'retracement', 'pullback', 'drawing', 'support'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
After a strong move, price often pulls back before it continues. Traders watch for that pullback to stall near certain **proportions of the move**: 23.6%, 38.2%, 50%, 61.8% and 78.6%. These come from the Fibonacci sequence, but you do not need the maths. The grid just marks levels where a pullback often pauses because many traders are watching them.
${diagram(FIB)}
## Drawing it in the app
1. Choose **Fibonacci retracement** in the drawing menu (the pen icon).
2. For a pullback inside an **up-move**, click the **swing low** first and then the **swing high**. For a **down-move**, click the swing high first and then the swing low.
3. The grid shows each level with its price. Level **1** is where you started and **0** where you finished.
You can also ask Claude: *Draw a Fibonacci retracement on the last swing.*

## Choosing the swing
- Use a **clear, significant swing**: a recent obvious low to an obvious high.
- Use the **highest high and lowest low** of the move, in a consistent way (wicks or bodies).
- If two people would pick different points, the levels will be different too. Do not stretch it to make a level fit.

## How traders use it
- **38.2% to 50%**: a shallow pullback in a strong trend.
- **61.8%**: the "golden" level, a deeper pullback that can still hold the trend.
- **78.6% and beyond**: a very deep pullback. The trend is in question, and a close beyond the start of the move cancels it.
Look for **more than the Fibonacci level alone**: a **horizontal support level**, a moving average, a trendline, or a bullish candle pattern at the same price. Several clues together are called **confluence**.

## A simple plan
- **Entry**: after price reaches a level **and** shows a reversal sign (a hammer, a bullish engulfing candle).
- **Stop**: just beyond the next level (or the swing start).
- **Target**: the prior high, then beyond.

## The honest limits
Fibonacci levels are **not natural laws**. They work partly because many traders use them, and partly because with five levels, price is bound to be near one of them somewhere. There is no proof they predict better than a plain support level. Treat them as a **map**, not a signal, and never trade a level alone.

## Common mistakes
- Drawing from the wrong swing points to fit a level.
- Buying a level with no confirmation or stop.
- Ignoring the trend: retracements work in trends, not in ranges.

## Practice
Pick a stock with a clear up-move on a 6-month daily chart. Draw the grid from the low to the high. Where did the pullback stop? Was there a support line, a moving average, or a candle pattern at that level?
`,
    quiz: [
      { q: 'In which order do you click the two points for an up-move?', a: 'The swing low first, then the swing high. For a down-move it is the swing high first, then the low.' },
      { q: 'What is confluence?', a: 'Several clues at the same price, such as a Fibonacci level, a support line, a moving average and a reversal candle. It makes a level more meaningful.' },
      { q: 'Why should you not trade a Fibonacci level on its own?', a: 'There are many levels, so price is often near one by chance. The tool has no proven edge over plain support, so it needs confirmation and a stop.' }
    ]
  }),
  doc({
    id: 'ranges-rectangles', title: 'Ranges, rectangles and box breakouts', category: 'Chart patterns', level: 'beginner', minutes: 12,
    summary: 'When price bounces between two flat lines: how to draw the box, how to trade inside it, and how to trade the breakout.',
    tags: ['range', 'rectangle', 'consolidation', 'breakout', 'drawing', 'support', 'resistance'],
    chartSetup: { range: '6M', interval: '1day', type: 'candles', studies: [{ study: 'volume' }] },
    body: `
## The idea
Much of the time a stock is **not trending** but moving sideways between a floor (support) and a ceiling (resistance). This is a **range**, or a **rectangle** pattern. Buyers defend the bottom and sellers defend the top, until one of them gives in.
${diagram(RANGE)}
## Drawing the box
1. Find the **ceiling**: at least two highs at about the same price.
2. Find the **floor**: at least two lows at about the same price.
3. Draw a **Horizontal line** at each, or one **Rectangle** from the first touch to the last. A rectangle is handy for measuring the height.
4. The more touches and the longer the range, the more important the break.

## Two ways to trade it
**Inside the range (fade the edges)**
- **Buy near the floor** with a stop just below it, and **sell near the ceiling**.
- It only works while the range lasts, so use a small position and exit if price closes outside the box.
- Skip it if the range is narrow compared with costs or the stock's usual daily movement.

**The breakout**
- **Entry**: a close **above the ceiling** (or below the floor), ideally on rising volume.
- **Stop**: back **inside** the box, below the ceiling, or below the middle for a wider stop.
- **Target**: the **height of the box added to the break**.
- A **retest** of the broken edge is a common, lower-risk entry.

## What to check
- **The range is clear.** Edges that are a mess are not a range.
- **Volume shrinks** inside the box and picks up on the break.
- **A long range is a coiled spring.** A break after months of sideways trading often goes further than one after a few days.
- **The direction of the prior trend** gives a small edge. Ranges after an uptrend break up somewhat more often, but the break decides.

## When it fails
**False breakouts** are very common from ranges. Price pokes out, then falls back in and runs to the other side. That is why you wait for the close, use a stop, and can even trade the failed break (see *Failed breakouts and range fades*).

## Common mistakes
- Buying at the ceiling in a range.
- Treating a quiet, thin range as safe.
- Setting a target far beyond the next level.

## Practice
Find a stock that traded sideways for two months or more on the daily chart. Draw the box. How many times did it touch each edge? What happened when it left the box?
`,
    quiz: [
      { q: 'What are two ways to trade a range?', a: 'Buy near the floor and sell near the ceiling while the range holds, or wait for a close outside the box and trade the breakout.' },
      { q: 'How do you set the target for a box breakout?', a: 'Add the height of the box to the breakout price (subtract it for a break down).' },
      { q: 'Why is a long range often followed by a larger move?', a: 'More buyers and sellers positioned at the edges, and a longer build-up of pent-up demand or supply, so the break often travels further.' }
    ]
  })
]
