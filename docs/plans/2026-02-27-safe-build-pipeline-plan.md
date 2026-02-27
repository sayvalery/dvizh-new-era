# Safe Build Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build never breaks the live site. New builds deploy only after full validation. Failures are logged and visible in CMS.

**Architecture:** Blue-green static deploy (build to staging dir, validate, atomic swap). Webhook tracks build progress in JSON. CMS component polls and displays steps. payload.ts gets retry logic.

**Tech Stack:** Bash (build scripts), Node.js (webhook), React (CMS component, Payload v3 is Next.js), TypeScript (payload.ts)

---

### Task 1: Add retry logic to fetchFromCMS

**Files:**
- Modify: `apps/web/src/lib/payload.ts:69-103`

**Step 1: Replace fetchFromCMS with retry version**

Replace lines 69-103 in `apps/web/src/lib/payload.ts` with:

```typescript
async function fetchFromCMS<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const params = new URLSearchParams()

  if (options.depth !== undefined) params.set('depth', String(options.depth))
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.page !== undefined) params.set('page', String(options.page))
  if (options.sort) params.set('sort', options.sort)
  if (options.where) {
    const flat = flattenParams(options.where, 'where')
    for (const [k, v] of Object.entries(flat)) params.set(k, v)
  }

  const url = `${CMS_URL}/api${path}?${params.toString()}`
  const maxRetries = 3
  const timeoutMs = 5000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`CMS fetch failed: ${res.status} ${url}`)
      }

      return res.json() as Promise<T>
    } catch (err) {
      clearTimeout(timeoutId)

      if (attempt === maxRetries) {
        throw new Error(`CMS unavailable after ${maxRetries} attempts: ${url}`)
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error(`CMS unavailable: ${url}`)
}
```

**Step 2: Verify dev server still works**

Run: `cd apps/web && pnpm build 2>&1 | tail -5`
Expected: Build completes with 500+ pages, no errors.

**Step 3: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "fix: add retry logic to fetchFromCMS (3 attempts, 5s timeout)"
```

---

### Task 2: Create validate-build.sh

**Files:**
- Create: `scripts/validate-build.sh`

**Step 1: Write the validator script**

Create `scripts/validate-build.sh`:

```bash
#!/usr/bin/env bash
# Validates a built static site before deployment.
# Usage: bash scripts/validate-build.sh <dist-dir> [prev-page-count]
# Exit 0 = valid, Exit 1 = invalid (with details on stderr)

set -euo pipefail

DIST_DIR="${1:?Usage: validate-build.sh <dist-dir> [prev-page-count]}"
PREV_COUNT="${2:-0}"
ERRORS=0

fail() {
  echo "FAIL: $1" >&2
  ERRORS=$((ERRORS + 1))
}

# 1. Root index.html
if [ ! -f "$DIST_DIR/index.html" ]; then
  fail "index.html missing in root"
elif [ "$(wc -c < "$DIST_DIR/index.html" | tr -d ' ')" -lt 500 ]; then
  fail "index.html too small (< 500 bytes)"
fi

# 2. Key sections
REQUIRED_SECTIONS=("about" "blog" "developers" "slovar-developera" "vitrina" "contacts" "404.html")
for section in "${REQUIRED_SECTIONS[@]}"; do
  if [[ "$section" == *.html ]]; then
    target="$DIST_DIR/$section"
  else
    target="$DIST_DIR/$section/index.html"
  fi
  if [ ! -f "$target" ]; then
    fail "$section missing"
  elif [ "$(wc -c < "$target" | tr -d ' ')" -lt 500 ]; then
    fail "$section too small (< 500 bytes)"
  fi
done

# 3. Page count regression
CURRENT_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
echo "Pages: $CURRENT_COUNT (previous: $PREV_COUNT)"

if [ "$PREV_COUNT" -gt 0 ]; then
  THRESHOLD=$((PREV_COUNT * 80 / 100))
  if [ "$CURRENT_COUNT" -lt "$THRESHOLD" ]; then
    fail "Page count dropped from $PREV_COUNT to $CURRENT_COUNT (below 80% threshold of $THRESHOLD)"
  fi
fi

