import type { CollectionConfig } from 'payload'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Сабмит формы', plural: 'Сабмиты форм' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'preset', 'createdAt'],
    description: 'Данные из форм на сайте. После сохранения отправляются в n8n/Albato.',
    group: 'Система',
  },
  access: {
    // Публичный POST для создания, только авторизованные для чтения
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'preset',
      type: 'select',
      label: 'Тип формы',
      required: true,
      options: [
        { label: 'Лид', value: 'lead' },
        { label: 'Подписка', value: 'subscribe' },
        { label: 'Демо', value: 'demo' },
        { label: 'Исследование', value: 'research' },
        { label: 'Автор', value: 'author' },
      ],
    },
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'company',
      type: 'text',
      label: 'Компания',
    },
    {
      name: 'topic',
      type: 'text',
      label: 'Тема материала',
    },
    {
      name: 'page',
      type: 'text',
      label: 'Страница',
      admin: { description: 'URL страницы, с которой отправлена форма' },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Только при создании новой заявки. Заявка УЖЕ сохранена в CMS (Postgres) —
        // это единственный обязательный шаг. Дальше — асинхронный fan-out, КАЖДЫЙ
        // внешний вызов в try/catch: его падение НЕ роняет приём заявки.
        if (operation !== 'create') return

        const preset = (doc?.preset as string) ?? ''

        // Запускаем рассылку в фоне (не блокируем ответ пользователю).
        void fanOut({ doc, preset, payload: req.payload })
      },
    ],
  },
}

type FanOutArgs = {
  doc: Record<string, unknown>
  preset: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}

/**
 * Асинхронная рассылка заявки во внешние сервисы. Каждый вызов изолирован в try/catch
 * и НИКОГДА не бросает наружу — заявка уже в базе, потерять её нельзя.
 */
async function fanOut({ doc, preset, payload }: FanOutArgs): Promise<void> {
  // Конфиг интеграций (Тип A)
  let config: {
    albatoWebhookUrl?: string | null
    rules?: Array<{ preset?: string; webhookUrl?: string | null; enabled?: boolean | null }> | null
  } = {}
  try {
    config = await payload.findGlobal({ slug: 'integrations-config' })
  } catch (err) {
    console.error('[form-fanout] Не удалось прочитать integrations-config:', err)
    return
  }

  // (1) Telegram-лид — ВСЕГДА включён (без тумблера): шлёт в allowedChatIds бота через TELEGRAM_BOT_TOKEN.
  // Молча пропускается, если токен/чаты не настроены (см. sendTelegramLead) — приём заявки не страдает.
  try {
    await sendTelegramLead({ doc, payload })
  } catch (err) {
    console.error('[form-fanout] Telegram лид — ошибка:', err)
  }

  // (2) Глобальный Albato-вебхук — все формы
  if (config?.albatoWebhookUrl) {
    try {
      await postWebhook(config.albatoWebhookUrl, doc)
    } catch (err) {
      console.error('[form-fanout] Albato вебхук — ошибка:', err)
    }
  }

  // (3) Доп. вебхуки правил, совпавших по preset
  const rules = Array.isArray(config?.rules) ? config.rules : []
  for (const rule of rules) {
    if (!rule?.enabled) continue
    if (rule?.preset !== preset) continue
    if (!rule?.webhookUrl) continue
    try {
      await postWebhook(rule.webhookUrl, doc)
    } catch (err) {
      console.error(`[form-fanout] Вебхук правила (${preset}) — ошибка:`, err)
    }
  }
}

async function postWebhook(url: string, doc: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
  if (!res.ok) {
    throw new Error(`Webhook ${url} вернул ${res.status}`)
  }
}

/**
 * Шлёт текст заявки в каждый чат из allowedChatIds через Bot API.
 * Токен — ТОЛЬКО из env TELEGRAM_BOT_TOKEN (секрет, НЕ хранить в БД/глобале).
 * Доставка всегда включена; молча пропускается, если токен или чаты не настроены.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendTelegramLead({ doc, payload }: { doc: Record<string, unknown>; payload: any }): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('[form-fanout] TELEGRAM_BOT_TOKEN не задан — лид в Telegram пропущен')
    return
  }

  const botConfig = await payload.findGlobal({ slug: 'bot-config' })
  const rawIds = botConfig?.allowedChatIds
  const chatIds: number[] = Array.isArray(rawIds) ? rawIds : []
  if (chatIds.length === 0) {
    console.error('[form-fanout] allowedChatIds пуст — некуда слать лид')
    return
  }

  const text = formatLead(doc)
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`

  for (const chatId of chatIds) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[form-fanout] Telegram sendMessage в чат ${chatId} вернул ${res.status}: ${body}`)
    }
  }
}

const PRESET_LABELS: Record<string, string> = {
  lead: 'Лид',
  subscribe: 'Подписка',
  demo: 'Демо',
  research: 'Исследование',
  author: 'Автор',
}

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatLead(doc: Record<string, unknown>): string {
  const preset = String(doc?.preset ?? '')
  const lines: string[] = [`<b>Новая заявка — ${esc(PRESET_LABELS[preset] ?? preset)}</b>`]
  if (doc?.name) lines.push(`Имя: ${esc(doc.name)}`)
  if (doc?.email) lines.push(`Email: ${esc(doc.email)}`)
  if (doc?.phone) lines.push(`Телефон: ${esc(doc.phone)}`)
  if (doc?.company) lines.push(`Компания: ${esc(doc.company)}`)
  if (doc?.topic) lines.push(`Тема: ${esc(doc.topic)}`)
  if (doc?.page) lines.push(`Страница: ${esc(doc.page)}`)
  return lines.join('\n')
}
