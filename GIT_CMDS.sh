#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   VERSION=v1.2.0 BRANCH=chore/config-docs ./GIT_CMDS.sh
# Defaults:
VERSION="${VERSION:-vX.Y.Z}"        # replace vX.Y.Z with real tag before tagging
BRANCH="${BRANCH:-chore/config-docs}"
COMMIT_MSG_FILE="COMMIT_MESSAGE.txt"

# Files to add (adjust if needed)
FILES_TO_ADD=(
  ".env.example"
  "README.md"
  "CHANGELOG.md"
  "RELEASE_NOTES.md"
  "src/config/env.ts"
  "COMMIT_MESSAGE.txt"
)

echo "Branch: $BRANCH"
echo "Tag (VERSION): $VERSION"
echo "Commit message file: $COMMIT_MSG_FILE"
echo "Files to add: ${FILES_TO_ADD[*]}"

# Ensure commit message file exists
if [[ ! -f "$COMMIT_MSG_FILE" ]]; then
  echo "Error: $COMMIT_MSG_FILE not found."
  exit 1
fi

# Create branch
git checkout -b "$BRANCH"

# Stage files (ignore missing files)
for f in "${FILES_TO_ADD[@]}"; do
  if [[ -f "$f" || -d "$f" ]]; then
    git add "$f"
  else
    echo "Warning: $f not present, skipping."
  fi
done

# Commit
git commit -F "$COMMIT_MSG_FILE" || {
  echo "No changes to commit or commit failed."
  exit 1
}

# Push branch
git push -u origin "$BRANCH"

# If VERSION was not set, stop here
if [[ "$VERSION" == "vX.Y.Z" ]]; then
  echo "Tag VERSION is still the placeholder 'vX.Y.Z'."
  echo "Set VERSION environment variable to a real tag and re-run to create/push tag and release."
  exit 0
fi

# Create and push tag
git tag -a "$VERSION" -F "$COMMIT_MSG_FILE"
git push origin "$VERSION"

# Create GitHub release using gh CLI if available
if command -v gh >/dev/null 2>&1; then
  echo "Creating GitHub release $VERSION using gh CLI..."
  # Use RELEASE_NOTES.md if present; fallback to commit message file
  if [[ -f "RELEASE_NOTES.md" ]]; then
    gh release create "$VERSION" --title "Configuration & docs: add .env.example and document oauth2" --notes-file RELEASE_NOTES.md
  else
    gh release create "$VERSION" --title "Configuration & docs: add .env.example and document oauth2" --notes-file "$COMMIT_MSG_FILE"
  fi
  echo "GitHub release created."
else
  echo "gh CLI not found. Create a release manually or install GitHub CLI."
  echo "Manual release suggestion:"
  echo "  git tag -a $VERSION -F $COMMIT_MSG_FILE"
  echo "  git push origin $VERSION"
  echo "  Use GitHub UI or 'gh release create' to publish release notes."
fi

echo "Done."
