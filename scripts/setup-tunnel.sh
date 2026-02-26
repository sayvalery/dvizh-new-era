#!/bin/bash
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found"
  exit 1
fi

if ! grep -q 'CLOUDFLARE_TUNNEL_TOKEN=.\+' .env.prod; then
  echo "ERROR: CLOUDFLARE_TUNNEL_TOKEN is not set in .env.prod"
  echo "Get your token from Cloudflare Zero Trust dashboard and add it to .env.prod"
  exit 1
fi

echo "Starting Cloudflare Tunnel..."
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared

echo ""
echo "Cloudflare Tunnel is running."
echo "Make sure your domain is configured in Cloudflare Zero Trust dashboard"
echo "to point to http://nginx:80"
