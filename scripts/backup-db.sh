#!/usr/bin/env bash
# Backs up the dvizh Postgres DB + CMS media with GFS rotation and anti-zeroing safety.
#
# Triggers:
#   - Daily via LaunchAgent com.dvizh.dbbackup
#   - At the start of scripts/build-site.sh (snapshot before every prod deploy)
#
# What it does:
#   1. pg_dump -Fc the whole DB -> ~/dvizh-backups/auto/<ts>/dvizh-db.dump (small, ~2 MB)
#   2. Incremental rsync of CMS media -> ~/dvizh-backups/media-mirror/ (NOT a full tar each run)
#   3. SANITY CHECK: count form_submissions rows in the fresh dump. If it dropped below the
#      last known-good count, or the dump is suspiciously small -> DO NOT rotate, raise alert.
#   4. Append-only export of form_submissions -> ~/dvizh-backups/leads-export.csv
#      (this file is NEVER touched by rotation — the last line of defence for leads/PII).
#   5. GFS rotation: 7 daily + 4 weekly + 6 monthly. Only runs if sanity check passed.
#   6. rsync local backups -> VPS (/var/backups/dvizh, root-only, NOT served by nginx).
#
# Telegram alerts use TELEGRAM_BOT_TOKEN (from env / .env.bot) — see notify_alert().
#
# Usage: bash scripts/backup-db.sh [--reason <label>]
#   --reason  optional label recorded in the snapshot (e.g. "pre-deploy", "daily")
#
# Exit codes: 0 = ok (rotation may be skipped on sanity failure but that is not fatal
#   for the deploy pipeline — the fresh dump is always written first). 1 = dump failed.

set -euo pipefail

cd "$(dirname "$0")/.."
REPO_DIR="$(pwd)"

# --- Config ---
PG_CONTAINER="dvizh-new-era-postgres-1"
CMS_CONTAINER="dvizh-new-era-cms-1"
PG_USER="dvizh"
PG_DB="dvizh"

BACKUP_ROOT="${BACKUP_ROOT:-$HOME/dvizh-backups}"
AUTO_DIR="$BACKUP_ROOT/auto"                 # rotated automatic snapshots
MEDIA_MIRROR="$BACKUP_ROOT/media-mirror"     # incremental rsync target (single mirror)
LEADS_CSV="$BACKUP_ROOT/leads-export.csv"    # append-only, never rotated
STATE_FILE="$BACKUP_ROOT/.backup-state.json" # last known-good metrics
LOG_FILE="$REPO_DIR/logs/backup-db.log"

# GFS retention
KEEP_DAILY=7
KEEP_WEEKLY=4
KEEP_MONTHLY=6

# A healthy dump is at least this many bytes. Below this => suspicious (empty/broken DB).
MIN_DUMP_BYTES="${MIN_DUMP_BYTES:-100000}"   # 100 KB floor (real dump is ~2 MB)

TS="$(date '+%Y%m%d-%H%M%S')"
REASON="auto"

while [ $# -gt 0 ]; do
  case "$1" in
    --reason) REASON="${2:-auto}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; shift ;;
  esac
done

SNAP_DIR="$AUTO_DIR/$TS-$REASON"

# Remote (VPS) config — reuse .env.deploy (REMOTE_HOST=root@ip)
if [ -f ".env.deploy" ]; then
  set -a; source .env.deploy; set +a
fi
# Bot token for alerts — from env (docker) or .env.bot (host)
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] && [ -f ".env.bot" ]; then
  set -a; source .env.bot; set +a
fi
REMOTE_BACKUP_DIR="/var/backups/dvizh"

mkdir -p "$REPO_DIR/logs" "$AUTO_DIR" "$MEDIA_MIRROR"

