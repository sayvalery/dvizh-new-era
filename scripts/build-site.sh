#!/bin/bash
# Safe build pipeline: dev branch → build → validate → deploy to VPS.
# Always builds from the `dev` branch (git pull before build).
# Keeps last N versions on remote for rollback.
# Old site stays live if anything fails.
set -euo pipefail

cd "$(dirname "$0")/.."

# --- Config ---
SOURCE_BRANCH="dev"
# Источник кода — GitLab (корпоративный). GitHub (origin) оставлен только как
# исторический архив, в него больше не пушат. Переопределяется через env.
SOURCE_REMOTE="${SOURCE_REMOTE:-gitlab}"
# 127.0.0.1 (опубликованный порт), а НЕ cms.*.orb.local: Node не достаёт IP контейнера
# OrbStack (EHOSTUNREACH), хотя curl достаёт. Через .orb.local билд молча пустой.
CMS_HOST="${CMS_HOST:-127.0.0.1}"
CMS_URL="http://${CMS_HOST}:3002"
DIST_DIR="apps/web/dist"
PREV_DIR="apps/web/dist-prev"
LOG_FILE="logs/deploy.log"
STATUS_FILE="logs/build-status.json"
BASELINE_FILE="logs/last-good-pages.txt"  # число страниц последнего УСПЕШНО задеплоенного билда
BUILD_ID="$(date '+%Y%m%d-%H%M%S')"

# Remote deploy config (load from .env.deploy)
if [ -f ".env.deploy" ]; then
  set -a; source .env.deploy; set +a
fi

# Абсолютный минимум страниц — страховка на случай, когда эталона ещё нет
# (первый запуск после этой правки, свежий клон: logs/ в .gitignore).
# Исторический размер сайта — 510–580 страниц, так что 400 отсекает обвал
# (сломанный билд на 41 страницу), но не мешает легитимной чистке разделов.
# Переопределяется через env или .env.deploy: MIN_PAGES_FLOOR=...
MIN_PAGES_FLOOR="${MIN_PAGES_FLOOR:-400}"
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

