#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Checking CMS availability..."
if ! curl -sf http://localhost:3002/api/globals/navigation > /dev/null; then
  echo "ERROR: CMS is not responding at http://localhost:3002"
  exit 1
fi

echo "Building static site..."
CMS_URL=http://localhost:3002 pnpm --filter web build

if docker compose -f docker-compose.prod.yml ps --status running nginx 2>/dev/null | grep -q nginx; then
  echo "Restarting nginx..."
  docker compose -f docker-compose.prod.yml restart nginx
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') — Build complete"