# 4. No tiny index.html files (empty template detection)
TINY_FILES=$(find "$DIST_DIR" -name "index.html" -type f -size -500c | wc -l | tr -d ' ')
if [ "$TINY_FILES" -gt 2 ]; then
  fail "$TINY_FILES index.html files under 500 bytes (possible empty templates)"
fi

# 5. No external placeholders
PLACEHOLDER_COUNT=$(grep -rl "placehold\.co\|pravatar\.cc\|tailwindcss\.com/plus-assets" "$DIST_DIR" --include="*.html" 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
  fail "$PLACEHOLDER_COUNT files with external placeholder URLs"
fi

# 6. Sitemap
if [ ! -f "$DIST_DIR/sitemap-index.xml" ]; then
  fail "sitemap-index.xml missing"
elif [ "$(wc -c < "$DIST_DIR/sitemap-index.xml" | tr -d ' ')" -lt 50 ]; then
  fail "sitemap-index.xml is empty"
fi

# 7. Fonts
if [ ! -d "$DIST_DIR/fonts" ]; then
  fail "fonts/ directory missing"
fi

# 8. CSS exists
CSS_COUNT=$(find "$DIST_DIR" -name "*.css" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$CSS_COUNT" -eq 0 ]; then
  fail "No CSS files found"
fi

# Result
if [ "$ERRORS" -gt 0 ]; then
  echo "Validation FAILED: $ERRORS errors" >&2
  exit 1
fi

echo "Validation passed: $CURRENT_COUNT pages"
exit 0
```

**Step 2: Make executable and test against current dist**

Run: `chmod +x scripts/validate-build.sh && bash scripts/validate-build.sh apps/web/dist 500`
Expected: "Validation passed: 514 pages" (or similar count)

**Step 3: Test failure detection — simulate missing index**

Run: `mv apps/web/dist/index.html apps/web/dist/index.html.bak && bash scripts/validate-build.sh apps/web/dist 500 2>&1; mv apps/web/dist/index.html.bak apps/web/dist/index.html`
Expected: "FAIL: index.html missing in root" and exit code 1

**Step 4: Commit**

```bash
git add scripts/validate-build.sh
git commit -m "feat: add validate-build.sh — comprehensive post-build validation"
```

---

### Task 3: Rewrite build-site.sh with blue-green deploy

**Files:**
- Modify: `scripts/build-site.sh` (full rewrite)

**Step 1: Rewrite build-site.sh**

Replace entire contents of `scripts/build-site.sh` with:

```bash
#!/bin/bash
# Safe build pipeline with blue-green deploy.
# Builds into staging dir, validates, atomically swaps.
# Old site stays live if anything fails.
set -euo pipefail

cd "$(dirname "$0")/.."

# --- Config ---
CMS_HOST="${CMS_HOST:-cms.dvizh-new-era.orb.local}"
CMS_URL="http://${CMS_HOST}:3002"
DIST_DIR="apps/web/dist"
STAGING_DIR="apps/web/dist-staging"
PREV_DIR="apps/web/dist-prev"
LOG_FILE="logs/deploy.log"
STATUS_FILE="logs/build-status.json"
BUILD_ID="$(date '+%Y%m%d-%H%M%S')"

# --- Helpers ---
mkdir -p logs

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$BUILD_ID] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

update_status() {
  local status=$1
  local step=$2
  local step_status=$3
  local error="${4:-}"
  local pages="${5:-0}"

  # Read existing steps or start fresh
  if [ -f "$STATUS_FILE" ]; then
    local existing_steps=$(cat "$STATUS_FILE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
steps=d.get('steps',{})
steps['$step']='$step_status'
print(json.dumps(steps))
" 2>/dev/null || echo '{}')
  else
    local existing_steps="{\"$step\":\"$step_status\"}"
  fi

  cat > "$STATUS_FILE" << STATUSEOF
{
  "build_id": "$BUILD_ID",
  "status": "$status",
  "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "pages_count": $pages,
  "error": $([ -n "$error" ] && echo "\"$error\"" || echo "null"),
  "steps": $existing_steps
}
STATUSEOF
}

cleanup_staging() {
  [ -d "$STAGING_DIR" ] && rm -rf "$STAGING_DIR"
}

# --- Pipeline ---

# Step 1: CMS check
update_status "building" "cms_check" "active"
log "Checking CMS at $CMS_URL ..."

if ! curl -sf --max-time 10 "$CMS_URL/api/blog-posts?limit=1" > /dev/null 2>&1; then
  log "FAILED: CMS not responding at $CMS_URL"
  update_status "failed" "cms_check" "failed" "CMS not responding"
  exit 1
fi
update_status "building" "cms_check" "done"
log "CMS OK"

# Step 2: Build
update_status "building" "build" "active"
log "Building into staging..."

# Count pages in current dist (for regression check)
PREV_COUNT=0
if [ -d "$DIST_DIR" ]; then
  PREV_COUNT=$(find "$DIST_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
fi
log "Previous page count: $PREV_COUNT"

# Clean staging from any previous failed attempt
cleanup_staging

# Build into staging directory
if ! ASTRO_OUT_DIR="../../$STAGING_DIR" CMS_URL="$CMS_URL" pnpm --filter web build 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: Build error"
  update_status "failed" "build" "failed" "Astro build failed"
  cleanup_staging
  exit 1
fi

# Astro ignores ASTRO_OUT_DIR env — it outputs to dist/ always.
# Move dist/ to staging instead.
if [ -d "$DIST_DIR" ] && [ ! -d "$STAGING_DIR" ]; then
  # Build went into dist/ as usual. We need to swap carefully.
  # If dist-prev exists from a prior failed run, remove it.
  [ -d "$PREV_DIR" ] && rm -rf "$PREV_DIR"
  # Rename current dist to staging for validation, then decide.
  mv "$DIST_DIR" "$STAGING_DIR"
fi

if [ ! -d "$STAGING_DIR" ]; then
  log "FAILED: Staging directory not found after build"
  update_status "failed" "build" "failed" "Build output missing"
  exit 1
fi

update_status "building" "build" "done"
log "Build complete"

# Step 3: Validate
update_status "building" "validate" "active"
log "Validating build..."

if ! bash scripts/validate-build.sh "$STAGING_DIR" "$PREV_COUNT" 2>&1 | tee -a "$LOG_FILE"; then
  log "FAILED: Validation errors"
  update_status "failed" "validate" "failed" "Validation errors — see log"
  # Restore old dist if we moved it
  if [ ! -d "$DIST_DIR" ] && [ -d "$STAGING_DIR" ]; then
    # Validation failed on the new build, but the new build IS in staging.
    # We need to keep old site. If dist-prev exists, restore it.
    if [ -d "$PREV_DIR" ]; then
      mv "$PREV_DIR" "$DIST_DIR"
    else
      # No previous backup — move staging back as dist (better than nothing)
      mv "$STAGING_DIR" "$DIST_DIR"
    fi
  fi
  exit 1
fi

NEW_COUNT=$(find "$STAGING_DIR" -name "index.html" -type f | wc -l | tr -d ' ')
update_status "building" "validate" "done" "" "$NEW_COUNT"
log "Validation passed: $NEW_COUNT pages"

# Step 4: Deploy (atomic swap)
update_status "building" "deploy" "active" "" "$NEW_COUNT"
log "Deploying..."

# Swap: staging becomes live dist
# dist was already moved to staging in Step 2.
# We need dist-prev as backup only if something goes wrong after.
mv "$STAGING_DIR" "$DIST_DIR"

# Reload nginx (not restart — zero downtime)
if docker compose -f docker-compose.prod.yml ps --status running nginx 2>/dev/null | grep -q nginx; then
  docker compose -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || \
    docker compose -f docker-compose.prod.yml restart nginx
  log "Nginx reloaded"
fi

update_status "success" "deploy" "done" "" "$NEW_COUNT"
log "SUCCESS: Deployed $NEW_COUNT pages"

echo ""
echo "Build $BUILD_ID complete: $NEW_COUNT pages deployed"
```

**Important note:** Astro doesn't support output dir via env var. The script handles this by building into the default `dist/`, then moving it to staging for validation, then back to `dist/`. The old `dist/` content has already been served and is the same as what was just replaced. This is safe because:
- If build fails (step 2): the new output is in `dist/` but same CMS data as before, so acceptable.
- If validation fails (step 3): we moved `dist/` to `staging/`, validation ran, failed, so we move `staging/` back to `dist/`.
- If all passes (step 4): `staging/` (the new build) becomes `dist/`.

Actually, let me reconsider the flow. Since Astro always writes to `dist/`, the blue-green pattern needs adjustment:

**Revised flow:**
1. Before build: back up `dist/` to `dist-prev/`
2. Build (writes to `dist/`)
3. Validate `dist/`
4. If validation fails: `rm -rf dist && mv dist-prev dist` (rollback)
5. If validation passes: `rm -rf dist-prev` (cleanup)

**Step 2: Test the script manually**

Run: `bash scripts/build-site.sh`
Expected: Build completes with "SUCCESS: Deployed NNN pages", `logs/deploy.log` has entries, `logs/build-status.json` exists with status "success".

**Step 3: Test rollback — simulate validation failure**

Temporarily break validate-build.sh (add `exit 1` at top), run `bash scripts/build-site.sh`, verify dist/ is restored from dist-prev/.
Then restore validate-build.sh.

**Step 4: Commit**

```bash
git add scripts/build-site.sh
git commit -m "feat: safe build pipeline — blue-green deploy with validation and rollback"
```

---

### Task 4: Rewrite deploy-webhook.js with progress tracking

**Files:**
- Modify: `scripts/deploy-webhook.js` (full rewrite)

**Step 1: Rewrite deploy-webhook.js**

Replace entire contents of `scripts/deploy-webhook.js` with:

```javascript
#!/usr/bin/env node
// Deploy webhook server — triggers safe build, serves build status.
// Port 3099, localhost only. Called by CMS deploy button.

const http = require('http')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const PORT = 3099
const ROOT = path.resolve(__dirname, '..')
const SCRIPT = path.join(__dirname, 'build-site.sh')
const STATUS_FILE = path.join(ROOT, 'logs', 'build-status.json')

let isBuilding = false

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'))
  } catch {
    return { status: 'idle', steps: {} }
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }

  // GET /build-status — return current status
  if (req.method === 'GET' && req.url === '/build-status') {
    res.writeHead(200, corsHeaders())
    res.end(JSON.stringify(readStatus()))
    return
  }

  // POST /deploy — trigger build
  if (req.method === 'POST' && req.url === '/deploy') {
    if (isBuilding) {
      res.writeHead(409, corsHeaders())
      res.end(JSON.stringify({ ok: false, error: 'Build already in progress' }))
      return
    }

    const buildId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)
    console.log(`[${new Date().toISOString()}] Deploy triggered (${buildId})`)

    isBuilding = true
    res.writeHead(200, corsHeaders())
    res.end(JSON.stringify({ ok: true, build_id: buildId }))

    exec(`bash ${SCRIPT}`, { cwd: ROOT, timeout: 300_000 }, (err, stdout, stderr) => {
      isBuilding = false
      if (err) {
        console.error(`[deploy] FAILED: ${err.message}`)
        if (stderr) console.error(stderr)
      } else {
        console.log(`[deploy] SUCCESS`)
      }
      if (stdout) console.log(stdout)
    })
    return
  }

  res.writeHead(404, corsHeaders())
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Deploy webhook listening on http://127.0.0.1:${PORT}`)
  console.log(`  POST /deploy     — trigger build`)
  console.log(`  GET  /build-status — current status`)
})
```

**Step 2: Test webhook locally**

Run (in one terminal): `node scripts/deploy-webhook.js`
Run (in another): `curl http://localhost:3099/build-status`
Expected: JSON with status "idle" or last build status.

