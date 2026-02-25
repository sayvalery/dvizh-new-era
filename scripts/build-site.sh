#!/bin/bash
set -e

echo "Checking CMS availability..."
if ! curl -sf http://localhost:3002/api/globals/navigation > /dev/null 2>&1; then
  echo "ERROR: CMS is not responding at http://localhost:3002"
  exit 1
fi

echo "Building static site..."
CMS_URL=http://localhost:3002 pnpm --filter web build

# Restart nginx if prod compose is running
if docker compose -f docker-compose.prod.yml ps --status running nginx 2>/dev/null | grep -q nginx; then
  echo "Restarting nginx..."
  docker compose -f docker-compose.prod.yml restart nginx
fi

echo ""
echo "Build complete — $(date)"
