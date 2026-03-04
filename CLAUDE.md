# ДВИЖ — Новая платформа (dvizh-new-era)

## О проекте

ДВИЖ — AI-платформа для автоматизации продаж и маркетинга застройщиков. 75 из ТОП-100 крупнейших застройщиков России используют ДВИЖ. Более 1,5 млн заявок обработано.

Этот репозиторий — **новая версия сайта dvizh.io**, заменяющая старый на Webflow. Монорепо с двумя приложениями: статический сайт (Astro) и CMS (Payload).

**Компания:** ООО «Цифровые продажи», ИНН 7716899078, ОГРН 1187746227020
**Основатели:** Роман Гуров (CEO), Максим Ершов
**Контакт:** make@dvizh.io, +7 495 032-10-47

## Стек

- **Astro 5** — статический генератор (SSG, `output: 'static'`)
- **Tailwind CSS 3.4** — утилитарные стили + `@tailwindcss/typography` для prose
- **Alpine.js 3** — лёгкая интерактивность (~15KB на клиенте, единственный JS)
- **Payload CMS v3** — headless CMS (Next.js 15, PostgreSQL)
- **TypeScript** — строгая типизация
- **Шрифты:** Styrene A (заголовки, font-heading), Inter (основной текст, font-sans) — локальные .ttf в `public/fonts/`
- **Бренд-цвет:** `#ff4d00` (оранжевый), в Tailwind как `brand` с шкалой 50–900

## Серверная инфраструктура

### Физический сервер
MacBook с macOS, OrbStack (Docker), Cloudflare Tunnel. Автозапуск через LaunchAgent `com.dvizh.autostart`.

### Три домена
| Домен | Что обслуживает | Бэкенд |
|-------|----------------|--------|
| **dvizh.cc** | Статический сайт (514 стр.) | nginx → dist/ + CMS proxy |
| **admin.dvizh.cc** | Админка CMS | nginx → Payload CMS |
| **preview.dvizh.cc** | Dev-сервер (HMR) | nginx → localhost:4321 |

### Docker Compose (docker-compose.prod.yml)
| Сервис | Образ | Порт |
|--------|-------|------|
| postgres | postgres:16-alpine | 5432 (внутр.) |
| cms | dvizh-new-era-cms | 3002 |
| nginx | nginx:1.27-alpine | 80 |
| cloudflared | cloudflare/cloudflared | — (tunnel) |

### Ключевые скрипты
- `scripts/autostart.sh` — автозапуск после перезагрузки (Docker → Postgres → CMS → nginx → tunnel → dev server)
- `scripts/build-site.sh` — сборка статики + рестарт nginx
- `scripts/fix-media-filenames.sh` — декодирование URL-encoded имён файлов в CMS медиа (после миграции из Webflow)

## Ограничения (ВАЖНО)

- **Запрещённые зависимости:** React, Vue, Svelte, любые UI-библиотеки, CSS-in-JS, анимационные библиотеки. Перед добавлением ЛЮБОЙ новой npm-зависимости — спроси у пользователя.
- **Компоненты:** только `.astro` файлы. Никаких `.tsx`, `.jsx`, `.vue`.
- **Стили:** Tailwind-классы inline. Общие стили — только в `apps/web/src/styles/global.css` через `@layer`. Не создавать отдельные .css файлы.
- **Цвета:** использовать Tailwind-токены (`text-brand`, `bg-brand-600`), НЕ хардкодить hex (`text-[#ff4d00]`).
- **Интерактивность:** Alpine.js для состояния. Inline vanilla JS для простых случаев. Не подключать jQuery, GSAP и т.д.
- **JS на клиенте:** минимум. Только Alpine.js (~15KB). Так и должно оставаться.

## Структура проекта

