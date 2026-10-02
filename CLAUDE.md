# CLAUDE.md

This repository holds two things that are worked on separately:

| Folder | What it is | Guide |
|---|---|---|
| `app/` | **Trading Lab**, the Electron + React + TypeScript desktop app (everything that ships in a release) | [app/CLAUDE.md](app/CLAUDE.md): architecture, invariants, gotchas, checklists, testing |
| `site/` | The public **website**: a static site (HTML, CSS, a little JS) with links to GitHub and the latest release | [site/README.md](site/README.md) |

Also at the root: `README.md` (the GitHub landing page), `docs/` (screenshots used by the README) and `.github/workflows/release.yml` (builds the installers and publishes a release).

## Where to run things

- **App commands run from `app/`**: `cd app`, then `npm run dev`, `npm run typecheck`, `npm run build`, `npm run dist`, `npm run release -- patch|minor|major`. `node_modules`, `out/` and `release/` live in `app/` and are git-ignored.
- **The site has no build.** Preview it from the repo root with `python3 -m http.server --directory site 8000`.
- Read [app/CLAUDE.md](app/CLAUDE.md) before changing anything in `app/`. Its invariants matter most: **Claude can never place, change or cancel an order**, the FMP key stays in the main process, and paper and live money never mix.

## Releases and the site

- A release is made by pushing a tag `vX.Y.Z` that matches `app/package.json` (use `npm run release` from `app/`). The workflow builds on five runners and publishes the installers on the GitHub release; the app's "Check for updates" and the website's download section both read that release.
- **The site needs no change for a new release**: `site/main.js` asks GitHub for the latest release and builds the download buttons from its file names. If the installer file-name patterns in `app/electron-builder.yml` change, update `classify()` in `site/main.js` too.
- When a feature changes what the app says it can do, check the site's feature cards and "Honest limits", the root README, and the app's Help pages together.

## Conventions that apply to both

- Be honest about limits in anything user-facing (delayed data, simulated fills, "not investment advice", unsigned installers, the license line: open source under the MIT License, no warranty).
- Never write API keys or personal data into the repo, a screenshot or a page.
- **License: MIT** (`LICENSE` at the root, covering the code, the lessons and Help text and the site). Every third-party package in the app needs its notice shipped: `cd app && npm run licenses` regenerates `build/third-party-notices.txt` (git-ignored; `dist` runs it and the installers carry it next to `LICENSE`). **When the renderer imports a new library, add it to `RENDERER_BUNDLED` in `app/scripts/licenses.mjs`**, which fails the build when an import is not covered. Do not add a dependency under a copyleft license (GPL, LGPL, AGPL, MPL) without a decision from the owner; all current ones are permissive. TradingView's attribution (About dialog, site footer) is a license requirement of the chart library.
- Comments explain why, not what.
