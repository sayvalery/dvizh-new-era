#!/bin/bash
set -e

cd "$(dirname "$0")/.."

CMS_HOST="${CMS_HOST:-cms.dvizh-new-era.orb.local}"
CMS_URL="http://${CMS_HOST}:3002"

echo "Checking CMS availability at $CMS_URL ..."
if ! curl -sf "$CMS_URL/api/blog-posts?limit=1" > /dev/null; then
  echo "ERROR: CMS is not responding at $CMS_URL"
  exit 1
fi

echo "Building static site..."
CMS_URL="$CMS_URL" pnpm --filter web build

if docker compose -f docker-compose.prod.yml ps --status running nginx 2>/dev/null | grep -q nginx; then
  echo "Restarting nginx..."
  docker compose -f docker-compose.prod.yml restart nginx
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') — Build complete"
