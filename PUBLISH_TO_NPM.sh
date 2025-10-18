#!/usr/bin/env bash
set -euo pipefail

# NOTE:
# If you see "Permission denied" when running `./PUBLISH_TO_NPM.sh`, either:
#  - make this script executable once: `chmod +x ./PUBLISH_TO_NPM.sh`
#  - or run it via bash: `VERSION=6.0.0 bash ./PUBLISH_TO_NPM.sh`
#

# Local publish helper for the HyperNexus package.
# Usage:
#   VERSION=v1.2.0 ./PUBLISH_TO_NPM.sh
# Notes:
# - Run this from the package folder (this script lives in the package root).
# - Ensure you are logged in to npm (npm login) or have NPM_TOKEN exported.
# - This script will run `npm run build` if the script exists in package.json.

VERSION="${VERSION:-}"
PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Package dir: $PKG_DIR"

# Ensure package.json exists
if [[ ! -f "$PKG_DIR/package.json" ]]; then
  echo "Error: package.json not found in $PKG_DIR"
  exit 1
fi

# Optional build step if defined
if npm --prefix "$PKG_DIR" run | grep -q " build"; then
  echo "Running build..."
  npm --prefix "$PKG_DIR" run build
fi

# Ensure npm auth - prefer NPM_TOKEN if available
if [[ -n "${NPM_TOKEN:-}" ]]; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$HOME/.npmrc"
  echo "Using NPM_TOKEN from environment for auth"
else
  echo "No NPM_TOKEN env var found. Ensure you are logged in (npm login) or set NPM_TOKEN."
fi

# Publish (scoped packages often need --access public)
echo "Publishing package to npm..."
npm --prefix "$PKG_DIR" publish --access public

# Create and push git tag if VERSION provided
if [[ -n "$VERSION" ]]; then
  echo "Tagging release $VERSION"
  git tag -a "$VERSION" -m "chore(release): $VERSION"
  git push origin "$VERSION"
fi

echo "Publish complete."
