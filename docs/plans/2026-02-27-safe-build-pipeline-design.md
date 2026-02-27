# Safe Build Pipeline

**Date:** 2026-02-27
**Status:** Approved

## Problem

Build failures can silently break the production site. Today's incident: OrbStack slept, CMS became unavailable, build ran without generating index.html, nginx served 403 on the homepage. Other pages still worked (stale from previous build). Nobody was notified.

The marketing team publishes content via CMS and expects the site to always work. They cannot diagnose infrastructure issues.

## Core Principle

The production static site ALWAYS works. A new build replaces the old one ONLY after full validation passes. If anything fails, the old site stays live.

## Design

### 1. Safe Build Script (`scripts/build-site.sh`)

Blue-green deployment for static files:

1. Check CMS is available (GET /api/blog-posts?limit=1). If down: fail, log, exit. Old site untouched.
2. Record current page count from dist/ (`prev_count`).
3. Build into `dist-staging/` (not dist/).
4. Run `validate-build.sh` against dist-staging/. If fails: delete dist-staging/, log, exit.
5. Atomic swap: `mv dist dist-prev && mv dist-staging dist`.
6. Reload nginx.
7. Post-check: curl dvizh.cc returns 200. If not: rollback (`mv dist-prev dist`), log CRITICAL.
8. On success: delete dist-prev. Write build-status.json and deploy.log.

### 2. Build Validator (`scripts/validate-build.sh`)

Checks against a staging directory:

- `index.html` exists in root
- Key sections have index.html: /about/, /blog/, /developers/, /slovar-developera/, /vitrina/
- Page count >= 80% of previous build (catches partial generation)
- All index.html files > 500 bytes (catches empty templates)
- No localhost:3002 in HTML (except form actions when PUBLIC_CMS_URL is empty)
- No external placeholders (placehold.co, pravatar.cc)
- sitemap-index.xml exists and is non-empty
- Fonts directory present with expected files

### 3. Deploy Webhook (`scripts/deploy-webhook.js`)

Replaces current fire-and-forget webhook:

- POST `/deploy` returns `{ "build_id": "..." }`, starts build
- GET `/build-status` returns current build-status.json
- build-status.json tracks steps: cms_check, build, validate, deploy — each with status (pending/active/done/failed)
- On failure: status includes calm message for CMS UI

### 4. CMS Deploy Status Component (`apps/cms/src/components/DeployStatus.tsx`)

React component in Payload CMS admin (React is allowed here — CMS is Next.js):

- "Publish site" button
- On click: POST /deploy, polls GET /build-status every 2s
- Shows checklist of steps with simple icons (checkmark for done, spinner for active, dash for pending, x for failed)
- On failure: "Publication incomplete. The site is working with the previous published version. Contact a developer if this repeats."
- Minimal styling using Payload CSS variables. No external libraries, no emojis.

### 5. payload.ts Retry Logic

fetchFromCMS() improvements:

- 3 retries with exponential backoff (1s, 2s, 4s)
- Timeout increased from 2s to 5s (CMS is slow after OrbStack wake)
- Throw only after all retries exhausted

### 6. Logging

- `logs/deploy.log` — append-only, one line per build attempt
- `build-status.json` — latest build status (for webhook API)
- `notify()` function in build-site.sh — currently writes to log, prepared for Telegram integration

## Files Changed

| File | Action |
|------|--------|
| `scripts/build-site.sh` | Rewrite: blue-green deploy, validation, logging |
| `scripts/validate-build.sh` | New: comprehensive build validator |
| `scripts/deploy-webhook.js` | Rewrite: build_id, GET /build-status, progress tracking |
| `apps/web/src/lib/payload.ts` | Add retry logic to fetchFromCMS() |
| `apps/cms/src/components/DeployStatus.tsx` | New: deploy status UI for CMS admin |
| `apps/cms/src/payload.config.ts` | Register DeployStatus component |
| `logs/` | New directory (gitignored) |

## Constraints

- No new npm dependencies
- No new services or daemons
- Bash scripts only (curl, jq already available)
- CMS component uses React (allowed — CMS is Next.js)
- Backward compatible with manual `pnpm build`

## Deferred (future iterations)

- Telegram bot notifications
- Health-check daemon (cron/launchd)
- Form submission testing
- Full monitoring (approach 3)
