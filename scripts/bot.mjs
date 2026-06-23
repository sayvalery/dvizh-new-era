#!/usr/bin/env node
/**
 * scripts/bot.mjs — Telegram-бот dvizh (host-скрипт, ТРЕК 5).
 *
 * Long-poll (getUpdates). Команды:
 *  /start    — если ownerTelegramId в глобале `bot-config` пуст → выставить = отправитель
 *              (первый активатор = владелец), ответить «вы владелец». Иначе обычный ответ.
 *  /register — ТОЛЬКО владелец → добавить текущий chat.id в allowedChatIds (allowlist).
 *  /status   — прочитать monitor-status + последние заявки из CMS → ответить текстом.
 *              Доступно только в чатах из allowlist.
 *
 * Безопасность: бот реагирует на команды только в авторизованных чатах
 *  (chat.id ∈ allowedChatIds), КРОМЕ /start и /register, которые завязаны на владельца:
 *   - /start работает всегда (нужно для первичной активации/назначения владельца);
 *   - /register принимает только от владельца.
 *
 * Конфиг владельца/чатов — в CMS-глобале `bot-config` (контракт), читаем/пишем через CMS API.
 * Токен — из process.env.TELEGRAM_BOT_TOKEN (.env.bot / docker env). НЕ хардкодить.
 *
 * Запуск: node scripts/bot.mjs   (оператор; обычно под LaunchAgent с KeepAlive).
 */

import {
  log,
  getGlobal,
  updateGlobal,
  findRecent,
  tgSendMessage,
  tgGetUpdates,
  TELEGRAM_TOKEN,
} from './lib/dvizh-cms.mjs'

if (!TELEGRAM_TOKEN) {
  log('TELEGRAM_BOT_TOKEN не задан — бот не может стартовать.')
  process.exit(1)
}

// --- bot-config helpers --------------------------------------------------

async function loadBotConfig() {
  try {
    const cfg = await getGlobal('bot-config')
    return {
      ownerTelegramId:
        cfg?.ownerTelegramId === undefined ? null : cfg.ownerTelegramId,
      allowedChatIds: Array.isArray(cfg?.allowedChatIds) ? cfg.allowedChatIds : [],
    }
  } catch (err) {
    log('Не удалось прочитать bot-config:', err.message)
    return { ownerTelegramId: null, allowedChatIds: [] }
  }
}

async function saveBotConfig(patch) {
  return updateGlobal('bot-config', patch)
}

function isAllowed(cfg, chatId) {
  return cfg.allowedChatIds.includes(chatId)
}

// --- команды -------------------------------------------------------------

async function handleStart(msg) {
  const chatId = msg.chat.id
  const fromId = msg.from?.id
  const cfg = await loadBotConfig()

  if (cfg.ownerTelegramId === null || cfg.ownerTelegramId === '' ) {
    // Первый активатор — владелец. Сразу же авторизуем его личный чат.
    const allowed = Array.from(new Set([...cfg.allowedChatIds, chatId]))
    await saveBotConfig({ ownerTelegramId: fromId, allowedChatIds: allowed })
    log(`Назначен владелец: ${fromId}, добавлен чат ${chatId}`)
    await tgSendMessage(
      chatId,
      [
        '👑 <b>Вы — владелец бота dvizh.</b>',
        '',
        'Команды:',
        '• /register — авторизовать текущий чат (только владелец)',
        '• /status — состояние сайта и последние заявки',
        '',
        'Добавьте бота в нужный чат и отправьте там /register.',
      ].join('\n'),
    )
    return
  }

  if (isAllowed(cfg, chatId)) {
    await tgSendMessage(
      chatId,
      'Бот dvizh активен в этом чате. Команды: /status, /register (владелец).',
    )
  } else {
    await tgSendMessage(
      chatId,
      'Этот чат не авторизован. Владелец должен выполнить здесь /register.',
    )
  }
}

