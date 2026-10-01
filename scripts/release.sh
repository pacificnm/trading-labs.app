#!/usr/bin/env bash
# Usage: scripts/release.sh patch|minor|major
# Bumps package.json, commits, tags vX.Y.Z and pushes; the GitHub Actions "Release" workflow builds and publishes the packages.
set -euo pipefail
bump="${1:-}"
[[ "$bump" =~ ^(patch|minor|major)$ ]] || { echo "usage: $0 patch|minor|major" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Working tree is not clean; commit or stash first." >&2; exit 1; }
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "Release from main." >&2; exit 1; }
git pull --ff-only
npx tsc --noEmit -p tsconfig.json
npm version "$bump" -m "Release %s"
git push origin main --follow-tags
echo "Pushed. Watch it build: gh run watch  (release appears at the repo's Releases page)"
