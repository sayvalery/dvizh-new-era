import type { GlobalConfig } from 'payload'

/**
 * Конфиг Telegram-бота — пишется/читается host-скриптом бота через CMS API.
 *
 * Первый, кто активировал бот (/start), становится владельцем (ownerTelegramId).
 * Дальше только владелец командой /register добавляет чаты в allowlist.
 */
export const BotConfig: GlobalConfig = {
  slug: 'bot-config',
  label: 'Глубокие настройки',
  admin: {
    description:
      'Доставка заявок в Telegram. Владелец и базовый чат зашиты в код и работают всегда. Здесь — дополнительные чаты (добавляются ботом через /register или вручную).',
    group: 'Интеграции',
  },
  access: {
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'ownerTelegramId',
      type: 'number',
      label: 'ID владельца',
      admin: {
        description: 'Выставляется автоматически первым активатором бота (/start). Пусто = не активирован.',
      },
    },
    {
      name: 'allowedChatIds',
      type: 'json',
      label: 'Разрешённые чаты (ID)',
      defaultValue: [],
      admin: {
        description: 'Массив числовых ID чатов, где бот отвечает. Управляется командой /register.',
      },
    },
  ],
}
