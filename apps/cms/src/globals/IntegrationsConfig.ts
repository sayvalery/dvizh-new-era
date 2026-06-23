import type { GlobalConfig } from 'payload'

/**
 * Интеграции заявок (Тип A) — маршрутизация лидов в реальном времени.
 *
 * Конфиг для afterChange-хука FormSubmissions: общий Albato-вебхук (берёт на себя
 * ретраи/роутинг), глобальный тумблер Telegram-лидов и доп. вебхуки по пресету.
 * Редактирует маркетинг.
 */
export const IntegrationsConfig: GlobalConfig = {
  slug: 'integrations-config',
  label: 'Интеграции заявок',
  admin: {
    description:
      'Куда улетают заявки после сохранения. Все формы → Albato; плюс Telegram-лиды и доп. вебхуки по типу формы.',
    group: 'Интеграции',
  },
  access: {
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'albatoWebhookUrl',
      type: 'text',
      label: 'Albato Webhook URL',
      admin: {
        description:
          'Все заявки POST-ятся сюда. Albato берёт на себя ретраи и роутинг к нижестоящим сервисам. Пусто = не отправлять.',
      },
    },
    {
      name: 'telegramLeadEnabled',
      type: 'checkbox',
      label: 'Слать лиды в Telegram',
      defaultValue: false,
      admin: {
        description: 'Если включено — каждая заявка уходит в авторизованные чаты бота.',
      },
    },
    {
      name: 'rules',
      type: 'array',
      label: 'Правила по типу формы',
      admin: {
        description: 'Доп. вебхук для конкретного пресета (например, subscribe → рассыльщик).',
      },
      fields: [
        {
          name: 'preset',
          type: 'select',
          label: 'Тип формы',
          required: true,
          options: [
            { label: 'Демо', value: 'demo' },
            { label: 'Лид', value: 'lead' },
            { label: 'Исследование', value: 'research' },
            { label: 'Подписка', value: 'subscribe' },
          ],
        },
        {
          name: 'webhookUrl',
          type: 'text',
          label: 'Webhook URL',
          required: true,
        },
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Включено',
          defaultValue: true,
        },
      ],
    },
  ],
}
