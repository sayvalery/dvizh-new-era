# Setup Report — 2026-02-25

## Installed software
- Homebrew 5.0.15 (installed with sudo via askpass)
- OrbStack v2.0.5 (Docker for Mac)
- Docker 28.5.2
- Node.js v22.13.1 (was already installed)
- pnpm 10.30.2 (was already installed)
- cloudflared 2026.2.0
- gh (GitHub CLI) 2.87.3

## Bug fixed during build
- `apps/web/src/lib/payload.ts`: `getGlossaries`/`getGlossaryItem` used `_status` filter on a collection without versioning → removed filter, fixed sort field `title` → `name`

## Currently running services
- **PostgreSQL** — `docker compose -f docker-compose.prod.yml` (healthy)
- **CMS (Payload)** — port 3002 (container + nginx proxy)
- **nginx** — port 80 (static site + proxy)
- **cloudflared quick tunnel** — external access (PID in /tmp/cloudflared-tunnel.pid)

## URLs
- Local static site: http://localhost/
- Local CMS admin: http://localhost:3002/admin (vs@dvizh.io / 9wst89rX)
- External site: https://interstate-layer-there-prescribed.trycloudflare.com

## Pending: git push
Commit `b3d21f2` created but not pushed (GitHub auth needed).
To push:
```bash
gh auth login
git push origin main
```

## Quick tunnel note
The cloudflared quick tunnel URL is temporary and will change if the process restarts.
For a permanent external URL, set up a named Cloudflare Tunnel:
1. Get a tunnel token from Cloudflare Zero Trust dashboard
2. Add it to `.env.prod` as `CLOUDFLARE_TUNNEL_TOKEN=...`
3. Run `bash scripts/setup-tunnel.sh`
