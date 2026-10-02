#!/usr/bin/env bash
# Usage, from anywhere: npm run release --prefix app -- patch|minor|major   (or app/scripts/release.sh patch)
# Bumps app/package.json, commits, tags vX.Y.Z and pushes; the GitHub Actions "Release" workflow builds and publishes the packages.
# The repository root is one level above app/, so the commit and tag are made with git directly (npm version only tags when package.json is at the root).
set -euo pipefail
cd "$(dirname "$0")/.."
root="$(git rev-parse --show-toplevel)"
bump="${1:-}"
[[ "$bump" =~ ^(patch|minor|major)$ ]] || { echo "usage: $0 patch|minor|major" >&2; exit 1; }
# only the app and the workflow matter for a release; unfinished work on the website does not block one
[ -z "$(git -C "$root" status --porcelain -- app .github)" ] || { echo "app/ or .github/ has uncommitted changes; commit or stash them first." >&2; exit 1; }
[ "$(git -C "$root" rev-parse --abbrev-ref HEAD)" = main ] || { echo "Release from main." >&2; exit 1; }
git -C "$root" pull --ff-only
npx tsc --noEmit -p tsconfig.json
npm version "$bump" --no-git-tag-version >/dev/null
v="$(node -p "require('./package.json').version")"
git -C "$root" add app/package.json app/package-lock.json
git -C "$root" commit -q -m "Release $v"
git -C "$root" tag -a "v$v" -m "Release $v"
git -C "$root" push origin main --follow-tags
echo "Released v$v. Watch it build: gh run watch  (the release appears on the repo's Releases page)"
