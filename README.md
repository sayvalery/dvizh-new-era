# ДВИЖ — сайт dvizh.io

Монорепозиторий нового сайта **dvizh.io** (заменяет старую версию на Webflow): статический сайт на Astro + headless-CMS на Payload.

ДВИЖ — AI-платформа автоматизации продаж и маркетинга для застройщиков.

## Стек

- **Astro 5** — статический генератор сайта (SSG, `output: 'static'`)
- **Payload CMS v3** (Next.js 15 + PostgreSQL) — headless-CMS для блога, кейсов, словаря и т.д.
- **Tailwind CSS 3.4** + `@tailwindcss/typography`
- **Alpine.js 3** — единственный клиентский JS (~15 КБ). React/Vue/Svelte не используются.
- **TypeScript**, шрифты Styrene A + Inter (локальные), бренд-цвет `#ff4d00`

## Структура

```
apps/
├── web/   — Astro-сайт (SSG). Компоненты, страницы, lib/payload.ts (клиент CMS)
└── cms/   — Payload CMS v3 (коллекции, глобалы, payload.config.ts)
nginx/                  — конфиг nginx (прод)
docker-compose.prod.yml — прод-сервисы (postgres, cms, nginx, cloudflared)
scripts/                — сборка/деплой/бэкапы/мониторинг
docs/superpowers/specs/ — дизайн-документы (spec) по фичам
CLAUDE.md               — подробные конвенции и архитектура (главный источник правды для разработки)
```

## Требования

- Node.js 20+
- pnpm 9+
- Docker (OrbStack / Docker Desktop) — для PostgreSQL и CMS

## Быстрый старт

```bash
pnpm install

# окружение (заполнить значения)
cp apps/web/.env.example apps/web/.env
cp apps/cms/.env.example apps/cms/.env

# поднять PostgreSQL + CMS
docker compose up -d

# дев-серверы (в разных терминалах)
pnpm dev        # Astro-сайт → http://localhost:4321
pnpm dev:cms    # Payload CMS → http://localhost:3002/admin
```

Первый запуск CMS: `http://localhost:3002/admin/create-first-user`. Порты 3000/3001 заняты OrbStack.

## Команды

| Команда | Назначение |
|---------|-----------|
| `pnpm dev` | дев-сервер сайта (Astro) |
| `pnpm dev:cms` | дев-сервер CMS (Payload) |
| `pnpm build` | сборка статики сайта |
| `pnpm build:prod` | прод-сборка + деплой (`scripts/build-site.sh`) |
| `pnpm start:prod` / `pnpm stop:prod` | поднять/остановить прод-сервисы (docker compose) |

## Контент и сборка

Контент тянется из CMS **на этапе сборки**. Сайт статический — новый контент и страницы появляются на проде только после пересборки. Часть страниц (главная, продуктовые, о нас и т.д.) живёт в коде `apps/web/src/pages/`; блог, кейсы, исследования, видео, словарь — в CMS. Навигация и футер **захардкожены** в компонентах (не из CMS).

## Деплой

Прод-сайт — статика: собирается и заливается на сервер через `scripts/build-site.sh` (rsync + переключение симлинка + reload nginx). CMS работает в Docker. Детали инфраструктуры, доменов и модели веток — в `CLAUDE.md`.

## Документация

- **`CLAUDE.md`** — архитектура, конвенции, ограничения (запрещённые зависимости, токены дизайн-системы, работа с медиа, модель веток, подводные камни). Читать перед разработкой.
- **`docs/superpowers/specs/`** — дизайн-документы по конкретным фичам.

## Ограничения (кратко, полностью — в `CLAUDE.md`)

- Только `.astro`-компоненты; никаких React/Vue/Svelte и UI-библиотек на фронте.
- Стили — Tailwind-классы; цвета — токены (`text-brand`), не хардкод hex.
- Интерактивность — Alpine.js; тяжёлый клиентский JS не добавляется.
- Перед добавлением любой npm-зависимости — согласование.
