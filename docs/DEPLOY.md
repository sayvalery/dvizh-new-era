# Развёртывание базы данных

Свежие дампы базы лежат в `~/dvizh-backups/auto/<дата-время>-<reason>/dvizh-db.dump` (формат `pg_dump -Fc`, создаются скриптом `scripts/backup-db.sh` — ежедневно и перед каждым деплоем). Старый одноразовый `dvizh_dump.sql` больше не используется.

## Требования
- Docker + Docker Compose
- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Шаги

### 1. Поднять PostgreSQL
```bash
docker compose up -d
```

Подождать пару секунд пока контейнер поднимется:
```bash
docker ps
# dvizh-new-era-postgres-1 должен быть Up (healthy)
```

### 2. Залить дамп

Восстановление из последнего автоматического бэкапа (формат `-Fc` → `pg_restore`):
```bash
LATEST=$(ls -1dt ~/dvizh-backups/auto/*/ | head -1)
docker exec -i dvizh-new-era-postgres-1 \
  pg_restore -U dvizh -d dvizh --clean --if-exists < "$LATEST/dvizh-db.dump"
```

Самые ценные данные — входящие заявки — дополнительно лежат в накопительном
append-only файле `~/dvizh-backups/leads-export.csv` (никогда не обнуляется ротацией).

### 3. Установить зависимости
```bash
pnpm install
```

### 4. Создать .env файлы

`apps/cms/.env`:
```
DATABASE_URL=postgresql://dvizh:dvizh@localhost:5432/dvizh
PAYLOAD_SECRET=замени-на-любую-случайную-строку
SERVER_URL=http://localhost:3002
WEB_URL=http://localhost:4321
```

`apps/web/.env`:
```
CMS_URL=http://localhost:3002
```

### 5. Запустить
```bash
# CMS (в одном терминале)
pnpm --filter cms dev

# Сайт (в другом терминале)
pnpm --filter web dev
```

CMS будет на http://localhost:3002/admin
Сайт будет на http://localhost:4321
