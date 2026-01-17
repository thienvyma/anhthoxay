#!/usr/bin/env bash
set -euo pipefail

echo "Checking for hardcoded Firebase API keys in source..."
# search common source dirs but ignore node_modules, dist
if grep -R --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git -n "AIza" .; then
  echo "ERROR: Found potential hardcoded Firebase API key(s). Aborting."
  exit 1
fi

echo "No hardcoded apiKey found in source."
exit 0


