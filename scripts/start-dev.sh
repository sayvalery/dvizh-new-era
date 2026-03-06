#!/bin/bash
# Dev server launcher — запускается через LaunchAgent с KeepAlive
# Работает в foreground: при краше launchd автоматически перезапустит

LOG="/Users/server/dev/dvizh-new-era/logs/dev-server.log"
PROJECT_DIR="/Users/server/dev/dvizh-new-era"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG"
}

log "=== Dev server starting ==="

# Ждём, пока OrbStack/Docker поднимет CMS-контейнер (актуально после перезагрузки)
for i in $(seq 1 60); do
  if dscacheutil -q host -a name cms.dvizh-new-era.orb.local 2>/dev/null | grep -q ip_address; then
    break
  fi
  sleep 2
done

# Резолвим IP контейнера CMS для Vite proxy (c-ares не поддерживает mDNS)
CMS_IP=$(dscacheutil -q host -a name cms.dvizh-new-era.orb.local 2>/dev/null | grep ip_address | head -1 | awk '{print $2}')
if [ -n "$CMS_IP" ]; then
  export VITE_PROXY_CMS="http://${CMS_IP}:3002"
  log "CMS proxy IP resolved: $CMS_IP"
else
  log "WARNING: Could not resolve CMS IP, using last known fallback"
  export VITE_PROXY_CMS="http://192.168.138.3:3002"
fi

cd "$PROJECT_DIR" || exit 1

log "Starting: VITE_PROXY_CMS=$VITE_PROXY_CMS"

# exec заменяет shell на pnpm — launchd отслеживает правильный PID
exec pnpm dev
