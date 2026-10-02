Trading Lab is published as **releases on GitHub**. Each release has installers for **Linux** (AppImage and `.deb`), **Windows** (`.exe` installer) and **macOS** (`.dmg`), and the app can tell you when a newer one exists.

## See your version

Open **About → About Trading Lab…**. The first line is your **version**, for example *1.0.0*. *Copy version info* puts the version, Electron and system details on the clipboard, which is handy when you report a problem.

![The About dialog with the Check for updates button](about-updates.png)

## Check for an update

1. Open **About → About Trading Lab…**.
2. Click **Check for updates**.
3. The dialog says either *You are up to date* or *Version X is available*.
4. If one is available, click **Download** to get the installer for your computer (matching your system and processor; on Linux the `.deb` if you installed that, otherwise the AppImage), or **Release notes** to read what changed.

The app **does not install anything by itself**. You download the file and install it the same way as the first time:

- **Windows:** run the `Trading-Lab-Setup-…exe`. The installers are not code-signed yet, so Windows SmartScreen may warn: choose *More info → Run anyway*.
- **macOS:** open the `.dmg` and drag Trading Lab to Applications. The app is not notarized yet, so the first time, right-click it and choose *Open* (or allow it in System Settings → Privacy & Security).
- **Linux AppImage:** replace the old file, make it executable and run it.
- **Linux Debian package:** `sudo apt install ./trading-lab_*.deb`

Your accounts, journal, watchlists and settings live in the data folder shown in About (see *Data, cache and backups*), so a new version picks them up and nothing is lost.

## Automatic checks

The installed app checks GitHub **about 20 seconds after it starts and then once a day**. When there is a newer version it shows a message with an **Open download page** button, **once per version**, so it does not nag you. You can always look again in About.

To turn it off, untick **Check for updates automatically** in the About dialog. Manual checks still work.

## What is sent

Only a request to GitHub's public release list (`api.github.com`). It carries no account, key or trading data. If you are offline, or GitHub is limiting requests from your network, the dialog says so and the app carries on normally.

## Running from source

A copy run with `npm run dev` does not check on its own, because a working copy is always ahead of its last release. The **Check for updates** button still works.

## Before you update

Updating keeps your data, but it is a good moment for a backup: **File → Back Up Data…**. See *Data, cache and backups*.

**Next:** the **Reference** section, starting with *Keyboard shortcuts*.
