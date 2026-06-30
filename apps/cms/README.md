# apps/cms — CMS dvizh.io (Payload v3)

Headless-CMS на Payload v3 (Next.js 15 + PostgreSQL). Отдаёт контент сайту (`apps/web`) через REST API на этапе сборки и обслуживает админку.

## Команды

```bash
pnpm --filter cms dev               # дев-сервер → http://localhost:3002/admin
pnpm --filter cms generate:types    # типы из конфига
pnpm --filter cms generate:importmap # карта импортов admin-компонентов
```

Требует поднятый PostgreSQL (`docker compose up -d` из корня). Первый запуск: `/admin/create-first-user`.

## Структура

```
src/
├── collections/  BlogPosts, Categories, Tags, Persons, Companies, Videos,
│                 Research, Cases, Glossaries, Events, Media, Users, FormSubmissions, PageScripts
├── globals/      IntegrationsConfig, BotConfig, MonitorStatus
├── blocks/       FormBlock, CTABlock, ImageBlock, VideoBlock, QuoteBlock, RichText
├── components/   кастомные admin-компоненты (.tsx)
└── payload.config.ts
```

## Заметки

- Заявки форм (`form-submissions`) после сохранения уходят в внешние сервисы (afterChange-хук): Telegram + Albato. Настройка — в глобале «Интеграции заявок».
- Медиа хранится в `apps/cms/media/` (gitignored), отдаётся по `/api/media/file/...`.
- Изменения схемы: `push: true` накатывает при пересборке контейнера (см. подводные камни в корневом `CLAUDE.md`).