# --- Helpers ---
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$TS] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# Alert to Telegram owner/allowed chats. Never fatal.
# We don't have access to the Payload allowlist here, so we use TELEGRAM_ALERT_CHAT_ID
# (set in env/.env.bot to the owner chat) if present. The monitor/bot track owns the
# canonical allowlist; this is a best-effort independent alert channel for backups.
notify_alert() {
  local text="🛑 [backup] $1"
  log "ALERT: $1"
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_ALERT_CHAT_ID:-}" ]; then
    curl -sf --max-time 10 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_ALERT_CHAT_ID}" \
      -d text="$text" > /dev/null 2>&1 || log "WARN: Telegram alert failed to send"
  else
    log "WARN: TELEGRAM_BOT_TOKEN/TELEGRAM_ALERT_CHAT_ID not set — alert only logged"
  fi
}

# Read a numeric field from the JSON state file (jq-free, python3).
read_state() {
  local key="$1" default="$2"
  if [ -f "$STATE_FILE" ]; then
    python3 -c "
import json,sys
try:
    d=json.load(open('$STATE_FILE'))
    print(d.get('$key', $default))
except Exception:
    print($default)
" 2>/dev/null || echo "$default"
  else
    echo "$default"
  fi
}

write_state() {
  local rows="$1" bytes="$2"
  python3 -c "
import json
json.dump({'last_good_rows': int($rows), 'last_good_bytes': int($bytes), 'updated': '$TS'}, open('$STATE_FILE','w'))
" 2>/dev/null || true
}

log "=== Backup $TS ($REASON) started ==="

# --- Step 0: container present? ---
if ! docker inspect "$PG_CONTAINER" > /dev/null 2>&1; then
  log "FAILED: Postgres container '$PG_CONTAINER' not found"
  notify_alert "Postgres container '$PG_CONTAINER' not found — backup aborted"
  exit 1
fi

# --- Step 1: DB dump (-Fc custom format) ---
mkdir -p "$SNAP_DIR"
DUMP_FILE="$SNAP_DIR/dvizh-db.dump"
log "Dumping DB -> $DUMP_FILE"

if ! docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -Fc "$PG_DB" > "$DUMP_FILE" 2>>"$LOG_FILE"; then
  log "FAILED: pg_dump error"
  notify_alert "pg_dump failed for DB '$PG_DB' — see logs/backup-db.log"
  rm -f "$DUMP_FILE"
  rmdir "$SNAP_DIR" 2>/dev/null || true
  exit 1
fi

DUMP_BYTES=$(wc -c < "$DUMP_FILE" | tr -d ' ')
log "Dump written: $DUMP_BYTES bytes"

# --- Step 2: count form_submissions rows in the LIVE DB (cheap, authoritative) ---
# We count from the live DB rather than parsing the custom-format dump (which is binary).
# The dump we just took reflects this same DB state.
ROWS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM form_submissions;" 2>>"$LOG_FILE" | tr -d ' ' || echo "ERR")

if ! [[ "$ROWS" =~ ^[0-9]+$ ]]; then
  log "WARN: could not count form_submissions (got '$ROWS') — treating as sanity failure"
  notify_alert "Could not read form_submissions row count — NOT rotating old backups"
  ROWS="ERR"
fi
log "form_submissions rows (live): $ROWS"

# --- Step 3: append-only leads export (CSV). NEVER rotated. ---
# Snapshot of the whole table each run, appended with a backup-timestamp column.
# Even if rotation/anti-zeroing ever fails, this file accumulates every lead ever seen.
if [[ "$ROWS" =~ ^[0-9]+$ ]] && [ "$ROWS" -gt 0 ]; then
  if [ ! -f "$LEADS_CSV" ]; then
    # header once
    docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
      "\copy (SELECT now() AS backup_at, * FROM form_submissions ORDER BY id) TO STDOUT WITH CSV HEADER" \
      >> "$LEADS_CSV" 2>>"$LOG_FILE" \
      && log "Leads CSV initialised: $LEADS_CSV" \
      || log "WARN: leads CSV init failed"
  else
    docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
      "\copy (SELECT now() AS backup_at, * FROM form_submissions ORDER BY id) TO STDOUT WITH CSV" \
      >> "$LEADS_CSV" 2>>"$LOG_FILE" \
      && log "Leads appended to CSV ($ROWS rows)" \
      || log "WARN: leads CSV append failed"
  fi
