Find the symptom, then try the fixes in order. Most problems come down to a missing or restricted market data key, so start there if the app looks empty.

## Quick checks

1. **Look at the status bar** at the bottom right. It says **Market data: FMP** when live data is on, or **Market data: sample (no FMP key)** when it is not.
2. **Open Settings** (**File → Settings**) and use **Test connection**. It shows which data feeds work. See *API keys*.
3. **Check the Anthropic key** in Settings if the chat is the problem.
4. **Try Refresh** on the screen, or **Clear cache** in Settings. See *Data, cache and backups*.

## Starting the app

| Problem | What to try |
|---|---|
| **The app does not open from VS Code's terminal, or behaves like plain Node** | That terminal sets a variable that makes Electron start as plain Node. Start it with `env -u ELECTRON_RUN_AS_NODE …`. The `npm run dev` and `npm run start` commands already do this |
| **The AppImage will not run** | Make it executable first: `chmod +x Trading-Lab-*.AppImage` |
| **The app exits at start-up** | Installed builds already turn off Chromium's sandbox, because it needs a special helper that is often missing. If you have set `TRADING_SANDBOX=1`, unset it |
| **A blank or flickering window** | Start with the graphics card turned off: `TRADING_NO_GPU=1 trading-lab` |
| **You are not sure the install is healthy** | Run `trading-lab --self-test`. It prints the versions, the data folder, and whether the database and keys can be opened, without opening a window |

## Sample data and missing data

| Problem | What to try |
|---|---|
| **The chart says *Sample data* and the prices are not real** | No market data key is set, or it was rejected. Add it in Settings and run **Test connection**. See *First-time setup* |
| **A screen says to add your FMP key** | The same. Those screens need real data |
| **A screen, tab or chart interval is missing** | Your FMP plan does not include the data it needs, so the app hides it. **Settings → What your FMP plan includes** lists what is missing. Upgrade your plan and click **Test connection** to bring it back, or untick **Hide features my plan does not include** to show everything |
| **Some screens show an error** | Hiding is switched off in Settings, or the plan check has not run yet. Click **Test connection** |
| **A chart is empty with an error and a Retry button** | Click **Retry**. If it keeps failing, check your internet connection and run **Test connection** |
| ***FMP rate limit reached. Try again shortly.*** | Too many requests in a short time. Wait a minute. The app saves answers to reduce this. See *Data, cache and backups* |
| ***FMP rejected the API key.*** | The key is wrong or was disabled. Copy it again from your account page and save it |
| **The numbers look old** | Click **Refresh**, or **Clear cache**. The *Data as of* line shows how old the data is |
| **A symbol shows no data** | Check the spelling. Some symbols, such as indexes and a few funds, have no company news or statements |
| **Options show an error** | Options come from a free delayed public feed, not your key. A stock with no listed options, a quiet period for the feed, or an internet problem can cause it. Click **Retry** later |

## The chart

| Problem | What to try |
|---|---|
| **The first candle of the day is not at 9:30** | You are not on market time. Check **Settings → Time & display**. See *Time zone and display* |
| **Intraday intervals are missing or fail** | Not every length offers every interval, and intraday data needs a suitable plan. See *Length and interval* |
| **A study does not appear** | It needs enough candles to calculate its first value, so it starts part-way along the chart. It may also be hidden. Check **Chart → Chart Settings…** |
| **I cannot scroll or zoom the chart** | A drawing tool is active. Press **Esc** to return to the Cursor |
| **A drawing is in the wrong place** | Drawings are tied to time and price. Check you are on the right symbol |
| **Claude's drawings are in the way** | Pen menu → **Remove Claude's drawings** |
| **I deleted something by accident** | Drawings and studies cannot be undone with a shortcut. Add them again, or ask Claude to |

## Orders and trades

