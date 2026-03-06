# Задача: полностью настроить сервер и поднять проект

## Контекст

Ты работаешь на Mac M1 (16GB, macOS). В текущей папке лежит проект dvizh-new-era -- монорепа Astro (SSG) + Payload CMS v3 + PostgreSQL. Неизвестно, какой софт уже установлен на машине -- проверяй и устанавливай все что нужно.

Задача состоит из трех фаз:
1. Подготовить машину (установить Docker, Node, pnpm если нужно)
2. Поднять dev-окружение (CMS + база + данные)
3. Создать и настроить продакшн-конфиги (nginx, docker-compose.prod, Cloudflare Tunnel)

К утру все должно работать: CMS запущена, сайт собран в статику, nginx раздает.
Cloudflare Tunnel НЕ запускать (домен еще не подключен) -- только создать конфиг.

**Стек:** Astro 5 (SSG, `output: 'static'`), Payload CMS v3 (Next.js 15), PostgreSQL 16, pnpm workspaces.
**Порты:** CMS :3002, Web :4321, Postgres :5432

**Креды CMS (уже созданный пользователь):** vs@dvizh.io / 9wst89rX

---

## Фаза 1: Подготовка машины

### Проверь и установи если нужно:

**Homebrew:**
```bash
brew --version
# Если нет: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Docker (OrbStack рекомендуется для Mac, легче Docker Desktop):**
```bash
docker --version
# Если нет: brew install --cask orbstack
# Дождись пока запустится, проверь: docker ps
```

**Node.js 20+:**
```bash
node --version
# Если нет или < 20: brew install node@20
```

**pnpm:**
```bash
pnpm --version
# Если нет: npm install -g pnpm
```

Если что-то не устанавливается (нужен пароль, нет интернета) -- запиши в файл `SETUP-ISSUES.md` что именно не получилось и продолжай с тем что есть.

---

## Фаза 2: Поднять dev-окружение

### 2.1 Установить зависимости
```bash
pnpm install
```

### 2.2 Поднять базу данных
```bash
docker compose up -d
```
Подожди пока postgres будет healthy.

### 2.3 Создать .env файлы (если не существуют)

`apps/cms/.env` (сверься с `apps/cms/.env.example`):
```
DATABASE_URL=postgresql://dvizh:dvizh@localhost:5432/dvizh
PAYLOAD_SECRET=any-secret-string-here
SERVER_URL=http://localhost:3002
WEB_URL=http://localhost:4321
FORM_WEBHOOK_URL=
```

`apps/web/.env` (сверься с `apps/web/.env.example`):
```
CMS_URL=http://localhost:3002
```

### 2.4 Запустить CMS
```bash
pnpm --filter cms dev
```
Подожди пока стартует (может занять 30-60 секунд). Проверь:
```bash
curl -sf http://localhost:3002/api/globals/navigation
```
Если отвечает JSON -- CMS работает.

### 2.5 Собрать статический сайт
```bash
CMS_URL=http://localhost:3002 pnpm --filter web build
```
Результат должен быть в `apps/web/dist/`. Проверь что папка существует и не пустая.

Если сборка падает с ошибками -- запиши их в `SETUP-ISSUES.md`, но продолжай с Фазой 3.

---

## Фаза 3: Продакшн-конфиги

### 3.1 `docker-compose.prod.yml` (корень проекта)

Создать. Не трогай `docker-compose.yml` -- он для dev.

Сервисы:

**postgres:**
- Как в текущем docker-compose.yml
- Обязательно named volume (данные не пропадут при перезапуске)
- Healthcheck

**cms:**
- Сборка через `apps/cms/Dockerfile.prod`
- Volume для `apps/cms/media/`
- env_file: .env.prod
- depends_on: postgres (condition: service_healthy)

**nginx:**
- Образ: `nginx:alpine`
- Статика из `./apps/web/dist/` -> `/usr/share/nginx/html` (read-only volume)
- Конфиг из `./nginx/nginx.conf` -> `/etc/nginx/nginx.conf`
- Проксирование `/admin`, `/api`, `/media` на cms:3002
- Порт 80
- depends_on: cms

**cloudflared:**
- Образ: `cloudflare/cloudflared:latest`
- Команда: `tunnel run`
- environment: `TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}`
- depends_on: nginx
- profiles: ["tunnel"] -- чтобы НЕ запускался по умолчанию (запускать отдельно когда домен готов)

### 3.2 `apps/cms/Dockerfile.prod`

- Базовый образ: `node:20-alpine`
- Контекст сборки будет корнем монорепы (docker-compose укажет context: .)
- Установить pnpm через `corepack enable && corepack prepare pnpm@latest --activate`
- Скопировать: pnpm-lock.yaml, pnpm-workspace.yaml, package.json (корень), apps/cms/
- `pnpm install --frozen-lockfile --filter cms`
- `pnpm --filter cms build` (это `next build`)
- CMD: `pnpm --filter cms start` (это `next start --port 3002`)
- Не от root (USER node)

Обязательно прочитай `apps/cms/package.json` и `apps/cms/next.config.ts` перед написанием.

### 3.3 `nginx/nginx.conf`

- Слушает порт 80
- `location /` -- статика, `try_files $uri $uri/ /404.html`
- `location /admin` -> `proxy_pass http://cms:3002`
- `location /api` -> `proxy_pass http://cms:3002`
- `location /media` -> `proxy_pass http://cms:3002`
- gzip для html, css, js, json, svg, woff2
- Кэширование статики: `Cache-Control: public, max-age=31536000, immutable` для css/js/images
- Proxy-заголовки: X-Real-IP, X-Forwarded-For, X-Forwarded-Proto, Host

