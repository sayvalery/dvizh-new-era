#!/bin/bash
# Safe build pipeline: dev branch → build → validate → deploy to VPS.
# Always builds from the `dev` branch (git pull before build).
# Keeps last N versions on remote for rollback.
# Old site stays live if anything fails.
set -euo pipefail

cd "$(dirname "$0")/.."

# --- Config ---
SOURCE_BRANCH="dev"
CMS_HOST="${CMS_HOST:-cms.dvizh-new-era.orb.local}"
CMS_URL="http://${CMS_HOST}:3002"
DIST_DIR="apps/web/dist"
PREV_DIR="apps/web/dist-prev"
LOG_FILE="logs/deploy.log"
STATUS_FILE="logs/build-status.json"
BUILD_ID="$(date '+%Y%m%d-%H%M%S')"

# Remote deploy config (load from .env.deploy)
if [ -f ".env.deploy" ]; then
  set -a; source .env.deploy; set +a
fi
REMOTE_HOST="${REMOTE_HOST:?REMOTE_HOST not set. Create .env.deploy with REMOTE_HOST=user@ip}"
REMOTE_DEPLOYS="/var/www/dvizh/deploys"
REMOTE_CURRENT="/var/www/dvizh/current"
KEEP_DEPLOYS=5  # keep last N builds on remote

# --- Helpers ---
mkdir -p logs

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$BUILD_ID] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

notify() {
  local level=$1
  local message=$2
  log "[$level] $message"
  # Telegram (uncomment when bot is ready):
  # if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  #   curl -sf "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  #     -d chat_id="$TELEGRAM_CHAT_ID" -d text="[$level] $message" > /dev/null 2>&1
  # fi
}

