The **order ticket** is where you set up and send a paper trade. It opens on top of the chart, so you can see your entry, stop and target on the candles as you fill it in.

![The order ticket with a Buy market order](ticket-simple.png)

> Trading needs **live prices** to simulate fills. Without an FMP key the ticket only shows a message pointing you to Settings. See *First-time setup*.

## Opening the ticket

- Click **Buy** or **Sell** in the chart header. The ticket opens for the symbol you are viewing, with that action selected.
- Or ask **Claude** to set up a trade. Claude fills in the ticket for you to review, but it **never sends it**. See *Trade ideas and the ticket*.
- Other screens, such as the Position Calculator and the Journal, can also open the ticket with a trade filled in.

The ticket header shows the action, the symbol, the **last price** and the day's percent change. Close it with the **X** (or **Cancel**) to discard what you entered.

## The fields

| Field | What it does |
|---|---|
| **Action** | **Buy**, **Sell**, **Sell short** or **Buy to cover**. *Buy* and *Sell short* open a position, and *Sell* and *Buy to cover* close one |
| **Quantity** | Number of whole shares. When you hold a position and choose Sell or Buy to cover, the chips **25%**, **50%** and **All** fill in the quantity for you |
| **Order type** | **Market**, **Limit**, **Stop**, **Stop limit** or **Trailing stop**. See *Order types, brackets and OCO* |
| **Limit price** | Shown for limit and stop-limit orders. The **Last** chip copies the current price |
| **Stop price** | Shown for stop and stop-limit orders. The **Last** chip copies the current price |
| **Trail by** | Shown for trailing stops. Enter an amount and choose **$** or **%** |
| **Time in force** | **DAY** (until today's close) or **GTC** (good till cancelled) |
| **Strategy** | **Single order**, **1st triggers OCO (bracket)** or **OCO (exit orders)** |

The side and quantity are checked against what you hold. For example, you cannot sell shares you do not own, and you cannot short a stock you are long.

## Brackets: entry, target and stop together

Choose **1st triggers OCO (bracket)** to place the entry, a profit target and a protective stop as one trade. Two more sections appear:

![A bracket order set up, with its lines on the chart](ticket-bracket.png)

**Profit target.** Type a price, or use the chips:
- **+2%**, **+5%**, **+10%** set the target that far from the entry price.
- **1R**, **2R**, **3R** appear once you have a stop. They set the target at one, two or three times your **risk**, which is the distance from entry to stop. *2R* means the reward is twice the risk.

**Stop loss.** Pick **Stop**, **Stop limit** or **Trailing stop**, then enter the price (or the trailing amount). The chips **−1%**, **−2%**, **−5%** set a stop that far below a long entry. For a short, the chips and the target move the other way, with the stop above and the target below.

The entry is placed first. The target and stop wait, and become active when the entry fills. When one of them fills, the other is cancelled automatically.

**OCO (exit orders)** is for a position you already hold. It places two exit orders, a stop and a limit, and when one fills the other is cancelled. Use it to protect an open position.

### Size to risk

Once a bracket has an entry and a stop, a **Size to risk** row appears. Click **0.5%**, **1%** or **2% of equity**, or type a dollar amount, and the **Quantity** is worked out for you: the amount you are willing to lose, divided by the distance between entry and stop, rounded down to whole shares. This is the simplest way to keep every trade the same size in risk terms. The *Position calculator* does the same with more options.

## The summary

Under the fields the ticket shows what the order means in money:

| Line | Meaning |
|---|---|
| **Buying power** | What you have free to open new positions |
| **Position** | Shares you already hold in this symbol, if any |
| **Est. cost** or **Est. proceeds** | Shares times the entry price |
| **Risk** | The most you lose if the stop fills, and what that is as a percent of your equity |
| **Reward** | The gain if the target fills |
| **Reward : risk** | Reward divided by risk. *2.50 : 1* means you stand to make two and a half times what you risk |

Risk, reward and the ratio appear for brackets. They are based on the entry, stop and target prices, not on market gaps, so a real stop can fill worse than shown.

## Warnings and errors

The ticket checks the order as you type and shows messages under the summary:

- **Amber warnings** tell you about something odd but allowed. Examples: a buy limit above the current price will fill straight away, a stop on the wrong side of the price will trigger immediately, or the reward is smaller than the risk (it tells you how often you would need to win to break even).
- **Red errors** stop you from continuing, and **Review order** is greyed out until you fix them. Examples: a missing price, a profit target on the wrong side of the entry, selling shares you do not hold, or not enough buying power.

## Recording the trade in your journal

For orders that open a position, a **Record in trading journal** box is ticked by default. Add a note about why you are taking the trade and what would prove you wrong. When you send the order, the app creates a journal entry with your plan (entry, stop, target and quantity), your note and a picture of the chart as it looked, and links the orders to it. You can untick the box if you do not want an entry.

If the ticket came from a journal entry, for example one of Claude's ideas, it says **Linked to journal entry** instead, and your note is added to that entry. See *Trading journal*.

## Reviewing and sending

1. Check the fields and the summary, then click **Review order**.
2. The ticket changes to **Confirm order**, showing the order in plain text, such as *BUY +20 AAPL @182.00 LMT DAY*, with the target and stop on the lines below it. It also repeats the estimated cost, the maximum risk at the stop and the reward at the target.
3. Click **Send order** to place it, or **Back** to change something.

![The confirm order step](ticket-review.png)

After you send:

- A **message** confirms the order. A market order placed while the market is open is filled at once, and the app announces the fill.
- Orders waiting for a price show on the chart as lines, and in **Active Trades**. See *Order lines on the chart* and *Active trades*.
- If the order is **rejected**, for example because buying power changed, a message explains why and the ticket stays open so you can fix it.

## Orders from Claude

When Claude prepares a trade, the ticket opens with a banner saying **Claude set this up. Review every field before sending; you decide whether to place it.** Claude's reasoning is shown under the banner, and the entry, stop and target appear on the chart as dashed lines. Change anything you like. Nothing happens until you press **Review order** and then **Send order** yourself.

## Tips

- **Decide the stop first.** Work out where the trade is proven wrong, put the stop there, and let *Size to risk* choose the quantity.
- **Prefer brackets for new trades.** The stop is in place the moment you enter, so there is no unprotected position.
- **Read the warnings.** A warning is the app telling you the order will not do what you probably meant.
- **Use limit orders** to control the price you pay, and market orders when getting in matters more than a few cents.

**Next:** *Order types, brackets and OCO*.
