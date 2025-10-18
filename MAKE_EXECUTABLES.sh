#!/usr/bin/env bash
set -euo pipefail
# Makes helper scripts executable for local use
chmod +x ./PUBLISH_TO_NPM.sh || true
chmod +x ./GIT_CMDS.sh || true
echo "Made PUBLISH_TO_NPM.sh and GIT_CMDS.sh executable (if present)."
