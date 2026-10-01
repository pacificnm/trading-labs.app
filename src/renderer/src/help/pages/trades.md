**Active Trades** shows everything that is happening in your paper account: the positions you hold, the orders waiting to fill, and a record of what has already happened. Open it from the **arrows** icon on the ribbon.

![The Positions tab](trades-positions.png)

The screen has four tabs. The number in brackets on **Positions** and **Working orders** is how many items each holds.

## Positions

The shares you currently own (or have sold short).

| Column | Meaning |
|---|---|
| **Symbol** | The stock. Click it to open its chart |
| **Side** | **Long** (you own the shares) or **Short** (you have sold shares you do not own) |
| **Qty** | The number of shares |
| **Avg price** | What you paid on average, or the average price you sold short |
| **Last** | The latest price |
| **Market value** | Quantity times the last price |
| **P/L** | Your open profit or loss in dollars, green or red |
| **P/L %** | The same as a percent of what you put in |

If a live price is not available for a position, **Last**, **Market value** and **P/L** show a dash instead of a number.

### Closing a position

Click **Close** at the end of a row. A box asks you to confirm: *Close your AAPL position at market? This also cancels its working orders.*

- The position is sold (or covered, for a short) with a **market order** for the whole quantity.
- Every other order for that symbol, such as a stop or target, is **cancelled** first, so nothing is left behind.
- A message confirms that the position is closing. If the market is closed, the order waits and fills at the next opening price.

To close only **part** of a position, use the order ticket instead: choose **Sell** and use the **25%**, **50%** or **All** chips for the quantity. See *The order ticket*.

## Working orders

Orders that have been placed but not yet filled.

![The Working orders tab](trades-working.png)

| Column | Meaning |
|---|---|
| **Symbol** | The stock. Click it to open its chart |
| **Order** | The action in green (buys) or red (sells), followed by its role if it is part of a bigger order |
| **Qty** | The number of shares |
| **Price** | **MKT**, **LMT** (limit price), **STP** (stop price), **STP / LMT** (both prices) or **TRAIL** (trailing amount) |
| **TIF** | **DAY** or **GTC** |
| **Status** | **Working** (live now) or **Waits for entry** |
| **Placed** | When the order was sent |
| **By** | **You**, or **Claude ✦** for an order that came from a trade Claude set up and you sent |

The **role** shown after the action tells you how an order fits into a group:

- **Entry**: the opening order of a bracket.
- **Target** and **Stop**: the profit target and protective stop of a bracket. They say **Waits for entry** until the entry order fills.
- **OCO**: one of two exit orders where the first to fill cancels the other.
- No role: an ordinary single order.

See *Order types, brackets and OCO*.

### Cancelling an order

Click the **X** at the end of the row. The order is cancelled straight away and a message confirms it.

- Cancelling an **entry** also cancels the target and stop that were waiting for it.
- Cancelling one leg of an **OCO** or a bracket's target or stop does **not** cancel the other leg, so remember to review what is left.
- A message explains why if an order cannot be cancelled, for example if it has just filled.

### Changing an order

This screen does not edit prices. To change the price of a working limit or stop order, **drag its line on the chart**. See *Order lines on the chart*. To change anything else, such as the quantity, cancel the order and send a new one from the ticket.

## Order history

Every order that is no longer waiting, newest first.

![The Order history tab](trades-history.png)

The **Status** column says what became of each order:

| Status | Meaning |
|---|---|
| **filled** | It was executed. The **Fill** column shows the price |
| **cancelled** | You cancelled it, or it was cancelled because related orders were (for example, the other leg of an OCO that filled, or a bracket whose entry was cancelled) |
| **expired** | A DAY order that did not fill by the close of the session |
| **rejected** | The order could not be completed, for example a stop for shares you no longer held |

A short reason follows the status in grey, such as *Cancelled by user* or *Day order expired at the close*. The list shows the 80 most recent orders.

## Fills

A record of each time an order was executed: the **time**, **symbol**, **side**, **quantity** and **price**, and the **realized P/L**, which is the profit or loss locked in when you closed or reduced a position. Opening trades have no realized P/L because nothing has been closed yet. The list shows the 80 most recent fills.

![The Fills tab](trades-fills.png)

Times are shown in the zone you chose in Settings. See *Time zone and display*.

## How it stays up to date

The screen refreshes about every 20 seconds, and immediately after you send, cancel or close something. Orders are also checked against prices roughly every 15 seconds while the app is open, so a fill can appear without you doing anything. The **working orders** count in the status bar at the bottom shows how many orders are live right now. It does not include bracket legs that are still waiting for their entry.

## Common questions

- **Where did my order go?** If it is not in Working orders, look in Order history. It was filled, cancelled or expired.
- **Why is there no stop or target on my position?** Orders that were never placed do not appear. Check that the bracket's entry filled, and look in Working orders.
- **Why is there an order I did not place?** If **By** says **Claude ✦**, you sent a trade Claude had set up. Claude can only prepare a ticket, and an order exists only when you send it.
- **Can I see all my history after a reset?** No. A reset deletes positions, orders and fills. See *Account*.

**Next:** *How orders are filled*.
