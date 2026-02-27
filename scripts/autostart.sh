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

# Запускаем dev сервер (preview.dvizh.cc)
if ! lsof -i :4321 > /dev/null 2>&1; then
  # Резолвим IP контейнера CMS для Vite proxy (c-ares не поддерживает mDNS)
  CMS_IP=$(dscacheutil -q host -a name cms.dvizh-new-era.orb.local 2>/dev/null | grep ip_address | head -1 | awk '{print $2}')
  if [ -n "$CMS_IP" ]; then
    export VITE_PROXY_CMS="http://${CMS_IP}:3002"
    log "CMS proxy IP resolved: $CMS_IP"
  fi
  log "Starting dev server on port 4321..."
  cd "$PROJECT_DIR" && nohup pnpm dev >> "$PROJECT_DIR/logs/dev-server.log" 2>&1 &
  log "Dev server started (PID: $!)"
else
  log "Dev server already running on port 4321"
fi

log "=== Autostart complete ==="
