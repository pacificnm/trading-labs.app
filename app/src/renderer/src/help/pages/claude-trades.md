Claude can suggest a trade and set it up for you, but you stay in charge of every decision. When it proposes a trade, it opens the **order ticket** on your chart already filled in, draws the planned entry, stop and target as lines, and saves the idea in your journal. Nothing is sent. You review it, change what you like, and then either send it or close it.

> **Claude can prepare an order ticket. It can never send, change or cancel an order.** An order exists only when **you** press **Send order**.

The ticket in the screenshots below was prepared by running Claude's own *Prepare order ticket* tool in the app, with made-up prices.

![A ticket prepared by Claude, with its lines on the chart](claude-ticket.png)

## Asking for an idea

Ask in plain words. For example:

- *Is there a good pullback trade on this chart?*
- *Set up a long on AAPL with a stop under the last swing low.*
- *Find me a trade idea from my watchlist and show me why.*
- *Teach me with a practice trade using the pullback strategy.*

Claude is asked to treat this as a lesson in **process**, not a tip. If the setup is weak or unclear, it is told to **say so and not force a trade**. "No trade" is a perfectly good answer, and often the most useful one.

## What Claude does first

Before it proposes anything, Claude is asked to ground the idea in real information:

1. **Read the chart**: the candles, the swing highs and lows, and the studies that matter.
2. **Check your account**: equity, buying power, and what you already hold or have working.
3. **Get the live price.**
4. **Read your risk rules and size the trade**, so the number of shares respects your limits. It should say **which limit set the size**.
5. **Define the exit first.** The stop goes where the idea is proven wrong (for example just beyond a swing), the target goes at a level the chart supports, and it states the **reward-to-risk**. It prefers a **bracket**, so the stop and target are placed together with the entry.

You see these steps as tool rows in the chat. See *The chat panel* and *Position calculator*.

## What appears on your screen

When the ticket is ready, several things happen at once.

- **The order ticket opens** over your chart, filled in with the action, quantity, order type, price, strategy, profit target and stop.
- **A blue banner** at the top of the ticket reads *Claude set this up. Review every field before sending; you decide whether to place it.* Below it is Claude's **reasoning**, including what would prove the idea wrong.
- **Dashed lines** show the planned entry, stop and target on the chart. See *Order lines on the chart*.
- **A message** says *Order ticket ready*, with an **Open journal** link.

![The message that appears when Claude prepares a ticket](claude-toast.png)

### The idea is saved in your journal

For orders that open a position (**Buy** or **Sell short**), Claude automatically saves the idea in your **Trading journal**, marked as Claude's:

- The title names the action, symbol and setup, such as *Buy AAPL (bracket) — Pullback to the 20-day average*.
- The entry, stop, target, number of shares and Claude's reasoning are filled in.
- A **picture of your chart** with the draft lines is attached.
- The status is **Idea**.

![The idea Claude saved in the journal](claude-journal-idea.png)

If Claude changes its mind and prepares the ticket again, it **updates the same entry** instead of adding a second one. See *Trading journal*.

## Claude's tickets are checked like yours

Claude's ticket goes through the same checks as one you fill in yourself. See *The order ticket*.

- If the order has a **problem** (a stop on the wrong side of the price, not enough buying power, a missing price), the ticket is **not opened**. Claude is told why and asked to fix it and try again.
- **Warnings** that do not block the order, such as a reward smaller than the risk, still appear in the ticket for you to see.
- It needs **live prices**. Without a market data key, Claude tells you that trading is unavailable. See *First-time setup*.

## Your part: review, then decide

You are the one who decides, and you can do any of the following.

1. **Read everything.** Check the action, quantity, prices, stop and target, and the summary of risk and reward. Does the stop sit where the idea is really wrong? Is the size comfortable?
2. **Change anything.** Edit any field, drag the lines on the chart, or switch the order type. Nothing about the ticket is locked.
3. **Send it.** Click **Review order**, then **Send order**, exactly as with your own tickets. The orders are marked as coming from **Claude ✦** in **Active Trades** so you can tell where an idea came from.
4. **Or leave it.** Close the ticket with **X** or **Cancel** and nothing is placed.

If you change the ticket, ask Claude to look again. It can **read the ticket back** as it now stands before commenting, so its advice matches what you have, not what it first drew. It can also **close the ticket** if the idea is dropped, but only in the open and never to hide something from you.

### What happens in the journal

- **If you send the order**, the journal entry is **linked to the orders** and changes from **Idea** to **taken**. Its result (profit or loss and R multiple) fills in from the real fills when the trade closes. Anything you type in the ticket's journal note is added to the entry.
- **If you do not**, the entry stays as an **Idea**. You can reopen it later with **Open in ticket**, mark it **Skip**, or ask Claude to review it.

## Learning from a Claude idea

The aim is to learn from the process, not to follow Claude.

- **Ask why.** *What would prove this wrong?* and *Why that stop?* are the questions that teach most.
- **Challenge it.** Ask for a case against the trade, or a different stop and what that does to the size.
- **Check it yourself.** Look at the chart, the Position calculator and the news before you send.
- **Review it afterwards.** Whatever happens, click **Ask Claude to review** on the journal entry and write down what you learned. See *Trading journal*.
- **Notice the winners and the losers equally.** One trade proves very little. Many reviewed trades teach a lot.

## What Claude will not do

- It will **not send, change or cancel an order**.
- It will **not predict where the price will go.** It describes what conditions would support or invalidate an idea.
- It will **not treat a trade as a recommendation.** Everything in Trading Lab is a simulation for learning, and any idea should cover risk, not only upside.
- It will **not use prices it did not read.** It is told to get levels and numbers from the tools, and to say so when the data is sample data or an error.

**Next:** *Things to ask*.