# Определяет эталон числа страниц (BASELINE_COUNT) для проверки на обвал.
#
# Почему НЕ «сколько index.html сейчас в dist» (как было раньше): dist сам мог быть
# собран сломанно. Один плохой билд (41 страница вместо 580) опускал порог до 41,
# и следующий такой же плохой билд спокойно проходил валидацию — защита деградировала.
# А если dist отсутствовал, порог был 0, т.е. проверка молча отключалась.
#
# Теперь эталон — снимок числа страниц последнего билда, который РЕАЛЬНО доехал до
# прода (см. запись в $BASELINE_FILE после переключения симлинка). Локальный файл,
# без сетевых запросов к VPS: деплой всегда идёт с этой машины, а состояние
# «последнего хорошего» и так уже живёт в logs/ рядом с build-status.json.
resolve_baseline() {
  BASELINE_COUNT=0
  BASELINE_SOURCE="none"

  if [ -f "$BASELINE_FILE" ]; then
    # Только цифры: мусор в файле не должен ронять арифметику под set -e
    BASELINE_COUNT="$(tr -cd '0-9' < "$BASELINE_FILE")"
    BASELINE_COUNT="${BASELINE_COUNT:-0}"
    [ "$BASELINE_COUNT" -gt 0 ] && BASELINE_SOURCE="$BASELINE_FILE"
  fi

  # Бутстрап при первом запуске: build-status.json хранит pages_count прошлого билда,
  # и он валиден как эталон только при status == success. Читать ОБЯЗАТЕЛЬНО до сброса
  # этого файла в начале пайплайна.
  if [ "$BASELINE_COUNT" -eq 0 ] && [ -f "$STATUS_FILE" ]; then
    local from_status
    from_status="$(python3 -c "
import json
try:
    d = json.load(open('$STATUS_FILE'))
    print(int(d.get('pages_count') or 0) if d.get('status') == 'success' else 0)
except Exception:
    print(0)
" 2>/dev/null || echo 0)"
    from_status="${from_status:-0}"
    if [ "$from_status" -gt 0 ]; then
      BASELINE_COUNT="$from_status"
      BASELINE_SOURCE="$STATUS_FILE (bootstrap)"
      # Сразу фиксируем в $BASELINE_FILE, иначе сброс build-status.json ниже
      # затрёт единственный источник эталона.
      echo "$BASELINE_COUNT" > "$BASELINE_FILE"
    fi
  fi
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

# Эталон читаем ДО сброса $STATUS_FILE (см. resolve_baseline)
resolve_baseline
if [ "$BASELINE_COUNT" -gt 0 ]; then
  log "Эталон страниц: $BASELINE_COUNT (источник: $BASELINE_SOURCE), порог 80% = $((BASELINE_COUNT * 80 / 100)), абсолютный минимум = $MIN_PAGES_FLOOR"
else
  notify "WARN" "Эталон числа страниц не найден (нет $BASELINE_FILE и нет успешного билда в $STATUS_FILE). На этом прогоне защита от обвала работает только по абсолютному минимуму = $MIN_PAGES_FLOOR страниц; эталон запишется после первого успешного деплоя"
fi

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
if ! git pull "$SOURCE_REMOTE" "$SOURCE_BRANCH" --ff-only 2>&1 | tee -a "$LOG_FILE"; then
  log "WARNING: git pull failed (possible divergence), building current state"
fi

GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
log "Building from $SOURCE_REMOTE/$SOURCE_BRANCH @ $GIT_SHA"
update_status "building" "git_sync" "done"

# Step 1: CMS check
update_status "building" "cms_check" "active"
log "Checking CMS at $CMS_URL ..."

# Проверяем ИМЕННО через node (undici), а не curl: curl достаёт IP контейнера OrbStack,
# а Node — нет, поэтому curl-гейт проходил, а билд молча собирался без CMS-контента.
# Заодно требуем totalDocs > 0: payload.ts при сбое отдаёт {docs: []} и билд «успешен».
if ! CMS_CHECK_ERR="$(node -e '
fetch(process.argv[1], { signal: AbortSignal.timeout(10000) })
  .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
  .then(j => { if (!j.totalDocs) throw new Error("totalDocs=0 (CMS пустая или отдаёт заглушку)") })
  .catch(e => { console.error(e.cause ? e.cause.code || e.cause.message : e.message); process.exit(1) })
' "$CMS_URL/api/blog-posts?limit=1" 2>&1)"; then
  log "FAILED: CMS check failed at $CMS_URL — $CMS_CHECK_ERR"
  update_status "failed" "cms_check" "failed" "CMS check failed: $CMS_CHECK_ERR"
  notify "ERROR" "Build $BUILD_ID failed: CMS check ($CMS_CHECK_ERR)"
  exit 1
fi
update_status "building" "cms_check" "done"
log "CMS OK"

# Step 1.5: Pre-deploy DB backup snapshot (safety net before any prod change)
# Non-fatal: a backup hiccup must never block a deploy. backup-db.sh logs/alerts itself.
update_status "building" "db_backup" "active"
log "Taking pre-deploy DB backup snapshot..."
if bash scripts/backup-db.sh --reason "pre-deploy" 2>&1 | tee -a "$LOG_FILE"; then
  update_status "building" "db_backup" "done"
  log "Pre-deploy backup OK"
else
  log "WARNING: pre-deploy backup reported a problem (continuing deploy)"
  update_status "building" "db_backup" "skipped"
  notify "WARN" "Build $BUILD_ID: pre-deploy DB backup reported a problem (see backup-db.log)"
fi

# Step 2: Build
update_status "building" "build" "active"
log "Building..."

# Число страниц в текущем dist — ТОЛЬКО для лога/диагностики.
# Эталоном для проверки на обвал он больше не является (см. resolve_baseline).
DIST_COUNT=0
if [ -d "$DIST_DIR" ]; then
  DIST_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
fi
log "Pages in current dist: $DIST_COUNT (эталон для валидации: $BASELINE_COUNT)"

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

# Step 2.5: Copy CMS media files to dist (so VPS serves them as static assets)
update_status "building" "media_copy" "active"
log "Copying CMS media to dist/api/media/file/ ..."

CMS_CONTAINER="dvizh-new-era-cms-1"
MEDIA_DST="$DIST_DIR/api/media/file"
mkdir -p "$MEDIA_DST"

if docker inspect "$CMS_CONTAINER" > /dev/null 2>&1; then
  if docker cp "$CMS_CONTAINER:/app/apps/cms/media/." "$MEDIA_DST/" 2>&1 | tee -a "$LOG_FILE"; then
    MEDIA_COUNT=$(ls "$MEDIA_DST" | wc -l | tr -d ' ')
    update_status "building" "media_copy" "done"
    log "Media copy OK: $MEDIA_COUNT files in dist/api/media/file/"
  else
    log "WARNING: docker cp failed — images may not load on VPS"
    update_status "building" "media_copy" "skipped"
  fi
else
  log "WARNING: CMS container not found — images may not load on VPS"
  update_status "building" "media_copy" "skipped"
fi

# Step 3: Validate
update_status "building" "validate" "active"
log "Validating build..."

if ! bash scripts/validate-build.sh "$DIST_DIR" "$BASELINE_COUNT" "$MIN_PAGES_FLOOR" 2>&1 | tee -a "$LOG_FILE"; then
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

# Эталон двигаем ТОЛЬКО здесь — после того как деплой реально доехал
# (rsync + переключение симлинка + reload nginx). Сломанный или не доехавший
# до прода билд эталон не понижает, поэтому защита не деградирует.
echo "$NEW_COUNT" > "$BASELINE_FILE"
log "Эталон страниц обновлён: $NEW_COUNT → $BASELINE_FILE"

update_status "success" "deploy" "done" "" "$NEW_COUNT"
log "=== Build $BUILD_ID SUCCESS: $NEW_COUNT pages from $SOURCE_BRANCH@$GIT_SHA deployed ==="
notify "INFO" "Build $BUILD_ID success: $NEW_COUNT pages ($SOURCE_BRANCH@$GIT_SHA) deployed to $REMOTE_HOST"

echo ""
echo "Build $BUILD_ID complete: $NEW_COUNT pages ($SOURCE_BRANCH@$GIT_SHA) deployed"