| Problem | What to try |
|---|---|
| ***Trading needs live prices to simulate fills.*** | Paper trading needs a market data key. Add one in Settings |
| **The ticket's *Review order* button is greyed out** | There is a red error on the ticket. Read it, fix the field, and the button turns on. See *The order ticket* |
| ***Order rejected*** | The message says why, for example not enough buying power. The ticket stays open so you can change it |
| **My order has not filled** | Check **Active Trades → Working orders**. A limit or stop fills only when the price reaches it, and a market order placed while the market is closed waits for the next open. See *How orders are filled* |
| **My stop filled at a worse price** | The price gapped past it. A stop trades at the next available price. See *How orders are filled* |
| **A bracket closed at the stop although the chart reached the target** | If one minute reached both, the simulation counts the stop first. See *How orders are filled* |
| **An order disappeared** | Look in **Order history**. It was filled, cancelled or expired. A DAY order expires at the close |
| **I cannot sell shares I own** | You may have shares tied up in another order, or you may be short. The ticket's message explains |
| **My account looks wrong after a reset** | A reset deletes that account's positions, orders and fills. See *Account* |
| **My positions or orders are missing** | You may have switched to another paper account. The status bar shows which one is active; switch on the *Account* screen |
| **The order ticket closed by itself** | It closes when you switch accounts, so an order is never sent to the wrong account. Open it again |
| **The ticket will not let me sell short** | The active account is a **cash account**, which cannot short. Use a margin account, or change the type under *Account details* |
| **My buying power is lower than I expected** | Buying power is shown after setting aside orders still waiting to fill, and a cash account has no margin. See *Account* |
| **There is no stop on my position** | Orders that were never placed do not show. Check **Working orders** and the bracket's entry |

## Claude

| Problem | What to try |
|---|---|
| **The chat says to add an API key** | Add your Anthropic key in Settings. See *API keys* |
| **The key is rejected, or there is a billing message** | Check the key and your credit in the Anthropic Console, then save the key again |
| **The answer stops part-way, or says *cut off*** | It reached the length limit. Ask Claude to continue, or ask a narrower question |
| **Claude says it cannot do something** | It can prepare a ticket but never send an order, and it cannot change your saved limits, settings or keys. See *What Claude can do* |
| **A tool row shows a red cross** | The action failed. Open the row to read why. Claude is told the reason and usually tries a different way |
| **Claude says the data is sample data** | You have no market data key. See *First-time setup* |
| **The chat is slow** | A higher effort setting and a bigger model take longer. Try a lower effort, or a faster model. See *The chat panel* |
| **Claude seems to forget something** | Each chat has its own memory. A new chat starts clean, and a loaded old chat shows only the words, not tool results |

## Keys and storage

| Problem | What to try |
|---|---|
| **Settings says the keys are stored unencrypted** | Start your system keyring (such as GNOME Keyring or KWallet) and save the keys again. The app asks for the system keyring explicitly, because some desktops are not detected |
| **I lost my keys after copying my data to another computer** | Keys are encrypted for the computer they were saved on. Enter them again in Settings |
| **I restored a backup and want my old data back** | **File → Restore From Backup…** and choose the `before-restore-…` file in the `backups` folder inside your data folder. See *Data, cache and backups* |
| **The app will not start after copying the folder by hand** | Copy the **whole** data folder, including the `-wal` and `-shm` files, with the app closed. Or use **File → Back Up Data…** and **Restore From Backup…** instead |
| **I deleted my data folder** | It cannot be recovered without a backup |

## Screens and lists

| Problem | What to try |
|---|---|
| **The watchlist shows dashes for prices** | There is no market data key, or the price could not be loaded. It refreshes about every 30 seconds |
| **A symbol will not add to a watchlist** | A ticker may only use letters, numbers and `.` `^` `=` `-`, up to 15 characters |
| **The screener returns nothing** | Loosen a filter, such as the market cap or volume minimum. See *Stock screener* |
| **Market performance is empty** | Choose another exchange or day, or check that your plan includes it. The page falls back to the last day with data |
| **Congress data will not load, or the screen is missing** | Some plans do not include the disclosure feeds, and the screen is hidden when none are available. See *API keys* |
| **News is empty** | Indexes and some funds have no company news. Try **Market news**, or a stock |
| **A news picture is missing** | The publisher's picture could not be loaded. The story still works |

## Asking for help

If you still cannot solve it:

- **Ask Claude.** Describe what you see. It can read your screen's state and help you work out what is wrong. Remember that it cannot see your computer outside the app.
- **Check you have the latest version.** **About → About Trading Lab…** has **Check for updates**. The problem may already be fixed. See *Updates and versions*.
- **Copy your version information.** The same dialog has a **Copy version info** button. It lists the version, the build type and the system.
- **Run the self-test.** `trading-lab --self-test` gives a short report on the install.
- **Note exactly what you did.** The steps, what you expected, and what happened.

**Next:** *Limits and disclaimers*.
