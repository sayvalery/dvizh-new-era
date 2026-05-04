#!/bin/bash
# Автозапуск всех сервисов dvizh после перезагрузки
# Запускается через LaunchAgent при логине пользователя

LOG="/Users/server/dev/dvizh-new-era/logs/autostart.log"
PROJECT_DIR="/Users/server/dev/dvizh-new-era"

mkdir -p "$(dirname "$LOG")"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG"
}

log "=== Autostart triggered ==="

# Ждём OrbStack/Docker (может запускаться параллельно)
log "Waiting for Docker..."
for i in $(seq 1 120); do
  if docker info > /dev/null 2>&1; then
    log "Docker ready (waited ${i}s)"
    break
  fi
  if [ "$i" -eq 120 ]; then
    log "ERROR: Docker not ready after 120s, aborting"
    exit 1
  fi
  sleep 1
done

cd "$PROJECT_DIR" || exit 1

# Запускаем Docker Compose сервисы
log "Starting docker compose services..."
docker compose -f docker-compose.prod.yml up -d postgres 2>&1 | tee -a "$LOG"

# Ждём postgres
log "Waiting for postgres..."
for i in $(seq 1 60); do
  if docker compose -f docker-compose.prod.yml ps postgres 2>/dev/null | grep -q healthy; then
    log "Postgres ready"
    break
  fi
  sleep 2
done

# Запускаем CMS, nginx
docker compose -f docker-compose.prod.yml up -d cms nginx 2>&1 | tee -a "$LOG"

# Ждём CMS (через OrbStack DNS, т.к. localhost port forwarding ненадёжен)
CMS_URL="http://cms.dvizh-new-era.orb.local:3002"
log "Waiting for CMS at $CMS_URL ..."
for i in $(seq 1 90); do
  if curl -sf "$CMS_URL/api/blog-posts?limit=1" > /dev/null 2>&1; then
    log "CMS ready"
    break
  fi
  if [ "$i" -eq 90 ]; then
    log "WARNING: CMS not responding, continuing..."
  fi
  sleep 2
done

# Запускаем Cloudflare tunnel
log "Starting Cloudflare tunnel..."
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared 2>&1 | tee -a "$LOG"

# Dev-сервер управляется отдельным LaunchAgent com.dvizh.devserver (KeepAlive=true)
# Он запускается автоматически при логине и перезапускается при любом краше
log "Dev server is managed by com.dvizh.devserver LaunchAgent"

log "=== Autostart complete ==="
