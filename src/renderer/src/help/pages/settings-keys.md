Trading Lab uses two **API keys**: one for **market data** and one for the **Claude assistant**. This page explains how to add, check, replace and remove them. Open **File → Settings**, or the **gear** at the bottom of the ribbon.

![The key sections of Settings, with the connection test open](keys-test.png)

> This picture was taken against a stand-in data feed, so the keys show as coming from environment variables and a few feeds show a red cross. On your own computer, a saved key looks different (see below), and the crosses you see depend on your data plan.

## Claude model and effort

Below the time zone setting, **Claude model and effort** chooses what the chat **starts with**: the *Default model* and the *Default effort*. Claude is billed to your Anthropic account by usage, and bigger models and higher effort cost more, so the default is **Claude Sonnet 5.5 at Medium**. Change it here if you want something cheaper or more thorough. The change applies at once, including to the chat that is open.

![The Claude model and effort setting](settings-claude-default.png)

The pickers under the chat box override it for the current session only, and are reset to this default when you restart the app. Haiku has no effort setting, so the effort choice is greyed out for it.

## The two keys

| Key | From | Used for |
|---|---|---|
| **Market data key (Financial Modeling Prep)** | Your account on the [Financial Modeling Prep](https://site.financialmodelingprep.com/) website | Prices, charts, news, analyst data, the screener, market and Congress screens, and realistic paper fills |
| **Anthropic API key (Claude chat)** | The [Anthropic Console](https://console.anthropic.com/), starting with `sk-ant-` | The Claude chat panel |

Without the market data key, the app shows sample data and paper trading is turned off. Without the Anthropic key, only the chat panel is unavailable. See *First-time setup* for what each key unlocks.

## Adding a key

1. Open Settings and find the section for the key.
2. Click the box and paste the key. The characters are **hidden** as you paste.
3. Click **Save key**, or press **Enter**.

A message confirms the market data key was saved, and the screens switch to live data straight away. For the Anthropic key, the chat panel unlocks immediately. You do not need to restart the app.

To **replace** a key, paste the new one and click **Save key** again. The old one is overwritten.

## What the status line tells you

Each section has a line above the box that says where the key comes from.

| Message | What it means |
|---|---|
| *A key is saved (encrypted with your system keyring).* | Your key is stored on this computer and protected by the system keyring |
| *A key is saved. Encryption is unavailable on this system, so it is stored unencrypted in the local database.* | The key is saved, but no keyring was found, so it is stored as plain text in the app's database. Start your keyring and save the key again to encrypt it |
| *Using the … environment variable.* | You started the app with `ANTHROPIC_API_KEY` or `FMP_API_KEY` set, and no key is saved in the app |
| *No key configured.* | There is no key. The market data section adds that the app shows sample data until you add one |

**A saved key wins.** If you have both a saved key and an environment variable, the app uses the saved key.

## Removing a key

When a key is saved in the app, a **Remove saved key** button appears next to **Save key**. Click it to delete the key from the app. The market data screens go back to sample data (the app says so), and the chat panel asks for a key again.

An environment variable cannot be removed from inside the app. Unset it before you start the app.

## Testing the market data connection

Click **Test connection** in the market data section. It is available whenever a market data key exists. The app tries each data feed it uses and then shows a list. The same check also runs by itself when you save a key, and again if the app later finds something is not in your plan, so you rarely need to click it. Click it after you change your FMP plan to refresh the answer.

- A **green tick** means that feed answered. A short description shows what came back, such as *1 record* or *260 records*. Click the small arrow to see the field names the feed returned.
- A **red cross** means that feed did not work. The reason is shown instead, for example *Empty response*, an error that the feed is **not included in your plan**, or that the key was **rejected**.
- Each row gives the feed's name (*Quote*, *1-minute bars*, *Analyst consensus*, *Stock screener*, *Senate disclosures* and so on) and the endpoint it uses.
- The list also has a row for **Claude data tools (MCP)**, which lets Claude look up extra company data, and one for **Options chain (Cboe, delayed)**, which does not use your key.

A message at the end sums it up. *All N data feeds responded* means everything works. *M of N data feeds responded* means some did not, and the list shows which. Feeds that are **not in your plan** are counted separately, because the app switches off the features that need them (see below).

## What your plan includes

After a check, a box titled **What your FMP plan includes** appears under the cache line. It turns the raw results into the features you can actually use.

![What your FMP plan includes](keys-plan.png)

- A **✓** means the plan includes it. A **✗** means it does not, with what you lose without it.
- **Features your plan does not include are hidden, not left to show an error.** Chart intervals it lacks (for example *1 Min*) are removed from the Interval list, and ranges that need them (such as *1 Day* without any intraday bars) are removed from the Length list. Screens whose data is entirely missing (such as *Stock Screener* or *Senate & House Trades*) disappear from the ribbon, tabs such as *News*, *Analyst Reports* and *Fundamentals* are left out, and sections such as the *Aftermarket* cards or *Analyst estimates* are not shown. A screen with several sources stays while any one of them is available.
- **Claude** is told what is missing, and the matching tools are not offered to it, so it will not try them or promise data you do not have.
- **If your chart was using something the plan lacks**, it moves to the closest interval that works and a message says so.
- **Order fills adapt.** Limit and stop orders are filled by replaying real intraday bars. Without 1-minute bars the app uses the finest bars your plan has (5-minute, then 15-minute, 30-minute and 1-hour), and says so on the order ticket and in Active Trades. If the plan has **no** intraday bars, only plain market orders are offered. See *How orders are filled*.
- The tick box **Hide features my plan does not include** turns all of this off. With it unticked everything is shown again, and anything your plan lacks goes back to showing an error. Order fills are the exception: they always use the bars your plan really has.

Daily bars are never hidden, because without them there would be no chart.

### Reading the results

- **A few crosses are normal.** Data plans differ. Intraday bars (1 minute to 4 hours) and some research feeds need a paid plan. The screens that depend on a missing feed say so, and everything else keeps working.
- **Every row fails.** The key is probably wrong or has been disabled. Re-save it and test again.
- **Rate limit.** *FMP rate limit reached. Try again shortly.* means you made too many requests in a short time. Wait a minute.
- **Network error.** Check your internet connection.

Run the test again after you change your data plan, to see what became available.

## The data cache

Below the market data key, a line shows how many market data responses are **saved on your computer** and how big they are, with a **Clear cache** button. This is covered in *Data, cache and backups*.

## Looking after your keys

- **Treat them like passwords.** Do not share them, post them in screenshots, or paste them into the chat.
- **Anyone with your Anthropic key can spend your credit.** Set a spending limit in the Anthropic Console. See *Cost and privacy*.
- **If a key is exposed**, create a new one on the provider's website, save it here, and delete the old one there.
- **Keys stay on your computer.** The market data key is sent only to your data provider, and the Anthropic key only to Anthropic. Claude never sees either key. See *Cost and privacy*.
- **Use the keyring.** If Settings says a key is stored unencrypted, start your system keyring (such as GNOME Keyring or KWallet) and save the key again.

## If something is wrong

| What you see | What to do |
|---|---|
| The chart still says *Sample data* after saving | Re-save the market data key and run **Test connection** |
| The chat says the key is invalid or the account has no credit | Check the key and your billing in the Anthropic Console, then save the key again |
| *FMP rejected the API key.* | The key is wrong or disabled. Copy it again from your account page |
| Test connection shows red crosses for some feeds | Those feeds are not in your plan. See *Troubleshooting* |
| Settings says keys are stored unencrypted | Start your keyring and save the keys again |

**Next:** *Time zone and display*.