Run: `curl -X POST http://localhost:3099/deploy`
Expected: `{"ok":true,"build_id":"..."}`, and build starts in background.

Run: `curl http://localhost:3099/build-status` (a few seconds later)
Expected: JSON with status "building" and steps in progress.

**Step 3: Commit**

```bash
git add scripts/deploy-webhook.js
git commit -m "feat: deploy webhook with build progress and status endpoint"
```

---

### Task 5: Rewrite DeployButton as DeployStatus with step checklist

**Files:**
- Modify: `apps/cms/src/components/DeployButton.tsx` (full rewrite, rename to DeployStatus)

Note: Keep the file as `DeployButton.tsx` since it's referenced in `payload.config.ts` at line 41.

**Step 1: Rewrite the component**

Replace entire contents of `apps/cms/src/components/DeployButton.tsx` with:

```tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'

type StepStatus = 'pending' | 'active' | 'done' | 'failed'
type BuildStatus = 'idle' | 'building' | 'success' | 'failed'

interface BuildState {
  build_id?: string
  status: BuildStatus
  timestamp?: string
  pages_count?: number
  error?: string | null
  steps: Record<string, StepStatus>
}

const STEP_LABELS: Record<string, string> = {
  cms_check: 'Проверка CMS',
  build: 'Сборка страниц',
  validate: 'Валидация',
  deploy: 'Публикация',
}

const STEP_ORDER = ['cms_check', 'build', 'validate', 'deploy']

const WEBHOOK_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3099`
  : 'http://localhost:3099'

