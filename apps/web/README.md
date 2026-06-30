# apps/web — сайт dvizh.io (Astro)

Статический сайт (Astro 5, SSG). Контент тянется из CMS (`apps/cms`) на этапе сборки через `src/lib/payload.ts`.

## Команды

```bash
pnpm --filter web dev     # дев-сервер → http://localhost:4321
pnpm --filter web build   # сборка статики в apps/web/dist
```

(из корня монорепо — `pnpm dev` / `pnpm build`).

## Структура

```
src/
├── components/   blocks/ (CMS-блоки), layout/ (Header, Footer — хардкод), ui/ (переиспользуемые)
├── layouts/      BaseLayout, SiteLayout, BlogLayout
├── lib/payload.ts  клиент CMS, normalizeMediaUrl()/normalizeBodyHtml()
├── pages/        страницы (продуктовые в коде + CMS-driven маршруты)
└── styles/global.css  @font-face, утилиты
```

## Конвенции

Только `.astro`-компоненты, Tailwind-классы, токены цвета (`text-brand`), Alpine.js для интерактива. Каталог компонентов — `/ui-kit` (только dev). Полные правила — в корневом `CLAUDE.md`.
