Your orders and positions are drawn **on the chart**, as horizontal lines at their prices, so you can see exactly where an entry, a stop and a target sit relative to the candles. Some of the lines can be dragged to change the price.

![A chart showing a position line, a profit target, a stop and a limit buy order](orderlines-chart.png)

Order lines only appear for the **symbol you are viewing**. Switch to another symbol and you see that symbol's lines instead.

## The kinds of lines

Each line has a **label** on the right side of the chart and a colored line across it.

### Position line

When you hold shares, a **dotted line** marks your **average entry price**. The label reads like **LONG 10 @ 134.20** (or **SHORT** for a short position), followed by your open profit or loss when live prices are available. The line is **green** when the position is in profit and **red** when it is at a loss.

Position lines cannot be dragged. They show where you are, and do not change.

### Working orders

An order waiting to fill is drawn as a **solid line** with a label such as **SELL LMT 139.00 ×10**, which gives the side, the order type, the price and the quantity.

| Color | Meaning |
|---|---|
| **Green** | A profit **target** |
| **Red** | A **stop** (a stop or stop-limit order, or the stop leg of a bracket) |
| **Blue** | Any other order, such as a limit order to buy |

The words in the label are short forms:

| Side | Order type |
|---|---|
| **BUY**, **SELL**, **SHORT** (sell short), **COVER** (buy to cover) | **MKT** (market), **LMT** (limit), **STP** (stop), **STP LMT** (stop-limit), **TRAIL** (trailing stop) |

### Trailing stops

A working **trailing stop** has no fixed price, because it follows the market, so it is **not drawn as a line** on the chart. You will find it on the **Active Trades** screen. While you are still building one in the ticket as the protective stop of a bracket, the draft **STOP (trail)** line shows where the stop would start.

### Orders waiting on an entry

In a **bracket**, the target and stop only become active once the entry order fills. Until then they are drawn as **dashed** lines with **NEXT** at the start of the label, for example **NEXT SELL STP 132.00 ×10**. When the entry fills, they turn solid.

### Draft lines while you build an order

While the **order ticket** is open, the order you are setting up is drawn as **dashed lines**, before you send anything:

- A **blue entry line** at your limit or stop price, labeled like **BUY LMT 135.00 ×10**. For a market order the line sits at the current price instead, with no price in the label.
- A **red STOP line** at your protective stop, if you added one.
- A **green TARGET line** at your profit target, if you chose a bracket.

![An order ticket with its draft entry, stop and target lines on the chart](orderlines-draft.png)

These lines update as you type in the ticket, so you can see how far your stop and target are from the price before you commit. When you send the order, the dashed lines become solid working-order lines. When you close the ticket without sending, they disappear.

Claude's proposed trades show up the same way: when Claude sets up a ticket for you, its entry, stop and target appear as draft lines on the chart for you to review. See *Trade ideas and the ticket*.

## Dragging a line to change a price

Move the mouse over a line that can be dragged and the pointer turns into an **up-and-down arrow**. Then:

1. **Click and hold** on the line.
2. **Drag** it up or down to the new price. The prices snap to whole cents.
3. **Let go** to set it.

What happens depends on the kind of line:

| Line | Dragging it |
|---|---|
| **Draft entry, stop or target** | Changes the matching box in the order ticket. Nothing is sent until you press the send button |
| **Working limit order** | Moves its **limit price** straight away |
| **Working stop or stop-limit order** | Moves its **stop price** straight away |
| **Position line** | Cannot be dragged |
| **Draft market entry** | Cannot be dragged, since it follows the live price |

When you move a working order, a message confirms it, for example *sell limit order moved to 139.50*. If the change is not allowed, a message explains why and the order stays where it was.

While you drag a line, the chart does not scroll, and as soon as you let go it returns to normal.

## Tips for using them

- **Check the distances.** Looking at where your stop sits against recent candles and support levels shows right away whether it is too tight to survive normal moves, or too far away to be worth the risk.
- **Use the lines to size the trade.** The gap between the entry line and the stop line is your risk per share, and the gap to the target is your reward. The ticket and the position calculator turn this into dollar amounts.
- **Combine with drawings.** Draw a horizontal line at support or resistance first, then put your stop just beyond it. See *Drawing tools*.
- **Keep an eye on stale orders.** A forgotten limit order from days ago shows up as an old line on the chart. Active Trades lists them all so you can cancel the ones you no longer want.

## Where to manage orders

The chart is a quick way to see and nudge a price. To cancel an order, close a position or review everything you have open, use the **Active Trades** screen. See *Active trades*.

**Next:** the **Trading** section, starting with *The order ticket*.
