import type { CollectionConfig } from 'payload'

/**
 * Скрипты страниц (Тип B) — пиксели/теги, вставляемые на сборке (SSG).
 *
 * Маркетинг создаёт именованные записи с СЫРЫМ сниппетом (готовый код из своего
 * сервиса — Яндекс.Метрика, Google Tag и т.п.). На сборке layout фронта по группе
 * текущей страницы инжектит подходящие включённые сниппеты в <head> или конец <body>.
 *
 * Чтение открыто фронту (build-time), правка — авторизованным (редактор/маркетинг).
 */
export const PageScripts: CollectionConfig = {
  slug: 'page-scripts',
  labels: { singular: 'Скрипт страниц', plural: 'Скрипты страниц' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'placement', 'enabled', 'updatedAt'],
    description:
      'Сырые сниппеты (пиксели, теги аналитики). Появляются на сайте ПОСЛЕ пересборки («Опубликовать»).',
    group: 'Интеграции',
  },
  access: {
    // Фронту нужен read на сборке (server-side, без авторизации)
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Название',
      required: true,
      admin: { description: 'Для себя: «Яндекс.Метрика», «Google Tag» и т.п.' },
    },
    {
      name: 'code',
      type: 'textarea',
      label: 'Код',
      required: true,
      admin: {
        description:
          'СЫРОЙ сниппет целиком (включая теги <script>). Вставляется как есть. Поля «тип» нет — копируйте готовый код из своего сервиса.',
        rows: 10,
      },
    },
    {
      name: 'placement',
      type: 'select',
      label: 'Куда вставлять',
      required: true,
      defaultValue: 'head',
      options: [
        { label: '<head>', value: 'head' },
        { label: 'Конец <body>', value: 'body-end' },
      ],
    },
    {
      name: 'scope',
      type: 'select',
      label: 'Где показывать',
      hasMany: true,
      required: true,
      defaultValue: ['all'],
      admin: {
        description: 'Группы страниц. «Весь сайт» перекрывает остальные.',
      },
      options: [
        { label: 'Весь сайт', value: 'all' },
        { label: 'Главная', value: 'home' },
        { label: 'Блог (/blog/*)', value: 'blog' },
        { label: 'Глоссарий (/slovar-developera/*)', value: 'glossary' },
        { label: 'Кейсы', value: 'cases' },
        { label: 'Исследования', value: 'research' },
        { label: 'Видео', value: 'video' },
        { label: 'Продуктовые', value: 'product' },
      ],
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Включён',
      defaultValue: false,
      admin: { description: 'Выключенные не попадают на сайт.' },
    },
  ],
}