else
  log "Skipping leads CSV (no rows or count unavailable) — append-only file untouched"
fi

# --- Step 4: incremental media rsync (no full tar each run) ---
if docker inspect "$CMS_CONTAINER" > /dev/null 2>&1; then
  log "Syncing CMS media (incremental) -> $MEDIA_MIRROR"
  # docker cp the media dir into a staging area, then rsync into the persistent mirror.
  # (docker cp has no incremental mode; rsync does the dedup against the mirror.)
  STAGE="$(mktemp -d "${TMPDIR:-/tmp}/dvizh-media.XXXXXX")"
  if docker cp "$CMS_CONTAINER:/app/apps/cms/media/." "$STAGE/" 2>>"$LOG_FILE"; then
    rsync -a --delete "$STAGE/" "$MEDIA_MIRROR/" 2>>"$LOG_FILE" \
      && log "Media mirror updated" \
      || log "WARN: media rsync to mirror failed"
  else
    log "WARN: docker cp of media failed — mirror not updated this run"
  fi
  rm -rf "$STAGE"
else
  log "WARN: CMS container '$CMS_CONTAINER' not found — skipping media sync"
fi

# --- Step 5: SANITY CHECK before any rotation ---
LAST_GOOD_ROWS=$(read_state "last_good_rows" 0)
SANITY_OK=1
SANITY_MSG=""

if [ "$DUMP_BYTES" -lt "$MIN_DUMP_BYTES" ]; then
  SANITY_OK=0
  SANITY_MSG="dump suspiciously small: $DUMP_BYTES bytes (< $MIN_DUMP_BYTES)"
fi

if [[ "$ROWS" =~ ^[0-9]+$ ]]; then
  if [ "$ROWS" -lt "$LAST_GOOD_ROWS" ]; then
    SANITY_OK=0
    SANITY_MSG="${SANITY_MSG:+$SANITY_MSG; }form_submissions dropped: $ROWS < last good $LAST_GOOD_ROWS"
  fi
else
  SANITY_OK=0
  SANITY_MSG="${SANITY_MSG:+$SANITY_MSG; }could not verify form_submissions count"
fi

if [ "$SANITY_OK" -eq 0 ]; then
  log "SANITY CHECK FAILED: $SANITY_MSG"
  log "Keeping ALL existing backups (rotation SKIPPED). Fresh snapshot kept at $SNAP_DIR for inspection."
  notify_alert "Sanity check FAILED: $SANITY_MSG. Old backups preserved, rotation skipped."
  # Do not update last-good state on a bad run.
else
  log "Sanity check passed (rows=$ROWS >= last good $LAST_GOOD_ROWS, dump=$DUMP_BYTES bytes)"
  write_state "$ROWS" "$DUMP_BYTES"

  # --- GFS rotation (only on healthy runs) ---
  # Promote the freshest snapshot into daily/weekly/monthly cohorts by tagging,
  # then prune each cohort independently. We tag by symlink-free naming convention:
  # snapshots live flat in auto/; we classify by date and keep the newest per slot.
  log "Applying GFS rotation: ${KEEP_DAILY}d / ${KEEP_WEEKLY}w / ${KEEP_MONTHLY}m"
  python3 - "$AUTO_DIR" "$KEEP_DAILY" "$KEEP_WEEKLY" "$KEEP_MONTHLY" <<'PYROT' 2>>"$LOG_FILE" || log "WARN: rotation step errored (backups preserved)"
import os, sys, re, shutil
from datetime import datetime

auto_dir, keep_d, keep_w, keep_m = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])