### 3.4 Скрипты

**`scripts/build-site.sh`** -- пересборка сайта:
- `set -e`
- Проверить что CMS отвечает
- `CMS_URL=http://localhost:3002 pnpm --filter web build`
- Если nginx из prod compose запущен -- перезапустить: `docker compose -f docker-compose.prod.yml restart nginx`
- Вывести дату и "Build complete"

**`scripts/setup-server.sh`** -- первый запуск продакшна:
- `set -e`
- Проверить Docker
- Проверить .env.prod (если нет -- скопировать из .env.prod.example, предупредить)
- Поднять: postgres -> cms -> nginx последовательно
- Запустить build-site.sh между cms и nginx
- Вывести "Server ready"

**`scripts/setup-tunnel.sh`** -- подключение Cloudflare Tunnel:
- Проверить CLOUDFLARE_TUNNEL_TOKEN в .env.prod
- `docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared`
- Вывести инструкцию

### 3.5 `.env.prod.example`

```
DATABASE_URL=postgresql://dvizh:dvizh@postgres:5432/dvizh
PAYLOAD_SECRET=сгенерируй-через-openssl-rand-base64-32
SERVER_URL=https://your-domain.com
WEB_URL=https://your-domain.com
CMS_URL=http://cms:3002
FORM_WEBHOOK_URL=
CLOUDFLARE_TUNNEL_TOKEN=
```

### 3.6 Мелкие правки в существующие файлы

**`.gitignore`** -- добавить:
```
.env.prod
```

**`package.json` (корень)** -- добавить скрипты:
```json
"start:prod": "docker compose -f docker-compose.prod.yml up -d",
"stop:prod": "docker compose -f docker-compose.prod.yml down",
"build:prod": "bash scripts/build-site.sh",
"setup:prod": "bash scripts/setup-server.sh"
```

---

## Структура новых файлов

```
dvizh-new-era/
├── docker-compose.prod.yml     # СОЗДАТЬ
├── .env.prod.example           # СОЗДАТЬ
├── apps/cms/Dockerfile.prod    # СОЗДАТЬ
├── nginx/
│   └── nginx.conf              # СОЗДАТЬ
├── scripts/
│   ├── build-site.sh           # СОЗДАТЬ
│   ├── setup-server.sh         # СОЗДАТЬ
│   └── setup-tunnel.sh         # СОЗДАТЬ
└── SETUP-ISSUES.md             # СОЗДАТЬ если были проблемы
```

---

## Как проверить

### После Фазы 2:
- `curl http://localhost:3002/api/globals/navigation` -- CMS отвечает JSON
- `ls apps/web/dist/index.html` -- статика собрана

### После Фазы 3:
- `docker compose -f docker-compose.prod.yml config` -- валидный YAML
- Прочитай каждый файл, проверь согласованность портов и имен сервисов
- `shellcheck scripts/*.sh` -- если доступен
- `chmod +x scripts/*.sh`

---

## Файлы для справки (прочитай перед началом)

- `docker-compose.yml` -- текущий dev compose
- `apps/cms/package.json` -- зависимости и скрипты CMS
- `apps/cms/next.config.ts` -- конфиг Next.js (withPayload)
- `apps/cms/src/payload.config.ts` -- конфиг Payload (DB, CORS, media)
- `apps/web/package.json` -- зависимости Web
- `apps/web/astro.config.ts` -- конфиг Astro (output: 'static')
- `package.json` (корень) -- workspace scripts
- `pnpm-workspace.yaml` -- workspace config
- `.gitignore` -- текущий gitignore

---

## Важно

- Если что-то не получается установить или запустить -- записывай проблему в `SETUP-ISSUES.md` и продолжай дальше. Не застревай.
- CMS может долго стартовать в первый раз (Next.js компиляция). Подожди до 2 минут.
- Если `pnpm install` падает -- попробуй `pnpm install --no-frozen-lockfile`.
- Cloudflare Tunnel НЕ запускать -- только создать конфиг. Домен подключится утром вручную.
