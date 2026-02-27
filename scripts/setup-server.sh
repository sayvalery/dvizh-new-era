#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker is not running"
  exit 1
fi

if [ ! -f .env.prod ]; then
  if [ -f .env.prod.example ]; then
    cp .env.prod.example .env.prod
    echo "WARNING: .env.prod created from .env.prod.example — edit it before going to production!"
  else
    echo "ERROR: .env.prod not found and no .env.prod.example to copy from"
    exit 1
  fi
fi

echo "Starting postgres..."
docker compose -f docker-compose.prod.yml up -d postgres
echo "Waiting for postgres to be healthy..."
until docker compose -f docker-compose.prod.yml ps postgres | grep -q healthy; do
  sleep 2
done
echo "Postgres is ready."

echo "Starting CMS..."
docker compose -f docker-compose.prod.yml up -d cms
CMS_HOST="${CMS_HOST:-cms.dvizh-new-era.orb.local}"
CMS_URL="http://${CMS_HOST}:3002"

echo "Waiting for CMS to start at $CMS_URL ..."
for i in $(seq 1 60); do
  if curl -sf "$CMS_URL/api/blog-posts?limit=1" > /dev/null 2>&1; then
    echo "CMS is ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "WARNING: CMS did not respond within 120 seconds, continuing anyway..."
  fi
  sleep 2
done

echo "Building static site..."
bash scripts/build-site.sh

echo "Starting nginx..."
docker compose -f docker-compose.prod.yml up -d nginx

echo "Server ready"