# Collect snapshot dirs named YYYYMMDD-HHMMSS-<reason>
entries = []
pat = re.compile(r'^(\d{8})-(\d{6})')
for name in os.listdir(auto_dir):
    full = os.path.join(auto_dir, name)
    if not os.path.isdir(full):
        continue
    m = pat.match(name)
    if not m:
        continue
    try:
        dt = datetime.strptime(m.group(1) + m.group(2), '%Y%m%d%H%M%S')
    except ValueError:
        continue
    entries.append((dt, name, full))

entries.sort(key=lambda e: e[0], reverse=True)  # newest first

keep = set()

# Daily: newest snapshot per calendar day, keep most recent KEEP_DAILY days.
seen_days, days = set(), []
for dt, name, full in entries:
    day = dt.strftime('%Y%m%d')
    if day not in seen_days:
        seen_days.add(day); days.append((day, name))
for day, name in days[:keep_d]:
    keep.add(name)

# Weekly: newest per ISO week, keep KEEP_WEEKLY weeks.
seen_w, weeks = set(), []
for dt, name, full in entries:
    wk = dt.strftime('%G-%V')
    if wk not in seen_w:
        seen_w.add(wk); weeks.append((wk, name))
for wk, name in weeks[:keep_w]:
    keep.add(name)

# Monthly: newest per month, keep KEEP_MONTHLY months.
seen_m, months = set(), []
for dt, name, full in entries:
    mo = dt.strftime('%Y%m')
    if mo not in seen_m:
        seen_m.add(mo); months.append((mo, name))
for mo, name in months[:keep_m]:
    keep.add(name)

# Always keep the single newest snapshot no matter what.
if entries:
    keep.add(entries[0][1])

removed = 0
for dt, name, full in entries:
    if name not in keep:
        shutil.rmtree(full, ignore_errors=True)
        removed += 1
        print(f"rotated out: {name}")
print(f"rotation kept {len(keep)} snapshots, removed {removed}")
PYROT
fi

# --- Step 6: rsync local auto backups -> VPS (root-only, not via nginx) ---
if [ -n "${REMOTE_HOST:-}" ]; then
  log "Replicating backups to VPS ($REMOTE_HOST:$REMOTE_BACKUP_DIR)"
  if ssh "$REMOTE_HOST" "mkdir -p $REMOTE_BACKUP_DIR && chmod 700 $REMOTE_BACKUP_DIR" 2>>"$LOG_FILE"; then
    # Mirror the rotated auto/ tree + the append-only leads CSV. Media mirror is large;
    # include it too so the VPS has a full offsite copy.
    rsync -az --delete "$AUTO_DIR/" "$REMOTE_HOST:$REMOTE_BACKUP_DIR/auto/" 2>>"$LOG_FILE" \
      && log "VPS: auto/ replicated" || { log "WARN: VPS auto/ rsync failed"; notify_alert "VPS backup replication (auto/) failed"; }
    rsync -az "$LEADS_CSV" "$REMOTE_HOST:$REMOTE_BACKUP_DIR/leads-export.csv" 2>>"$LOG_FILE" \
      && log "VPS: leads CSV replicated" || log "WARN: VPS leads CSV rsync failed"
    rsync -az --delete "$MEDIA_MIRROR/" "$REMOTE_HOST:$REMOTE_BACKUP_DIR/media-mirror/" 2>>"$LOG_FILE" \
      && log "VPS: media mirror replicated" || log "WARN: VPS media rsync failed"
    # Tighten perms — PII lives here.
    ssh "$REMOTE_HOST" "chmod -R go-rwx $REMOTE_BACKUP_DIR" 2>>"$LOG_FILE" || true
  else
    log "WARN: cannot prepare VPS backup dir — offsite copy skipped"
    notify_alert "Could not reach VPS for offsite backup replication"
  fi
else
  log "REMOTE_HOST not set — skipping VPS replication"
fi

log "=== Backup $TS ($REASON) complete: snapshot=$SNAP_DIR rows=$ROWS bytes=$DUMP_BYTES sanity=$([ "$SANITY_OK" -eq 1 ] && echo OK || echo FAIL) ==="
exit 0