async function handleRegister(msg) {
  const chatId = msg.chat.id
  const fromId = msg.from?.id
  const cfg = await loadBotConfig()

  if (cfg.ownerTelegramId === null) {
    await tgSendMessage(chatId, 'Сначала выполните /start, чтобы назначить владельца.')
    return
  }
  if (fromId !== cfg.ownerTelegramId) {
    // тихо игнорируем чужие /register, но если чат не авторизован — короткий ответ
    if (!isAllowed(cfg, chatId)) {
      await tgSendMessage(chatId, 'Только владелец может авторизовать чат.')
    }
    return
  }

  if (isAllowed(cfg, chatId)) {
    await tgSendMessage(chatId, 'Этот чат уже авторизован ✅')
    return
  }
  const allowed = Array.from(new Set([...cfg.allowedChatIds, chatId]))
  await saveBotConfig({ allowedChatIds: allowed })
  log(`Чат ${chatId} добавлен в allowlist владельцем ${fromId}`)
  await tgSendMessage(
    chatId,
    'Чат авторизован ✅ Теперь сюда приходят алерты, сводки и доступна команда /status.',
  )
}

function fmtStatus(s) {
  if (!s) return 'Нет данных мониторинга (monitor-status пуст).'
  const mark = (ok) => (ok ? '✅' : '🔴')
  return [
    '<b>Состояние dvizh</b>',
    '',
    `${mark(s.pagesOk)} Страницы`,
    `${mark(s.formsOk)} Формы`,
    `${mark(s.cmsOk)} CMS`,
    `${mark(s.backupOk)} Бэкап${s.backupAt ? ` (${s.backupAt})` : ''}`,
    '',
    `📨 Заявок сегодня: <b>${s.leadsToday ?? 0}</b>`,
    s.note ? `⚠️ ${s.note}` : '',
    s.lastPingAt ? `Последний пинг: ${s.lastPingAt}` : 'Пинга ещё не было',
  ]
    .filter(Boolean)
    .join('\n')
}

function fmtLeads(docs) {
  if (!docs || docs.length === 0) return 'Свежих заявок нет.'
  const lines = ['', '<b>Последние заявки:</b>']
  for (const d of docs) {
    const when = d.createdAt ? new Date(d.createdAt).toLocaleString('ru-RU') : ''
    const who = [d.name, d.company].filter(Boolean).join(', ')
    const contact = [d.email, d.phone].filter(Boolean).join(' / ')
    lines.push(`• [${d.preset || '—'}] ${who || contact || 'без имени'}${contact && who ? ` — ${contact}` : ''}${when ? `\n   ${when}` : ''}`)
  }
  return lines.join('\n')
}

async function handleStatus(msg) {
  const chatId = msg.chat.id
  const cfg = await loadBotConfig()
  if (!isAllowed(cfg, chatId)) {
    await tgSendMessage(chatId, 'Этот чат не авторизован для просмотра статуса.')
    return
  }

  let statusText = ''
  try {
    const s = await getGlobal('monitor-status')
    statusText = fmtStatus(s)
  } catch (err) {
    statusText = `Не удалось прочитать monitor-status: ${err.message}`
  }

  let leadsText = ''
  try {
    const res = await findRecent('form-submissions', { limit: 5 })
    leadsText = fmtLeads(res?.docs)
  } catch (err) {
    leadsText = `\nЗаявки недоступны: ${err.message}`
  }

  await tgSendMessage(chatId, `${statusText}\n${leadsText}`)
}

// --- роутинг апдейтов ----------------------------------------------------

async function handleMessage(msg) {
  if (!msg || !msg.text || !msg.chat) return
  const text = msg.text.trim()
  // команда может быть с @botname суффиксом в группах
  const cmd = text.split(/\s+/)[0].split('@')[0].toLowerCase()

  try {
    switch (cmd) {
      case '/start':
        await handleStart(msg)
        break
      case '/register':
        await handleRegister(msg)
        break
      case '/status':
        await handleStatus(msg)
        break
      default:
        // неизвестные сообщения игнорируем (бот молчит)
        break
    }
  } catch (err) {
    log(`Ошибка обработки "${cmd}" в чате ${msg.chat.id}:`, err.message)
  }
}

// --- long-poll loop ------------------------------------------------------

async function loop() {
  log('=== Bot start (long-poll) ===')
  let offset = 0
  // бесконечный цикл; на ошибках сети — пауза и продолжение
  for (;;) {
    try {
      const data = await tgGetUpdates(offset, 25)
      if (data?.ok && Array.isArray(data.result)) {
        for (const upd of data.result) {
          offset = upd.update_id + 1
          if (upd.message) {
            await handleMessage(upd.message)
          }
        }
      }
    } catch (err) {
      log('Цикл getUpdates — ошибка:', err.message)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
}

loop().catch((err) => {
  log('FATAL:', err.message)
  process.exit(1)
})
