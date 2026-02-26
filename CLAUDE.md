# Dvizh.io — Правила проекта

## Стек

- **Astro 5** — статический генератор (SSG, `output: 'static'`)
- **Tailwind CSS 3.4** — утилитарные стили + `@tailwindcss/typography` для prose
- **Alpine.js 3** — лёгкая интерактивность (x-data, x-show, @click, x-transition)
- **Payload CMS v3** — headless CMS (Next.js 15, PostgreSQL)
- **TypeScript** — строгая типизация

## Ограничения (ВАЖНО)

- **Запрещённые зависимости:** React, Vue, Svelte, любые UI-библиотеки, CSS-in-JS, анимационные библиотеки. Перед добавлением ЛЮБОЙ новой npm-зависимости — спроси у пользователя.
- **Компоненты:** только `.astro` файлы. Никаких `.tsx`, `.jsx`, `.vue`.
- **Стили:** Tailwind-классы inline на компонентах. Общие стили (анимации, утилиты) — только в `apps/web/src/styles/global.css` через `@layer`. Не создавать отдельные .css файлы для компонентов.
- **Интерактивность:** Alpine.js для состояния и переходов. Inline vanilla JS для простых случаев (формы). Не подключать jQuery, GSAP и т.д.
- **JS на клиенте:** минимум. Сейчас отгружается только Alpine.js (~15KB). Так и должно оставаться.

## Структура компонентов

```
apps/web/src/components/
├── layout/     — обёртки (Header, Footer)
├── ui/         — переиспользуемые UI (Form, NavBar, Drawer, PersonCard)
└── blocks/     — рендерят CMS-данные (BlockRenderer, RichTextBlock, ImageBlock, FormBlock, CTABlock, VideoBlock, QuoteBlock)
```

## Каталог компонентов

Перед созданием нового компонента — ОБЯЗАТЕЛЬНО проверь этот список и реальные файлы в `apps/web/src/components/`. Если есть похожий — расширь его, а не создавай дубликат.

### layout/
- **Header.astro** — навигация с логотипом, меню, CTA-кнопка
- **Footer.astro** — футер с динамическими колонками из CMS

### ui/
- **NavBar.astro** — переиспользуемый navbar (логотип, меню, дропдауны, мобильное меню). Alpine.js
- **Drawer.astro** — глобальная боковая панель для форм. Alpine.js, событие `open-drawer`
- **Form.astro** — контактная форма с 4 пресетами (lead, subscribe, demo, research). Два лейаута: stacked, labels-left
- **PersonCard.astro** — карточка персоны. Два варианта: full (44px), inline (24px)

### blocks/
- **BlockRenderer.astro** — маршрутизатор блоков по типу
- **RichTextBlock.astro** — Lexical JSON → HTML, prose-стили
- **ImageBlock.astro** — картинка с подписью
- **FormBlock.astro** — форма внутри контента (серый фон)
- **CTABlock.astro** — тёмный баннер с кнопкой (открывает дровер или ссылка)
- **VideoBlock.astro** — YouTube/Vimeo с подписью
- **QuoteBlock.astro** — цитата с чёрной полосой слева

## Конвенции

- **Именование:** PascalCase, расширение .astro
- **Props:** TypeScript interface в frontmatter
- **Комментарии:** JSDoc-блок в начале файла с описанием компонента, пропсов, примеров
- **Папки:** layout/ для обёрток, ui/ для переиспользуемых, blocks/ для CMS-контента
- **CMS данные:** все функции получения в `apps/web/src/lib/payload.ts`
- **Импорты:** `@/` = `src/`, `@cms/` = `../cms/src/`

## Процесс интеграции дизайна

При добавлении новых компонентов, страниц или интеграции дизайна из Figma/Pencil.dev — ОБЯЗАТЕЛЬНО следовать этому процессу:

1. **Анализ входящего** — что это (страница, секция, компонент), какие элементы внутри
2. **Сопоставление с существующими** — проверить каталог выше и файлы в `components/`. Показать пользователю: что переиспользуется, что создаётся новое
3. **План интеграции** — что переиспользуется, что создаётся (и почему нельзя переиспользовать), какие файлы затронуты. Подтверждение перед работой
4. **Реализация** — код по конвенциям выше. Обновить каталог компонентов в этом файле если создан новый
5. **Проверка** — после завершения работы с компонентами/страницами вызвать скилл `frontend-check`

## Команды

- `pnpm dev` — запуск Astro dev-сервера (localhost:4321)
- `pnpm dev:cms` — запуск CMS (localhost:3002)
- `pnpm build` — сборка статики
- `docker compose up -d` — поднять PostgreSQL

## Окружение

- **Dev:** CMS на localhost:3002, сайт на localhost:4321, Vite прокси `/api` и `/media`
- **Prod:** nginx раздаёт статику, проксирует `/api`, `/media`, `/admin` на CMS
- **Формы:** POST `/api/form-submissions`, `PUBLIC_CMS_URL` env var (пустой = same origin через nginx)
