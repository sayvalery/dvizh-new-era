# Dvizh Site

Стек: Astro (статика) + Payload CMS v3 + PostgreSQL + Tailwind.

## Быстрый старт

### Требования
- Node.js 20+
- pnpm 9+
- Docker Desktop / OrbStack

### 1. Установить зависимости

```bash
pnpm install
```

### 2. Настроить окружение

```bash
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Поднять базу через Docker

```bash
docker compose up -d
```

### 4. Запустить CMS

```bash
pnpm --filter cms dev
```

CMS будет доступна на http://localhost:3002/admin

При первом запуске: http://localhost:3002/admin/create-first-user — создать первого пользователя.

### 5. Запустить Astro-сайт

В другом терминале:

```bash
pnpm --filter web dev
```

Сайт доступен на http://localhost:4321

## Структура

```
apps/
  web/    -- Astro-сайт (SSG)
  cms/    -- Payload CMS v3 (Next.js + REST API)
```

## Порты (локально)
- PostgreSQL: 5432
- Payload CMS: 3002
- Astro dev: 4321

> Порты 3000 и 3001 зарезервированы OrbStack.

## Страницы в коде (не CMS)

Главная, о нас, контакты, продукты (7), решения (3), for-whom (4) — в `apps/web/src/pages/`.
Редактируются через код напрямую.

## Страницы в CMS

Блог, видео, кейсы, исследования, категории — через Payload CMS.
Навигация и футер — через Payload Globals.

## Публикация контента

1. Открыть http://localhost:3002/admin
2. Создать запись → нажать Publish
3. Пересобрать Astro: `pnpm --filter web build`

## Коллекции CMS

- **BlogPosts** — статьи блога
- **Videos** — вебинары, конференции, подкасты
- **Research** — исследования (с PDF)
- **Cases** — кейсы клиентов
- **Categories** — категории блога
- **Media** — медиафайлы
- **Users** — пользователи CMS
- **FormSubmissions** — сабмиты форм

## Globals

- **Navigation** — навигационное меню
- **Footer** — футер
