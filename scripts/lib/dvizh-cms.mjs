/**
 * Общий клиент для host-скриптов мониторинга/бота dvizh.
 *
 * Назначение:
 *  - доступ к Payload CMS API (чтение/запись глобалов, чтение коллекций) с авторизацией;
 *  - отправка сообщений в Telegram через Bot API (токен из process.env.TELEGRAM_BOT_TOKEN).
 *
 * Зависимостей нет — только встроенный fetch (Node 18+).
 *
 * Авторизация к CMS (write-доступ к globals / read к form-submissions требует req.user):
 *  1) CMS_API_KEY  — предпочтительно. Заголовок `Authorization: users API-Key <key>`.
 *                     Требует useAPIKey:true на коллекции Users (делает трек CMS) + сгенерённый ключ.
 *  2) CMS_EMAIL + CMS_PASSWORD — fallback: логин через /api/users/login, далее JWT в заголовке.
 *
 * Никаких секретов в коде. Всё из окружения (.env.bot / docker env / LaunchAgent).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..')

/**
 * Лёгкий парсер .env (KEY=VALUE), не перетирает уже заданные process.env.
 * Используется, чтобы скрипты подхватывали .env.bot при ручном запуске без оболочки-обёртки.
 */
export function loadEnvFile(relativePath) {
  try {
    const full = join(PROJECT_ROOT, relativePath)
    const raw = readFileSync(full, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      // снять обрамляющие кавычки
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val
      }
    }
  } catch {
    // файла может не быть — это нормально (значения придут из docker/LaunchAgent env)
  }
}

// Подхватываем секреты/конфиг из локальных env-файлов (без перетирания реального окружения).
loadEnvFile('.env.bot')

export const CMS_BASE = (
  process.env.MONITOR_CMS_URL ||
  process.env.CMS_URL ||
  'http://cms.dvizh-new-era.orb.local:3002'
).replace(/\/$/, '')

export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a)
export { log }

// --- Авторизация к CMS ---------------------------------------------------

let cachedJwt = null

async function getAuthHeaders() {
  const apiKey = process.env.CMS_API_KEY
  if (apiKey) {
    return { Authorization: `users API-Key ${apiKey}` }
  }
  const email = process.env.CMS_EMAIL
  const password = process.env.CMS_PASSWORD
  if (email && password) {
    if (!cachedJwt) {
      const res = await fetch(`${CMS_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        throw new Error(`CMS login failed: ${res.status} ${await res.text()}`)
      }
      const data = await res.json()
      cachedJwt = data?.token
      if (!cachedJwt) throw new Error('CMS login: no token in response')
    }
    return { Authorization: `JWT ${cachedJwt}` }
  }
  // Без креденшелов — вернём пустые заголовки (сработает только для публичного read).
  return {}
}

// --- CMS API: globals ----------------------------------------------------

/** Прочитать глобал по slug. Возвращает объект данных или null. */
export async function getGlobal(slug) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${CMS_BASE}/api/globals/${slug}?depth=0`, {
    headers,
  })
  if (!res.ok) {
    throw new Error(`getGlobal(${slug}) failed: ${res.status}`)
  }
  return res.json()
}

/** Записать (частично) глобал по slug. Payload мержит переданные поля. */
export async function updateGlobal(slug, data) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${CMS_BASE}/api/globals/${slug}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(`updateGlobal(${slug}) failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

// --- CMS API: collections ------------------------------------------------

/** Последние записи коллекции (для /status: свежие заявки). */
export async function findRecent(slug, { limit = 5, sort = '-createdAt' } = {}) {
  const headers = await getAuthHeaders()
  const url = `${CMS_BASE}/api/${slug}?limit=${limit}&sort=${encodeURIComponent(sort)}&depth=0`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`findRecent(${slug}) failed: ${res.status}`)
  }
  return res.json()
}

/** Кол-во документов в коллекции, удовлетворяющих простому where (по дате). */
export async function countSince(slug, sinceISO) {
  const headers = await getAuthHeaders()
  const url = `${CMS_BASE}/api/${slug}?limit=0&where[createdAt][greater_than]=${encodeURIComponent(sinceISO)}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`countSince(${slug}) failed: ${res.status}`)
  }
  const data = await res.json()
  return data?.totalDocs ?? 0
}

// --- Telegram Bot API ----------------------------------------------------

function assertToken() {
  if (!TELEGRAM_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан (см. .env.bot / docker env)')
  }
}

const TG_API = () => `https://api.telegram.org/bot${TELEGRAM_TOKEN}`

/** Отправить текстовое сообщение в чат. */
export async function tgSendMessage(chatId, text, extra = {}) {
  assertToken()
  const res = await fetch(`${TG_API()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    }),
  })
  if (!res.ok) {
    throw new Error(`tgSendMessage(${chatId}) failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

/** Разослать сообщение в список чатов; ошибки отдельных чатов не роняют рассылку. */
export async function tgBroadcast(chatIds, text, extra = {}) {
  const results = []
  for (const id of chatIds || []) {
    try {
      await tgSendMessage(id, text, extra)
      results.push({ id, ok: true })
    } catch (err) {
      log(`tgBroadcast: чат ${id} — ошибка:`, err.message)
      results.push({ id, ok: false, error: err.message })
    }
  }
  return results
}

/** Long-poll получение апдейтов. */
export async function tgGetUpdates(offset, timeoutSec = 25) {
  assertToken()
  const url = `${TG_API()}/getUpdates?timeout=${timeoutSec}` + (offset ? `&offset=${offset}` : '')
  const res = await fetch(url, { signal: AbortSignal.timeout((timeoutSec + 10) * 1000) })
  if (!res.ok) {
    throw new Error(`tgGetUpdates failed: ${res.status}`)
  }
  return res.json()
}
