# Build Safety Roadmap

**Date:** 2026-02-27
**Status:** Active

## Done (v1)

- [x] Blue-green deploy: backup dist-prev, build, validate, rollback on failure
- [x] validate-build.sh: 8 checks (index, sections, page count regression, tiny files, placeholders, sitemap, fonts, CSS)
- [x] build-site.sh: status JSON + deploy.log
- [x] deploy-webhook.js: GET /build-status, concurrent protection, CORS
- [x] DeployButton.tsx: step checklist in CMS admin, calm failure messages
- [x] nginx proxy: /deploy and /build-status for CMS admin
- [x] payload.ts: retry 3x, 5s timeout, exponential backoff

## Next: Telegram notifications (v2)

- Создать бота через BotFather, получить token
- Создать канал/чат для уведомлений, получить chat_id
- Раскомментировать notify() в build-site.sh, добавить TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.prod
- Уведомления: успех (кратко), ошибка (с деталями шага)

## Next: Health-check daemon (v3)

- `scripts/healthcheck.sh` через LaunchAgent (каждые 5 минут)
- Проверяет: dvizh.cc отдаёт 200, CMS жива, tunnel подключён
- При проблеме: перезапуск контейнера, уведомление в Telegram
- Лог в logs/healthcheck.log

## Next: Form testing (v4)

- POST тестовой формы на /api/form-submissions после каждого деплоя
- Проверить что CMS принимает и возвращает 200/201
- Добавить шаг "forms" в build-status.json и чеклист в CMS

## Next: CMS publish status in admin dashboard (v5)

- afterDashboard компонент в Payload CMS
- Показывает: последний деплой (время, статус, кол-во страниц)
- История последних 10 деплоев (из deploy.log)
- Кнопка "Опубликовать" прямо на дашборде

## Ideas (backlog)

- Lighthouse CI: проверка производительности после билда (score > 90)
- Visual regression: скриншоты ключевых страниц до/после
- Canary deploy: отдавать новый билд 10% трафика, мониторить ошибки
- Автоматический билд по webhook из CMS при публикации контента (сейчас вручную)
- Rollback UI: кнопка "откатить к предыдущей версии" в CMS