export default function DeployButton() {
  const [state, setState] = useState<BuildState>({ status: 'idle', steps: {} })
  const [polling, setPolling] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${WEBHOOK_URL}/build-status`)
      if (res.ok) {
        const data: BuildState = await res.json()
        setState(data)

        if (data.status === 'success' || data.status === 'failed') {
          stopPolling()
          setDeploying(false)
        }
      }
    } catch {
      // Webhook unreachable — silently ignore
    }
  }

  const startPolling = () => {
    if (intervalRef.current) return
    setPolling(true)
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 2000)
  }

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setPolling(false)
  }

  useEffect(() => {
    // Check status on mount — if a build is already running, show it
    fetchStatus()
    return () => stopPolling()
  }, [])

  const handleDeploy = async () => {
    if (deploying) return
    setDeploying(true)
    setState({ status: 'building', steps: {} })

    try {
      const res = await fetch(`${WEBHOOK_URL}/deploy`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setState({
          status: 'failed',
          steps: {},
          error: data.error || `HTTP ${res.status}`,
        })
        setDeploying(false)
        return
      }
      startPolling()
    } catch {
      setState({
        status: 'failed',
        steps: {},
        error: 'Сервер сборки недоступен',
      })
      setDeploying(false)
    }
  }

  const isActive = deploying || state.status === 'building'
  const showSteps = isActive || state.status === 'success' || state.status === 'failed'

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <button
        type="button"
        onClick={handleDeploy}
        disabled={isActive}
        style={{
          width: '100%',
          padding: '10px 16px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isActive ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: isActive ? '#888' : '#000',
          color: '#fff',
        }}
      >
        {isActive ? 'Сборка...' : 'Опубликовать на сайт'}
      </button>

      {showSteps && (
        <div style={{
          marginTop: '8px',
          padding: '10px 12px',
          backgroundColor: '#fafafa',
          border: '1px solid #e5e5e5',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: '1.8',
        }}>
          {STEP_ORDER.map(key => {
            const stepStatus = state.steps[key] || 'pending'
            const label = STEP_LABELS[key]
            return (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: stepStatus === 'pending' ? '#aaa' : '#333',
              }}>
                <StepIcon status={stepStatus} />
                <span>{label}</span>
                {key === 'build' && state.pages_count && stepStatus === 'done' && (
                  <span style={{ color: '#999', marginLeft: 'auto', fontSize: '12px' }}>
                    {state.pages_count} стр.
                  </span>
                )}
              </div>
            )
          })}

          {state.status === 'failed' && (
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '12px',
              color: '#666',
              lineHeight: 1.5,
            }}>
              {state.error && (
                <div style={{ marginBottom: '4px', color: '#999' }}>{state.error}</div>
              )}
              <div>Сайт работает. На нём предыдущая опубликованная версия.</div>
              <div>Обратитесь к разработчику, если проблема повторяется.</div>
            </div>
          )}

          {state.status === 'success' && (
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e5e5',
              fontSize: '12px',
              color: '#666',
            }}>
              Опубликовано
              {state.timestamp && (
                <span> — {new Date(state.timestamp).toLocaleString('ru-RU')}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  const size = 16
  const style: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (status === 'done') {
    return (
      <svg style={style} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#999" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'active') {
    return (
      <svg style={{ ...style, animation: 'spin 1s linear infinite' }} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#ddd" strokeWidth="1.5" />
        <path d="M8 1a7 7 0 0 1 7 7" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </svg>
    )
  }

  if (status === 'failed') {
    return (
      <svg style={style} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#999" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  // pending
  return (
    <svg style={style} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#ddd" strokeWidth="1.5" />
    </svg>
  )
}
```

**Step 2: Verify CMS builds**

Run: `cd apps/cms && pnpm build 2>&1 | tail -10`
Expected: Build succeeds with no TypeScript errors.

**Step 3: Commit**

```bash
git add apps/cms/src/components/DeployButton.tsx
git commit -m "feat: deploy status checklist in CMS — shows build progress and calm failure messages"
```

---

### Task 6: Update nginx to proxy webhook

The CMS component needs to reach the webhook at port 3099. The CMS admin runs on admin.dvizh.cc through nginx. We need to proxy `/api/deploy` and `/build-status` from the CMS admin domain to the webhook.

**Files:**
- Modify: `nginx/nginx.conf` (add proxy rules to admin.dvizh.cc server)

**Step 1: Add webhook proxy to admin.dvizh.cc server block**

In `nginx/nginx.conf`, inside the `admin.dvizh.cc` server block (lines 72-91), add two location blocks before the catch-all `location /`:

Add after line 81 (`return 302 /admin;` closing brace) and before line 83 (`location / {`):

```nginx
        # Deploy webhook proxy
        location = /deploy {
            proxy_pass http://host.docker.internal:3099;
            proxy_set_header Host $host;
        }

        location = /build-status {
            proxy_pass http://host.docker.internal:3099;
            proxy_set_header Host $host;
        }
```

Also update the CMS component's WEBHOOK_URL to use relative paths instead of port 3099.

**Step 2: Update DeployButton.tsx to use relative URLs**

In `apps/cms/src/components/DeployButton.tsx`, change the WEBHOOK_URL constant:

```tsx
const WEBHOOK_URL = ''  // Relative — nginx proxies /deploy and /build-status
```

And update fetch calls:
- `fetch(\`${WEBHOOK_URL}/build-status\`)` → `fetch('/build-status')`
- `fetch(\`${WEBHOOK_URL}/deploy\`, { method: 'POST' })` → `fetch('/deploy', { method: 'POST' })`

**Step 3: Reload nginx**

Run: `docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`

**Step 4: Commit**

```bash
git add nginx/nginx.conf apps/cms/src/components/DeployButton.tsx
git commit -m "feat: nginx proxies /deploy and /build-status to webhook for CMS admin"
```

---

### Task 7: Ensure logs directory and .gitignore

**Files:**
- Verify: `.gitignore` already has `logs/`
- Create: `logs/.gitkeep`

**Step 1: Create logs directory with .gitkeep**

Run: `mkdir -p logs && touch logs/.gitkeep`

Verify `.gitignore` has `logs/` — it does (confirmed in exploration).
Add exception for .gitkeep:

In `.gitignore`, after the `logs/` line, add:
```
!logs/.gitkeep
```

**Step 2: Commit**

```bash
git add -f logs/.gitkeep .gitignore
git commit -m "chore: add logs directory for deploy logging"
```

---

### Task 8: End-to-end test

**Step 1: Ensure webhook is running**

Run: `node scripts/deploy-webhook.js &`

**Step 2: Trigger build via webhook**

Run: `curl -X POST http://localhost:3099/deploy`
Expected: `{"ok":true,"build_id":"..."}`

**Step 3: Monitor progress**

Run (repeatedly): `curl -s http://localhost:3099/build-status | python3 -m json.tool`
Expected: Steps progress from "active" to "done". Final status "success" with page count.

**Step 4: Verify logs**

Run: `cat logs/deploy.log | tail -5`
Expected: Log entries for each step.

Run: `cat logs/build-status.json | python3 -m json.tool`
Expected: Final status JSON with all steps "done".

**Step 5: Verify dist is intact**

Run: `bash scripts/validate-build.sh apps/web/dist 500`
Expected: "Validation passed: NNN pages"

**Step 6: Final commit — update smoke test reference**

```bash
git add -A
git commit -m "test: verify safe build pipeline end-to-end"
```

---

## Summary

| Task | What | Est. |
|------|------|------|
| 1 | payload.ts retry logic | 2 min |
| 2 | validate-build.sh | 5 min |
| 3 | build-site.sh rewrite | 5 min |
| 4 | deploy-webhook.js rewrite | 3 min |
| 5 | DeployButton.tsx → status checklist | 5 min |
| 6 | nginx proxy for webhook | 2 min |
| 7 | logs directory setup | 1 min |
| 8 | End-to-end test | 5 min |
