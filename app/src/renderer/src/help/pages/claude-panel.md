The **Claude panel** is the assistant you talk to. It sits on the right side of the window on every screen, and it can see what you are looking at, so you can ask about *this* chart, *this* order or *this* screen without explaining it first. It can answer questions, explain ideas, read and mark up your chart, and prepare trades for you to review.

![A conversation in the Claude panel](chat-conversation.png)

> The conversation shown here was written for this guide to show the layout. Claude's real answers depend on your question and your screen.

## Before you start

The chat needs an **Anthropic API key**. Until you add one, the empty panel shows an amber **Add your Anthropic API key to start chatting** button. Click it to open Settings. See *First-time setup*. Claude is billed to your own Anthropic account. See *Cost and privacy*.

## Making room

Drag the thin **divider** between the main panel and the Claude panel to make the chat wider or narrower. Wider is easier for long answers and tables.

## The header

At the top of the panel:

- **+ (New chat)** starts a fresh conversation. If Claude is still answering, it is stopped first.
- **Clock (Chat history)** opens your saved conversations.

## Starting a conversation

An empty panel shows four **suggestions**, such as *Walk me through the AAPL chart setup* (it uses the symbol you are viewing), *What do my active studies say right now?*, *Explain RSI and how to read it* and *Help me size a paper trade with proper risk*. Click one to send it, or type your own question in the box at the bottom.

### The message box

- Press **Enter** to send. Press **Shift+Enter** to start a new line.
- The box grows as you type, up to a limit, and then scrolls.
- The round **arrow** button sends too. It is greyed out while the box is empty.
- While Claude is answering, the arrow becomes a square **Stop** button. Click it to stop the answer. The reply keeps what was written so far and says it was stopped.

## Reading Claude's answers

Claude's reply appears under a **Claude** heading and **streams in** as it is written, with a flashing cursor at the end. Answers can include **bold** text, lists, tables and headings. Your own messages show under **You**.

While Claude works, you may see:

| What you see | What it means |
|---|---|
| **Working…** | Claude is waiting for something, such as a result from a tool |
| **Thinking…** | Claude is reasoning before it answers. This section opens while it works and becomes a collapsed **Thought process** you can open afterwards to read |
| A **tool row** | Claude is using a tool on your behalf. See below |

### Tool rows

When Claude reads the chart, adds a study, draws a line, looks up news or prepares an order ticket, a row appears in the reply showing what it did:

- A **spinner** while it runs, then a **tick** when it worked or a **cross** if it failed.
- A **wrench** icon, the **name of the action** (such as *Read chart state* or *Draw horizontal line*) and a short summary of what it is acting on, like a symbol or price.
- **Click the row** to expand it and see the exact request and the result. It is useful for understanding how Claude reached an answer, and for spotting a mistake.

Changes Claude makes show up right away on your chart. You can undo them yourself, for example with **Remove Claude's drawings**. Claude can **prepare** an order ticket but can never send, change or cancel an order. See *Trade ideas and the ticket* and *What Claude can do*.

### The line under each answer

A small grey line after a finished reply shows **which model** answered and **how many tokens** (pieces of text) it wrote. It also notes anything unusual:

- *· declined*: Claude chose not to answer that request.
- *· cut off (length limit)*: the answer hit the length limit. Ask it to continue.
- *· stopped*: you stopped it.

### Errors

If something goes wrong, a red message appears under the reply. When the key is rejected, it has an **Open Settings** button. Other problems, such as a network error or a billing issue, show the message from the service.

## Choosing a model and an effort

Two pickers sit under the message box. The choices are remembered the next time you open the app.

![The model picker](chat-model.png)

**Model.** Pick which Claude model answers:

| Model | Best for |
|---|---|
| **Claude Opus 5.5** | The most capable everyday model, and costs more than Sonnet |
| **Claude Sonnet 5.5** | Fast and capable, at a lower cost. This is the starting choice, at **Medium** effort |
| **Claude Fable 5.1** | The deepest reasoning. Slowest and highest cost |
| **Claude Haiku 4.5** | The fastest and cheapest. It has no effort setting |

![The effort picker](chat-effort.png)

**Effort.** How much Claude thinks before it answers:

| Effort | Meaning |
|---|---|
| **Low** | Quick answers, least thinking |
| **Medium** | Balanced |
| **High** | Thorough analysis |
| **Extra high** | Deep analysis for hard problems |
| **Max** | Maximum effort and the highest cost |

### The default, and changing it for one session

The pickers here change the model and effort **for the current session only**. The next time you start the app, the chat goes back to your **default**, which you set in **File → Settings → Claude model and effort** (see *API keys*). That way trying Opus on one hard question never leaves it switched on.

Each model starts on a sensible effort when you choose it. **Haiku** has no effort control, so the effort picker is greyed out for it.

As a rule of thumb, use a quick setting for simple questions and definitions, and a higher one for reading a chart, checking a trade plan or analysing a strategy. Higher effort and bigger models take longer and use more of your API credit. See *Cost and privacy*.

## What Claude knows about your screen

Every message you send carries a snapshot of the app, so Claude does not need to be told:

- the **screen** you are on and the **symbol** you are viewing,
- the chart's **time frame, chart type, scale and active studies**,
- your **active paper account** (its name, brokerage, type and figures), **positions** and how many orders are working,
- your **watchlists**, and the **time zone** you chose.

It does not see your API keys. It also reads the **chart data** itself with its tools when it needs the candles, rather than from memory. See *What Claude can do*.

## Chat history

The **clock** icon lists your saved conversations, newest first.

![The chat history menu](chat-history.png)

- Each conversation is named after your **first message**.
- Click one to **load it**. You see the earlier messages and can carry on from there.
- The **bin** icon beside a conversation deletes it.
- The conversation you have open is highlighted.
- Click outside the menu to close it.

Claude is given the earlier text of the conversation when you reply, so it remembers what you discussed. A loaded conversation shows the text of the messages. The tool rows and the thought process are not saved, only the words.

Start a **new chat** when you change topic. A long conversation about one chart is not helped by old messages about something else, and shorter chats use less of your API credit.

## Questions sent from other screens

Many screens have an **Ask Claude** button, for example in Options, Market performance, the Stock screener, the Calculator, the Journal and the Strategies library. Each one writes a ready-made request and sends it to this panel as if you had typed it. If Claude is still answering something else, a message asks you to try again in a moment.

## Tips for good answers

- **Be specific.** *Is the 50-day average acting as support on this chart?* gets a better answer than *What do you think?*
- **Say what you are trying to learn.** *Teach me how a pullback looks* gets a teaching answer, not a trade tip.
- **Ask Claude to show you.** *Mark the support levels on the chart* works on the screen as well as in words.
- **Ask why.** *What would make this idea wrong?* is one of the most useful questions in trading.
- **Check the facts.** Claude can make mistakes. Look at the chart and the numbers yourself, especially before acting on an idea.

**Next:** *What Claude can do*.
