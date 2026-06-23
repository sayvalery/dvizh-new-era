import type { GlobalConfig } from 'payload'

/**
 * Статус мониторинга — пишется host-скриптом монитора (~раз в 30 мин) через CMS API,
 * читается статус-страницей в админке и Telegram-ботом (/status).
 *
 * Один источник данных для двух мест показа (Payload-страница + бот; позже Mini App).
 */
export const MonitorStatus: GlobalConfig = {
  slug: 'monitor-status',
  label: 'Статус мониторинга',
  admin: {
    description: 'Снимок здоровья сайта. Заполняется автоматически монитором — вручную не редактировать.',
    group: 'Интеграции',
  },
  access: {
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'lastPingAt',
      type: 'text',
      label: 'Последний пинг (ISO)',
      admin: { description: 'Время последней проверки, ISO-строка.' },
    },
    {
      name: 'pagesOk',
      type: 'checkbox',
      label: 'Страницы отвечают',
      defaultValue: false,
    },
    {
      name: 'formsOk',
      type: 'checkbox',
      label: 'Приём форм жив',
      defaultValue: false,
    },
    {
      name: 'cmsOk',
      type: 'checkbox',
      label: 'CMS/база жива',
      defaultValue: false,
    },
    {
      name: 'backupOk',
      type: 'checkbox',
      label: 'Бэкап свежий',
      defaultValue: false,
    },
    {
      name: 'backupAt',
      type: 'text',
      label: 'Время бэкапа (ISO)',
    },
    {
      name: 'leadsToday',
      type: 'number',
      label: 'Заявок за сегодня',
      defaultValue: 0,
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Заметка / детали сбоя',
    },
  ],
}
