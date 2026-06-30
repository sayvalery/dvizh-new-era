import type { GlobalConfig } from 'payload'

/**
 * Конфиг Telegram-бота — пишется/читается host-скриптом бота через CMS API.
 *
 * Первый, кто активировал бот (/start), становится владельцем (ownerTelegramId).
 * Дальше только владелец командой /register добавляет чаты в allowlist.
 */
export const BotConfig: GlobalConfig = {
  slug: 'bot-config',
  label: '⚠️ Служебное — не трогать',
  admin: {
    description:
      'Системная конфигурация доставки заявок. Настраивается один раз и дальше управляется автоматически. Вручную не редактировать.',
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
      label: 'ID владельца (служебное)',
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
