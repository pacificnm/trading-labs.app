# Trading Lab website

A static site: `index.html`, `style.css`, `main.js` and `img/`. There is no build step, no framework and no dependencies, so you can host the folder anywhere that serves files.

## Preview it

```bash
python3 -m http.server --directory site 8000   # then open http://localhost:8000
```

(Run it from the repository root. Opening `index.html` straight from disk also works, but serve it if you want the download section to behave exactly as it will online.)

## The download section

`main.js` asks the GitHub API for the **latest release** (`/repos/pacificnm/trading-labs.app/releases/latest`) when the page loads, sorts the installers into Windows, macOS and Linux by file name, shows each with its size, and puts the visitor's own system first. So **a new release needs no change to the site**: publish a release and the page picks it up.

- It only writes text into the page (`textContent`) and only uses download links that start with `https://github.com/`.
- If GitHub cannot be reached (offline, or the unauthenticated rate limit of 60 requests an hour per visitor), the page falls back to a link to the latest release page. Without JavaScript it shows the same link.
- File names are matched by pattern (`.exe`, `.dmg` with `arm64` or not, `.AppImage`, `.deb` with `arm64` or not). If the app's `artifactName` patterns in `app/electron-builder.yml` change, update `classify()` in `main.js`.

## What to keep in step with the app

The page avoids exact counts (it says "40+ lessons", "60+ candlestick patterns") so it does not go stale, but check these when the app changes:

- the feature cards in `index.html` (what the app can do, the Claude assistant's limits);
- the screenshots in `img/` (copies of images from `docs/screenshots/` and `app/src/renderer/src/help/img/`; replace them with the same names to refresh the page);
- the "What you need", "Installing", "Your data" and "Honest limits" text, which mirrors the app's README and Help (signing status, which services the app talks to, the license line) and the TradingView attribution in the footer, which the chart library's Apache-2.0 license requires.

## Design notes

Dark by default to match the app, light when the visitor's system asks for it (`prefers-color-scheme`). The layout works from phone width up. Colors are CSS variables at the top of `style.css`.

## Hosting

Nothing is deployed yet. Any static host works (GitHub Pages, Netlify, Cloudflare Pages, a bucket). For GitHub Pages, publish the `site/` folder with an Actions workflow; it is not set up here.
