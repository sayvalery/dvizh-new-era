# Setup Issues

## Homebrew
- **Status:** Not installed
- **Problem:** Requires sudo access, and user `server` does not have admin privileges
- **Fix:** Run as admin: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

## Docker
- **Status:** Not installed (broken symlink at `/usr/local/bin/docker` -> Docker.app which is missing)
- **Problem:** Cannot install without Homebrew or admin access
- **Fix:** Install OrbStack (`brew install --cask orbstack`) or Docker Desktop after Homebrew is available
- **Impact:** Cannot run PostgreSQL, cannot start CMS, cannot build static site

## What was completed without Docker

### Phase 1 (Partial)
- Node.js v22.13.1 — already installed
- pnpm 10.30.2 — already installed
- Homebrew — BLOCKED (needs sudo)
- Docker — BLOCKED (needs Homebrew or admin install)

### Phase 2 (Partial)
- `pnpm install` — dependencies installed (700 packages)
- `.env` files — already existed for both cms and web with correct values
- DB, CMS startup, site build — BLOCKED (need Docker)

### Phase 3 (Complete)
- `docker-compose.prod.yml` — created with postgres, cms, nginx, cloudflared services
- `apps/cms/Dockerfile.prod` — multi-stage build (deps → builder → runner), USER node
- `nginx/nginx.conf` — static + proxy for /admin, /api, /media, gzip, caching
- `scripts/build-site.sh` — checks CMS, builds site, restarts nginx if running
- `scripts/setup-server.sh` — full prod bootstrap (Docker check, .env, services, build)
- `scripts/setup-tunnel.sh` — Cloudflare Tunnel with token validation
- `.env.prod.example` — template with generated PAYLOAD_SECRET
- `package.json` — added start:prod, stop:prod, build:prod, setup:prod scripts
- `.gitignore` — added .env.prod

## Next steps after Docker is installed
1. `docker compose up -d` — start postgres
2. `pnpm --filter cms dev` — start CMS
3. `curl http://localhost:3002/api/globals/navigation` — verify CMS
4. `CMS_URL=http://localhost:3002 pnpm --filter web build` — build static site
5. `cp .env.prod.example .env.prod` — create prod env, edit values
6. `pnpm run setup:prod` — full production deploy
