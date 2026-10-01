This page explains where Trading Lab keeps your information, how the **market data cache** works, and how to **back up** and **restore** your data. Everything is stored on your own computer.

## Where your data lives

All your data is kept in **one folder**, in a single database file.

- On Linux the folder is normally **`~/.config/trading-lab`** (the `.config` folder in your home folder).
- **About → About Trading Lab…** shows the exact path on the line labeled **Data folder**.
- The development version, the AppImage and the installed `.deb` all use the **same folder**, so they share one set of data.

Inside it, `trading.db` is a **SQLite** database. You will also see two small helper files beside it, `trading.db-wal` and `trading.db-shm`. They are part of the database and belong together with it.

### What is in the database

| Kept in the database | Examples |
|---|---|
| **Your paper account** | Cash, positions, orders and fills |
| **Your journal** | Entries, reviews, comments and chart pictures |
| **Your chats** | The text of each conversation with Claude |
| **Your watchlists** | Lists and symbols |
| **Your learning** | Strategy progress, notes and your own strategy guides |
| **Your settings** | Chart settings and study colors, drawings for each symbol, time zone and clock, the model and effort you chose, and your risk limits |
| **Your API keys** | Stored encrypted when your system keyring is available. See *API keys* |
| **The market data cache** | Saved copies of recent market data. See below |

Nothing in this folder is sent anywhere by the app. See *Cost and privacy* for what is sent to Claude when you chat.

## The market data cache

Market data costs requests, and your data provider limits how many you can make. To stay inside those limits and keep the app quick, Trading Lab **saves recent answers** and reuses them while they are still fresh. You can see this on screens that show **Data as of**, with a note that the data is *cached to limit FMP requests*.

![The data cache line in Settings, with the Clear cache button](data-cache.png)

### How long things are kept fresh

How long a saved answer is reused depends on how fast the data changes, and it follows the market session:

| Kind of data | Reused for about |
|---|---|
| **Live prices and quotes** | 15 seconds while the market is open, a little longer in extended hours, and up to 10 minutes when it is closed |
| **Intraday candles** | 30 seconds while the market is open, 10 minutes when closed. These are kept in memory only |
| **Daily history** | 10 minutes while open, 2 hours when closed |
| **News** | 3 minutes while open, 10 minutes when closed |
| **Sector and industry tables, top movers** | 1 to 5 minutes while open, much longer when closed. A past day never changes, so it is kept for a day |
| **Stock screener** | 5 minutes while open, an hour when closed |
| **Congress disclosures** | 30 minutes |
| **Analyst ratings and targets** | 4 hours |
| **Analyst estimates and rating history** | 12 hours |
| **Company profile and financial statements** | 24 hours |

Two rules make this safe:

- **A saved price is never kept past the next session boundary.** A price saved at the close is not reused after the market opens.
- **If your data provider is unreachable**, the app shows the **last saved copy** instead of an error, and the *Data as of* line tells you how old it is.

### Getting fresh data now

- Many screens have a **Refresh** button that skips the saved copy and fetches again.
- **Clear cache** in Settings (next to the *Data cache* line) deletes **every** saved response, and a message confirms it. The next time you open a screen it fetches everything again.
- **Saving, replacing or removing your market data key** also clears the cache, so you never see data from a previous key.

### The Data cache line

In **Settings**, under the market data key, the line reads *Data cache: 9 saved responses (0.0 MB)*. It shows how many responses are saved and how much space they use. The cache is **small and tidy by itself**: entries older than a week are removed, only the most recent 1,500 are kept, and very large responses are not saved.

Clearing the cache is **always safe**. It never touches your account, journal or settings.

## Backing up your data

A backup protects you from a failed disk, a mistake, or a reset you regret. The simplest backup is a copy of the whole data folder.

1. **Close Trading Lab** completely, so the database is not in use.
2. **Copy the folder.** For example, in a terminal:

   ```bash
   cp -r ~/.config/trading-lab ~/trading-lab-backup-2026-10-01
   ```

   Or use your file manager. Show hidden files if you cannot see `.config`. Copy the **whole folder**, including the `-wal` and `-shm` files.
3. **Store the copy** somewhere safe, such as an external drive or another computer.

Do this regularly, for example once a week, and always before a big change such as **Reset account**.

> A copy made while the app is running may be incomplete. Close the app first.

### Restoring a backup

1. **Close Trading Lab.**
2. Move the current folder out of the way (for example rename it to `trading-lab-old`).
3. Copy your backup into place as `~/.config/trading-lab`.
4. Start the app.

### Moving to another computer

Copy the data folder across in the same way. One thing will not carry over: your **API keys**. They are encrypted with the keyring of the computer where you saved them, so a copy cannot read them on another machine. Open **Settings** and enter the keys again. Everything else comes across.

## Starting over and removing data

| You want to | Do this |
|---|---|
| Reset the paper account only | **Account → Reset account…**. Chats, journal and settings are kept. See *Account* |
| Remove one chat | The **bin** icon in the chat history. See *The chat panel* |
| Remove a saved key | **Remove saved key** in Settings. See *API keys* |
| Clear the market data cache | **Clear cache** in Settings |
| Erase everything and start fresh | Close the app and delete the data folder. The app creates a new one on the next start. This is **permanent**, so take a backup first if you might want anything back |

## Using a separate set of data

You can run the app against a different folder, for example to experiment without touching your main data. Start it with the environment variable **`TRADING_DATA_DIR`** pointing at the folder you want:

```bash
TRADING_DATA_DIR=~/trading-lab-practice trading-lab
```

The app creates and uses that folder instead. Your normal data is not touched. The *Data folder* line in **About** shows which folder is in use.

## If something looks wrong

| What you see | What to try |
|---|---|
| A screen shows old numbers | Click **Refresh** on that screen, or **Clear cache** in Settings |
| A chart or table is empty after an outage | Clear the cache and open it again |
| Settings says keys are stored unencrypted | Start your keyring and save the keys again. See *API keys* |
| The app will not start after a restore | Make sure you copied the **whole** folder, including the `-wal` and `-shm` files, and that the app was closed when you copied it |
| You lost your data folder | Restore your latest backup. Without one, the data cannot be recovered |

**Next:** the **Reference** section, starting with *Keyboard shortcuts*.
