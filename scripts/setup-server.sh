#!/bin/bash
set -e

echo "=== Dvizh Production Setup ==="

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "ERROR: Docker daemon is not running"
  exit 1
fi

# Check .env.prod
if [ ! -f .env.prod ]; then
  if [ -f .env.prod.example ]; then
    cp .env.prod.example .env.prod
    echo "WARNING: Created .env.prod from .env.prod.example — edit it with real values!"
  else
    echo "ERROR: .env.prod not found and no .env.prod.example to copy from"
    exit 1
  fi
fi

# Start postgres
echo "Starting PostgreSQL..."
docker compose -f docker-compose.prod.yml up -d postgres
echo "Waiting for PostgreSQL to be healthy..."
until docker compose -f docker-compose.prod.yml exec postgres pg_isready -U dvizh 2>/dev/null; do
  sleep 2
done
echo "PostgreSQL is ready."

# Start CMS
echo "Starting CMS..."
docker compose -f docker-compose.prod.yml up -d cms
echo "Waiting for CMS to start..."
sleep 10
until curl -sf http://localhost:3002/api/globals/navigation > /dev/null 2>&1; do
  sleep 5
done
echo "CMS is ready."

# Build static site
echo "Building static site..."
bash scripts/build-site.sh

# Start nginx
echo "Starting nginx..."
docker compose -f docker-compose.prod.yml up -d nginx

echo ""
echo "=== Server ready ==="
