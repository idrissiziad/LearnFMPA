#!/usr/bin/env bash
# Set the actual free daily limit for enforcement.
# Usage: ./scripts/set_free_limit.sh <number>
# Example: ./scripts/set_free_limit.sh 200

set -euo pipefail

TARGET_FILE="src/app/modules/[id]/page.tsx"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <number>"
  echo "Example: $0 200"
  exit 1
fi

LIMIT="$1"

if ! [[ "$LIMIT" =~ ^[0-9]+$ ]]; then
  echo "Error: '$LIMIT' is not a valid number."
  exit 1
fi

if ! grep -q "const FREE_DAILY_LIMIT = " "$TARGET_FILE"; then
  echo "Error: FREE_DAILY_LIMIT constant not found in $TARGET_FILE"
  exit 1
fi

CURRENT=$(grep -oP 'const FREE_DAILY_LIMIT = \K[0-9]+' "$TARGET_FILE")

if [ "$CURRENT" = "$LIMIT" ]; then
  echo "FREE_DAILY_LIMIT is already set to $LIMIT. No change needed."
  exit 0
fi

sed -i "s/const FREE_DAILY_LIMIT = $CURRENT/const FREE_DAILY_LIMIT = $LIMIT/" "$TARGET_FILE"
echo "FREE_DAILY_LIMIT updated from $CURRENT to $LIMIT in $TARGET_FILE"