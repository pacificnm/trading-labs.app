Trading Lab works the moment you open it, but it needs two keys to do everything: one for **market data** and one for the **Claude assistant**. This page walks through adding them and checking they work.

## What you need

| Key | What it unlocks | Without it |
|---|---|---|
| **Financial Modeling Prep (FMP)** | Real prices and history for charts, quotes, news, analyst data, screener, market and congress screens, and realistic paper fills | The app shows **sample data** and paper trading is turned off, because simulated fills need real prices |
| **Anthropic** | The Claude chat panel | Everything else works; the chat panel shows an "Add your Anthropic API key" button |

Options chains do not need a key: they come from a free delayed public feed.

> **FMP plans.** A free FMP key is enough to try the app, but intraday bars (1 minute to 4 hours) and several research screens need a paid plan. After you add your key, the app checks which data your plan can reach and **hides what it cannot use**, so you will not run into error messages for features you do not have. **Settings** shows the result under *What your FMP plan includes*.

## Step 1: Open Settings

Click **File → Settings**, or the **gear** at the bottom of the ribbon on the left.

![The Settings screen before any keys are added](setup-settings.png)

The screen has three sections: **Time & display**, **Anthropic API key** and **Market data key (Financial Modeling Prep)**.

## Step 2: Add your market data key

1. Get a key from your account on the [Financial Modeling Prep](https://site.financialmodelingprep.com/) website.
2. In **Market data key**, paste it into the **FMP API key** box. The text is hidden as you type.
3. Click **Save key** (or press **Enter**). A green notice confirms it was saved, and the status bar changes from *Market data: sample (no FMP key)* to a live status.
4. Click **Test connection**. The app checks each data feed and lists a ✓ or ✗ next to each one:
   - A ✓ means that feed works with your key and plan.
   - A ✗ shows the reason, such as *requires a higher plan*. The features that need that feed are **hidden** (chart intervals, screens, tabs and sections), so you are not left with error messages. Everything else keeps working. The app also runs this check by itself when you save a key.
   - The list also includes **Claude data tools (MCP)**, which lets Claude look up company data, and the delayed **options** feed.

Charts, the watchlist dropdown, the index ticker and every research screen switch from sample to live data straight away. There is no need to restart.

## Step 3: Add your Anthropic key

1. Create a key in the [Anthropic Console](https://console.anthropic.com/) and make sure the account has credit.
2. In **Anthropic API key (Claude chat)**, paste the key (it starts with `sk-ant-`) and click **Save key**.
3. Open the Claude panel on the right. The "Add your Anthropic API key" banner is gone and you can type a message.

You can also click the banner in the chat panel; it jumps straight to this screen.

> **Cost.** Claude is billed to your own Anthropic account by usage. Longer chats, bigger models and higher effort settings use more. See *Cost and privacy* in the Claude assistant section.

## Where your keys are stored

- Keys are saved on your computer only, in the app's local database, and are sent only to the service they belong to: the FMP key to FMP, the Anthropic key to Anthropic.
- If your system has a keyring (such as GNOME Keyring or KWallet), keys are **encrypted** with it and the Settings screen says so. If not, it says the key is stored unencrypted. Start your keyring and save the key again to fix that.
- Instead of saving a key, you can set the `FMP_API_KEY` or `ANTHROPIC_API_KEY` environment variable before launching. Settings then says it is using the environment variable.
- **Remove saved key** deletes a key from the app at any time.

## Step 4: Choose how times are shown

The **Time & display** section controls the clock on intraday charts and in the app.

- **Market time** shows New York time, which is how US exchanges quote it. This is the default.
- **My local time** uses your computer's zone, and **Another time zone** lets you pick any zone.
- **Clock** switches between 24-hour (14:30) and 12-hour (2:30 PM).

Daily, weekly and monthly bars are dates, so they do not change with this setting. See *Time zone and display* in the Settings section for details.

## Check that everything works

- The status bar at the bottom left shows **Paper account** with a balance of **$100,000** and buying power of **$200,000**. That is your simulated starting balance. Later you can add more accounts, rename them and set balances to match your real ones. See *Account*.
- Open the **Charts** screen. The "Sample data" banner at the top of the chart should be gone and the price should match a live quote.
- Ask Claude a question, such as *Walk me through the AAPL chart setup*.

## If something is not working

| What you see | What to do |
|---|---|
| Chart still says *Sample data* | The FMP key is missing or was rejected. Re-save it and run **Test connection**. |
| Test connection shows ✗ for some feeds | Those feeds are not included in your FMP plan, and the features that need them are hidden. The rest still work. Untick **Hide features my plan does not include** in Settings to show them anyway. |
| Chat says the key is invalid or the account has no credit | Check the key in the Anthropic Console and your billing balance. |
| Settings says keys are stored unencrypted | Start your system keyring, then save the keys again. |

More fixes are in *Troubleshooting* in the Reference section.

**Next:** *A tour of the window*.
