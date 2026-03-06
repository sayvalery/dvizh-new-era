#!/bin/bash
# Rollback to a previous deploy on the remote VPS.
# Usage:
#   bash scripts/rollback-remote.sh          # rollback to previous version
#   bash scripts/rollback-remote.sh list      # list available versions
#   bash scripts/rollback-remote.sh <build-id> # rollback to specific version
set -euo pipefail

cd "$(dirname "$0")/.."

# Load deploy config
if [ -f ".env.deploy" ]; then
  set -a; source .env.deploy; set +a
fi
REMOTE_HOST="${REMOTE_HOST:?REMOTE_HOST not set. Create .env.deploy with REMOTE_HOST=user@ip}"
REMOTE_DEPLOYS="/var/www/dvizh/deploys"
REMOTE_CURRENT="/var/www/dvizh/current"

# Get current active deploy
CURRENT=$(ssh "$REMOTE_HOST" "readlink $REMOTE_CURRENT | xargs basename" 2>/dev/null || echo "unknown")

# List available deploys
DEPLOYS=$(ssh "$REMOTE_HOST" "ls -1t $REMOTE_DEPLOYS" 2>/dev/null)

if [ "${1:-}" = "list" ]; then
  echo "Available deploys (newest first):"
  echo "$DEPLOYS" | while read -r d; do
    if [ "$d" = "$CURRENT" ]; then
      echo "  * $d  (active)"
    else
      echo "    $d"
    fi
  done
  exit 0
fi

if [ -n "${1:-}" ]; then
  TARGET="$1"
else
  # Find the deploy before current
  TARGET=$(echo "$DEPLOYS" | grep -A1 "^${CURRENT}$" | tail -1)
  if [ -z "$TARGET" ] || [ "$TARGET" = "$CURRENT" ]; then
    echo "No previous deploy to rollback to."
    exit 1
  fi
fi

# Verify target exists
if ! ssh "$REMOTE_HOST" "[ -d $REMOTE_DEPLOYS/$TARGET ]"; then
  echo "Deploy $TARGET not found on remote."
  exit 1
fi

echo "Rolling back: $CURRENT → $TARGET"
ssh "$REMOTE_HOST" "ln -sfn $REMOTE_DEPLOYS/$TARGET $REMOTE_CURRENT && nginx -s reload"
echo "Rollback complete. Active deploy: $TARGET"