update_status() {
  local status=$1
  local step=$2
  local step_status=$3
  local error="${4:-}"
  local pages="${5:-0}"

  # Build steps JSON by merging with existing
  local steps_json="{}"
  if [ -f "$STATUS_FILE" ]; then
    steps_json=$(python3 -c "
import json, sys
try:
    d = json.load(open('$STATUS_FILE'))
    steps = d.get('steps', {})
except: steps = {}
steps['$step'] = '$step_status'
print(json.dumps(steps))
" 2>/dev/null || echo "{\"$step\":\"$step_status\"}")
  else
    steps_json="{\"$step\":\"$step_status\"}"
  fi

  local error_json="null"
  if [ -n "$error" ]; then
    error_json="\"$error\""
  fi

  cat > "$STATUS_FILE" << EOF
{
  "build_id": "$BUILD_ID",
  "status": "$status",
  "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "pages_count": $pages,
  "error": $error_json,
  "steps": $steps_json
}
EOF
}

rollback() {
  if [ -d "$PREV_DIR" ]; then
    log "Rolling back: restoring previous dist"
    rm -rf "$DIST_DIR"
    mv "$PREV_DIR" "$DIST_DIR"
    log "Rollback complete"
  fi
}

# --- Pipeline ---

log "=== Build $BUILD_ID started ==="

# Reset status file for new build
cat > "$STATUS_FILE" << EOF
{
  "build_id": "$BUILD_ID",
  "status": "building",
  "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "pages_count": 0,
  "error": null,
  "steps": {}
}
EOF

# Step 0: Sync dev branch
update_status "building" "git_sync" "active"
log "Syncing $SOURCE_BRANCH branch..."

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
  log "Switching from '$CURRENT_BRANCH' to '$SOURCE_BRANCH'"
  if ! git checkout "$SOURCE_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    log "FAILED: Cannot switch to $SOURCE_BRANCH"
    update_status "failed" "git_sync" "failed" "Cannot switch to $SOURCE_BRANCH branch"
    notify "ERROR" "Build $BUILD_ID failed: cannot checkout $SOURCE_BRANCH"
    exit 1
  fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  log "WARNING: Uncommitted changes detected, building current state"
fi

# Pull latest from remote
if ! git pull origin "$SOURCE_BRANCH" --ff-only 2>&1 | tee -a "$LOG_FILE"; then
  log "WARNING: git pull failed (possible divergence), building current state"
fi

GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
log "Building from $SOURCE_BRANCH @ $GIT_SHA"
update_status "building" "git_sync" "done"

# Step 1: CMS check
update_status "building" "cms_check" "active"
log "Checking CMS at $CMS_URL ..."

if ! curl -sf --max-time 10 "$CMS_URL/api/blog-posts?limit=1" > /dev/null 2>&1; then
  log "FAILED: CMS not responding at $CMS_URL"
  update_status "failed" "cms_check" "failed" "CMS not responding"
  notify "ERROR" "Build $BUILD_ID failed: CMS not responding"
  exit 1
fi
update_status "building" "cms_check" "done"
log "CMS OK"

# Step 2: Build
update_status "building" "build" "active"
log "Building..."

# Count pages in current dist (for regression check)
PREV_COUNT=0
if [ -d "$DIST_DIR" ]; then
  PREV_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
fi
log "Previous page count: $PREV_COUNT"

# Back up current dist before build overwrites it
if [ -d "$DIST_DIR" ]; then
  rm -rf "$PREV_DIR"
  cp -a "$DIST_DIR" "$PREV_DIR"
  log "Backed up dist to dist-prev"
fi

# Build (Astro writes to dist/)
if ! CMS_URL="$CMS_URL" pnpm --filter web build 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: Build error"
  update_status "failed" "build" "failed" "Astro build failed"
  notify "ERROR" "Build $BUILD_ID failed: Astro build error"
  rollback
  exit 1
fi

if [ ! -d "$DIST_DIR" ]; then
  log "FAILED: dist directory not found after build"
  update_status "failed" "build" "failed" "Build output missing"
  notify "ERROR" "Build $BUILD_ID failed: dist directory missing"
  rollback
  exit 1
fi

update_status "building" "build" "done"
log "Build complete"

# Step 3: Validate
update_status "building" "validate" "active"
log "Validating build..."

if ! bash scripts/validate-build.sh "$DIST_DIR" "$PREV_COUNT" 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: Validation errors"
  update_status "failed" "validate" "failed" "Validation errors"
  notify "ERROR" "Build $BUILD_ID failed: validation errors"
  rollback
  exit 1
fi

NEW_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
update_status "building" "validate" "done" "" "$NEW_COUNT"
log "Validation passed: $NEW_COUNT pages"

# Step 4: Deploy to remote VPS
update_status "building" "deploy" "active" "" "$NEW_COUNT"
log "Deploying to remote ($REMOTE_HOST)..."

# Clean up local backup (no longer needed)
rm -rf "$PREV_DIR"

# Create remote deploy directory
if ! ssh "$REMOTE_HOST" "mkdir -p $REMOTE_DEPLOYS/$BUILD_ID" 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: Cannot create remote deploy directory"
  update_status "failed" "deploy" "failed" "SSH connection failed"
  notify "ERROR" "Build $BUILD_ID failed: cannot connect to remote"
  exit 1
fi

# Rsync dist to remote
log "Syncing $NEW_COUNT pages to remote..."
if ! rsync -az --delete "$DIST_DIR/" "$REMOTE_HOST:$REMOTE_DEPLOYS/$BUILD_ID/" 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: rsync failed"
  update_status "failed" "deploy" "failed" "rsync failed"
  notify "ERROR" "Build $BUILD_ID failed: rsync error"
  ssh "$REMOTE_HOST" "rm -rf $REMOTE_DEPLOYS/$BUILD_ID" 2>/dev/null
  exit 1
fi

# Switch symlink + reload nginx + cleanup old deploys (atomic)
if ! ssh "$REMOTE_HOST" "ln -sfn $REMOTE_DEPLOYS/$BUILD_ID $REMOTE_CURRENT && nginx -s reload && echo 'Symlink switched to $BUILD_ID'" 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: symlink switch failed"
  update_status "failed" "deploy" "failed" "Symlink switch failed"
  notify "ERROR" "Build $BUILD_ID failed: symlink switch error"
  exit 1
fi

# Cleanup: keep only last N deploys on remote
ssh "$REMOTE_HOST" "cd $REMOTE_DEPLOYS && ls -1t | tail -n +$((KEEP_DEPLOYS + 1)) | xargs -r rm -rf" 2>/dev/null
log "Remote cleanup: keeping last $KEEP_DEPLOYS deploys"

# Also reload local nginx if running (for dvizh.cc local access)
if docker compose -f docker-compose.prod.yml ps --status running nginx 2>/dev/null | grep -q nginx; then
  docker compose -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || true
  log "Local nginx reloaded"
fi

update_status "success" "deploy" "done" "" "$NEW_COUNT"
log "=== Build $BUILD_ID SUCCESS: $NEW_COUNT pages from $SOURCE_BRANCH@$GIT_SHA deployed ==="
notify "INFO" "Build $BUILD_ID success: $NEW_COUNT pages ($SOURCE_BRANCH@$GIT_SHA) deployed to $REMOTE_HOST"

# Step 5: Update main branch (production record)
# Uses dev:main push — no branch switching, no checkout risks.
# If main has diverged (non-fast-forward), push is safely rejected.
log "Updating main branch to match deployed state..."
if git push origin "$SOURCE_BRANCH":main 2>&1 | tee -a "$LOG_FILE"; then
  log "Main branch updated (production = $GIT_SHA)"
else
  log "WARNING: Could not update main branch — manual sync may be needed"
fi

echo ""
echo "Build $BUILD_ID complete: $NEW_COUNT pages ($SOURCE_BRANCH@$GIT_SHA) deployed"
