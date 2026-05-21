#!/bin/bash
# Запуск Astro dev-сервера для preview.dvizh.cc
# Управляется LaunchAgent com.dvizh.devserver (KeepAlive=true, ThrottleInterval=10)

PROJECT_DIR="/Users/server/dev/dvizh-new-era"

cd "$PROJECT_DIR" || exit 1

# Если node_modules пропали — восстанавливаем
if [ ! -d "node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
  echo "[$(date '+%F %T')] node_modules missing, running pnpm install..."
  pnpm install --prefer-offline 2>&1
fi

# Передаём управление pnpm dev (exec — чтобы LaunchAgent видел реальный PID процесса)
exec pnpm dev
