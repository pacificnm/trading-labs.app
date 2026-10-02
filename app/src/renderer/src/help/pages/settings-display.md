The time zone setting decides what time Trading Lab shows you. It matters most on **intraday charts**, where a 5-minute candle at the start of the day is a different clock time depending on where you are. Open **File → Settings** and look at the **Time & display** section at the top.

![The Time & display settings](timezone-settings.png)

## The settings

### Show times in

| Choice | What you get |
|---|---|
| **Market time — New York** | Times in US Eastern time, which is how the US stock market is quoted. This is the default. The label shows the current abbreviation, such as *EDT* in summer or *EST* in winter |
| **My local time** | Your computer's own time zone. The label shows its name and abbreviation |
| **Another time zone…** | Choose any zone from a list. A second box, **Time zone**, appears so you can pick it, including **UTC** |

### Clock

- **24-hour** shows times like *14:30*.
- **12-hour** shows times like *2:30 PM*.

Both settings apply immediately, and they are saved for next time.

### The "Now" line

Under the settings, a line shows the **current time** in your chosen zone and whether the **US market is open or closed**. It reminds you that regular market hours are **09:30 to 16:00 New York time** on weekdays, and that **holidays are not tracked**, so the market may be shown as open on a day the exchange is actually closed.

When your zone is not New York, a second line reminds you that intraday charts show bars in your zone, and that daily, weekly and monthly bars are dates and are unaffected.

## What the setting changes

- **Intraday charts** (1 minute to 4 hours): the **time axis** along the bottom and the **crosshair label** that follows your mouse. The crosshair label also names the zone, for example *EDT*.
- **The status bar clock** at the bottom: it shows *Market open* or *Market closed*, the time in your zone and its abbreviation. Click it to jump to these settings.
- **Times on other screens**: the *Data as of* lines, the times of news stories, the times on orders and fills in **Active Trades**, journal entries, and the times in Quote details and the screener.

## What it does not change

- **Daily, weekly and monthly candles.** These are **dates**, not times, so they never move with the time zone. Shifting a date into another zone could show you the wrong day.
- **The market itself.** The market always opens at 09:30 New York time, whatever you choose. Only the clock you read it on changes.
- **Calendar dates** such as option expirations, congressional filing dates and trade dates.

## An example

In New York, a 5-minute chart of one trading day runs from **9:30 AM to 4:00 PM**:

![A 5-minute chart in market time](timezone-chart-ny.png)

With **Another time zone → Asia/Tokyo** and a **12-hour** clock, the same session reads from about **10:30 PM to 5:00 AM**, because Tokyo is many hours ahead of New York:

![The same session shown in Tokyo time](timezone-chart-tokyo.png)

The status bar tells you the zone too:

![The status bar clock in Tokyo time](timezone-statusbar.png)

The candles and prices are exactly the same. Only the clock labels moved.

## Daylight saving time

New York changes between **EDT** and **EST** during the year, and so do many other places, on different dates. The app follows each zone's rules automatically, so the abbreviation changes by itself and the labels stay correct. There can be a few weeks in spring and autumn when your local time and New York are one hour closer or further apart than usual.

## Which should I choose?

- **Market time** is the simplest for learning. Most books, videos and news quote times in New York time, and the "open" and "close" are easy to find on the chart: the first candle is at 9:30 and the last at 3:55 (on a 5-minute chart).
- **My local time** is best if you want the chart to match your own day, for example to know that the open is at lunchtime for you.
- **Another time zone** suits a second location, or **UTC** if you like a neutral clock.

You can change it at any time. Nothing is lost.

## How Claude uses it

Your chosen time zone is part of what Claude sees about your screen, so when it talks about *the open* or *this morning* it can refer to your clock. When it reads chart data, the raw timestamps it works with are in UTC, and it converts them. See *The chat panel*.

## If times look wrong

| What you see | What to check |
|---|---|
| The chart's first candle is not at 9:30 | You are not on **Market time**. Check the zone in Settings |
| *Market open* on a holiday | Holidays are not tracked. Check the exchange calendar |
| A daily chart shows the wrong day | Daily candles are dates. Look at the date on the crosshair label |
| News times look off | The app works out which zone its news provider uses. If a story looks wrong, compare it with the publisher's page |
| The clock is an hour out | Your computer's own clock or daylight saving setting may be wrong |

**Next:** *Data, cache and backups*.
