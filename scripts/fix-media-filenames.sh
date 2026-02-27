#!/bin/bash
# Fix URL-encoded filenames in CMS media directory
# Payload CMS v3 expects decoded filenames but Webflow migration created encoded ones
# Run after data import/migration

set -euo pipefail

echo "Fixing URL-encoded filenames in CMS media..."

docker compose -f docker-compose.prod.yml exec -T cms sh -c '
cd /app/apps/cms/media
count=0
for f in *%*; do
  [ "$f" = "*%*" ] && break
  decoded=$(printf "%b" "$(echo "$f" | sed "s/%/\\\\x/g")")
  if [ "$f" != "$decoded" ] && [ ! -f "$decoded" ]; then
    mv -- "$f" "$decoded" 2>/dev/null && count=$((count + 1))
  fi
done
echo "Renamed $count files"
'