```
apps/
├── web/                    — Astro-сайт (SSG)
│   ├── src/
│   │   ├── components/
│   │   │   ├── blocks/     — CMS-блоки (BlockRenderer, RichTextBlock, ImageBlock, FormBlock, CTABlock, VideoBlock, QuoteBlock)
│   │   │   ├── layout/     — Header, Footer (хардкожены, НЕ из CMS)
│   │   │   └── ui/         — Form, NavBar, Drawer, HeroSection, StatsSection, FeaturesGrid, CTA, BentoGrid, PersonCard, Timeline, SuccessStoriesCarousel, SuccessStory, FormClosing
│   │   ├── layouts/        — BaseLayout, SiteLayout, BlogLayout
│   │   ├── lib/payload.ts  — CMS-клиент, все функции получения данных
│   │   ├── pages/          — все страницы (см. ниже)
│   │   └── styles/global.css — @font-face, анимации, утилиты
│   ├── public/fonts/       — Styrene A (.ttf) + Inter (.ttf)
│   ├── tests/build-smoke.sh — smoke-тесты сборки
│   └── dist/               — собранная статика (nginx обслуживает)
├── cms/                    — Payload CMS v3
│   └── src/
│       ├── collections/    — BlogPosts, Categories, Tags, Persons, Companies, Videos, Research, Cases, Glossaries, Events, Media, Users, FormSubmissions
│       └── payload.config.ts
nginx/nginx.conf            — конфигурация nginx
docker-compose.prod.yml     — продакшн-сервисы
```

## Страницы сайта

### Продуктовые (статические)
| Страница | Файл | Заметки |
|----------|------|---------|
| Главная | `index.astro` | ⚠️ Команда управляет сама, не трогать |
| Ипотека | `ipoteka.astro` | ⚠️ Команда управляет сама, не трогать |
| Э-регистрация | `elektronnaya-registraciya.astro` | |
| Калькулятор | `ipotechnyy-kalkulyator.astro` | |
| QBR (аналитика) | `qbr.astro` | |
| Личный кабинет | `lichnyy-kabinet.astro` | |
| Витрина | `vitrina.astro` | |
| Скоринг | `scoring.astro` | |
| Для банков | `banki.astro` | |
| Для девелоперов | `developers.astro` | |
| Для агентств | `agentstva-nedvizhimosti.astro` | |
| О нас | `about.astro` | |
| Контакты | `contacts.astro` | |

### CMS-driven (динамические при сборке)
| Раздел | Маршруты | CMS-функция |
|--------|---------|-------------|
| Блог | `/blog`, `/blog/[slug]`, `/blog/page/[page]` | `getBlogPosts()`, `getBlogPost()` |
| Категории | `/category/[category]` | `getCategories()` |
| Глоссарий | `/slovar-developera`, `/slovar-developera/[slug]` | `getGlossaries()`, `getGlossaryItem()` |
| Кейсы | `/cases`, `/cases/[slug]` | `getCases()`, `getCase()` |
| Исследования | `/research`, `/research/[slug]` | `getResearch()`, `getResearchItem()` |
| Видео | `/video`, `/video/[slug]` | `getVideos()`, `getVideo()` |
| Авторы | `/person/[slug]` | `getPerson()`, `getPostsByPerson()` |
| Компании | `/companies/[slug]` | `getCompany()`, `getPersonsByCompany()` |

### Dev-only
- `/ui-kit` — каталог компонентов (только в dev)
- `/lab/*` — эксперименты с дизайном (только в dev)

## Работа с изображениями

CMS хранит медиа в `/app/apps/cms/media/` внутри Docker-контейнера. URL на фронтенде — всегда относительные: `/api/media/file/...`.

**Ключевые функции в `payload.ts`:**
- `normalizeMediaUrl(url)` — убирает абсолютный origin, декодирует двойное URL-кодирование (`%2520` → `%20`)
- `normalizeBodyHtml(html)` — то же для HTML-контента (bodyHtml из Webflow)

**Правило:** при использовании `block.photo?.url`, `post.cover?.url` и т.д. — ВСЕГДА оборачивать в `normalizeMediaUrl()`.

**Nginx:** запросы `/api/*` и `/media/*` проксируются к CMS. Статические ассеты (CSS, JS, шрифты, картинки из dist) отдаются напрямую.

## Навигация и футер

**Хардкожены** в компонентах `Header.astro` и `Footer.astro`. НЕ берутся из CMS. CMS-глобалы Navigation и Footer удалены из конфига — не нужны.

Если нужно изменить навигацию или футер — редактируй файлы напрямую:
- `apps/web/src/components/layout/Header.astro` (+ NavBar.astro)
- `apps/web/src/components/layout/Footer.astro`

## CTA и формы

Все кнопки «Запросить демо» открывают **Drawer** (боковая панель с формой), а не ссылаются на `#form`.

Компонент `CTA.astro` поддерживает `drawerPreset` prop: `'demo' | 'lead' | 'research' | 'subscribe'`. При `buttonHref="#"` автоматически открывает drawer.

Формы отправляются POST на `/api/form-submissions`. В dev — через Vite proxy, в prod — через nginx proxy к CMS.

## Каталог компонентов — UI Kit

**Источник правды:** страница `/ui-kit` (файл `apps/web/src/pages/ui-kit/[...slug].astro`). Доступна только в dev-режиме.

Перед созданием нового компонента — ОБЯЗАТЕЛЬНО проверь UI Kit и файлы в `apps/web/src/components/`. Если есть похожий — расширь, а не дублируй.

При добавлении нового компонента — ОБЯЗАТЕЛЬНО добавь в UI Kit с демо-примерами.

## Конвенции

- **Именование:** PascalCase, расширение .astro
- **Props:** TypeScript interface в frontmatter
- **Комментарии:** JSDoc-блок в начале файла
- **Папки:** layout/ для обёрток, ui/ для переиспользуемых, blocks/ для CMS-контента
- **CMS данные:** все функции в `apps/web/src/lib/payload.ts`
- **Импорты:** `@/` = `src/`, `@cms/` = `../cms/src/`

## Процесс интеграции дизайна

1. **Анализ** — что это (страница, секция, компонент)
2. **Сопоставление** — проверить существующие компоненты в UI Kit
3. **План** — что переиспользуется, что создаётся новое. Подтверждение перед работой
4. **Реализация** — код по конвенциям. Добавить в UI Kit
5. **Проверка** — вызвать скилл `frontend-check`

## Работа в команде

### Ветки

```
dev   ← рабочая ветка, все мерджат сюда, preview.dvizh.cc
main  ← прод, обновляется ТОЛЬКО через CMS или Valery, dvizh.cc
```

Каждый участник — в **своей ветке** (по `git config user.name`), ответвлённой от `dev`.
В `main` напрямую НЕ коммитить. В `dev` напрямую НЕ коммитить — только через мерж из своей ветки.

### Рабочий процесс

- **Начало** — скилл `sync` (или «начни работу») → переключает на ветку, rebase на dev
- **Публикация** — «опубликуй» → мерж в `dev`, push
- **Деплой** — кнопка «Опубликовать» в CMS → собирает из `dev`, валидирует, деплоит
- **Прод (main)** — обновляется только Valery или через CMS после деплоя
- **Конфликты** — визард с показом обоих вариантов

## Команды

```bash
pnpm dev              # Astro dev-сервер (localhost:4321)
pnpm dev:cms          # CMS (localhost:3002)
pnpm build            # Сборка статики (pnpm --filter web build)
bash scripts/build-site.sh   # Сборка + деплой (рестарт nginx)
bash apps/web/tests/build-smoke.sh  # Smoke-тесты сборки
docker compose -f docker-compose.prod.yml up -d  # Все сервисы
docker compose -f docker-compose.prod.yml logs cms --tail 20  # Логи CMS
```

## Переменные окружения (apps/web/.env)

| Переменная | Назначение | Значение |
|-----------|-----------|---------|
| `CMS_URL` | URL CMS для сборки (server-side) | `http://cms.dvizh-new-era.orb.local:3002` |
| `VITE_PROXY_CMS` | IP CMS для Vite dev proxy (c-ares не резолвит .orb.local) | `http://192.168.138.3:3002` |
| `PUBLIC_CMS_URL` | URL CMS для клиента (пустой = same origin через nginx) | (пустой) |
| `SITE_URL` | Каноничный URL сайта | `https://dvizh.io` |

## Подводные камни

- **OrbStack DNS:** `.orb.local` резолвится системными утилитами и Node.js fetch, но НЕ резолвится через Vite http-proxy (c-ares). Поэтому `VITE_PROXY_CMS` — отдельная переменная с IP.
- **Nginx static vs proxy:** regex-location для статики `~* \.(png|jpg|...)$` исключает `/api/` и `/media/` через negative lookahead, иначе перехватывает картинки CMS.
- **Медиа-файлы из Webflow:** хранились с URL-encoded именами (literal `%20` в имени файла). Декодированы скриптом `fix-media-filenames.sh`. При повторном импорте — запустить снова.
- **Astro getStaticPaths:** выполняется в изолированном scope — константы должны быть внутри функции или продублированы.
- **Блог-пагинация:** статическая, 12 постов/стр. Страница 1 = `/blog`, далее `/blog/page/2`, `/blog/page/3`...
