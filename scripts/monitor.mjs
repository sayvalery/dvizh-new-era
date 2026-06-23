#!/usr/bin/env node
/**
 * scripts/monitor.mjs — мониторинг здоровья dvizh (host-скрипт, ТРЕК 5).
 *
 * Раз в запуск (LaunchAgent ~раз в 30 мин, см. com.dvizh.monitor.plist):
 *  - пинг ключевых страниц сайта (SITE_URL / preview);
 *  - ПОВЕРХНОСТНЫЙ health приёма форм: GET /api/form-submissions (read, БЕЗ создания заявки);
 *  - CMS жива: GET /api/users/me (или /api/blog-posts?limit=1);
 *  - свежесть последнего бэкапа в ~/dvizh-backups/auto;
 *  - кол-во заявок за сегодня (leadsToday).
 *
 * Результат POST-ит в CMS-глобал `monitor-status`.
 * При сбое — мгновенный алерт в Telegram (allowedChatIds из глобала `bot-config`).
 * Ежедневная сводка — при запуске в окно DAILY_SUMMARY_HOUR (по умолчанию 9 утра),
 *  чтобы не слать сводку каждые 30 минут.
 *
 * Запуск: node scripts/monitor.mjs            — обычный health-ран
 *         node scripts/monitor.mjs --summary  — принудительно отправить сводку
 *
 * НЕ запускать вручную для деплоя — это делает оператор (LaunchAgent).
 */

import { existsSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  log,
  getGlobal,
  updateGlobal,
  countSince,
  tgBroadcast,
  CMS_BASE,
} from './lib/dvizh-cms.mjs'

const SITE_URL = (process.env.SITE_URL || 'https://dvizh.io').replace(/\/$/, '')
const PREVIEW_URL = (process.env.PREVIEW_URL || 'https://preview.dvizh.cc').replace(/\/$/, '')
const BACKUP_DIR =
  process.env.BACKUP_DIR || join(homedir(), 'dvizh-backups', 'auto')
const BACKUP_MAX_AGE_H = Number(process.env.BACKUP_MAX_AGE_H || 26) // бэкап раз в сутки + запас
const DAILY_SUMMARY_HOUR = Number(process.env.DAILY_SUMMARY_HOUR || 9)
const PING_TIMEOUT_MS = 12000

const forceSummary = process.argv.includes('--summary')

/** GET с таймаутом; ok = HTTP 2xx/3xx. */
async function ping(url, { method = 'GET' } = {}) {
  try {
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    })
    // 2xx и 3xx считаем живыми (301 на .io со стейджа — нормально)
    const ok = res.status >= 200 && res.status < 400
    return { ok, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err.message }
  }
}

/** Ключевые страницы сайта. */
async function checkPages() {
  const targets = [
    `${SITE_URL}/`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/scoring`,
    `${SITE_URL}/contacts`,
  ]
  const results = []
  for (const url of targets) {
    results.push({ url, ...(await ping(url)) })
  }
  const ok = results.every((r) => r.ok)
  return { ok, results }
}

/** Поверхностный health приёма форм — READ, без создания заявки. */
async function checkForms() {
  // read требует авторизации (req.user). Если auth нет — мягко считаем «нет данных».
  try {
    const res = await fetch(`${CMS_BASE}/api/form-submissions?limit=1&depth=0`, {
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    })
    // 200 — эндпоинт жив; 401/403 — жив, но без auth (всё равно «жив»).
    const ok = res.status === 200 || res.status === 401 || res.status === 403
    return { ok, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err.message }
  }
}

/** CMS жива. */
async function checkCms() {
  const r = await ping(`${CMS_BASE}/api/blog-posts?limit=1`)
  return { ok: r.ok, status: r.status, error: r.error }
}

/** Свежесть последнего бэкапа. */
function checkBackup() {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return { ok: false, backupAt: '', note: `нет директории ${BACKUP_DIR}` }
    }
    const files = readdirSync(BACKUP_DIR)
      .map((f) => join(BACKUP_DIR, f))
      .filter((p) => {
        try {
          return statSync(p).isFile()
        } catch {
          return false
        }
      })
      .map((p) => ({ p, mtime: statSync(p).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)

    if (files.length === 0) {
      return { ok: false, backupAt: '', note: 'нет файлов бэкапа' }
    }
    const newest = files[0]
    const ageH = (Date.now() - newest.mtime) / 3_600_000
    const backupAt = new Date(newest.mtime).toISOString()
    return {
      ok: ageH <= BACKUP_MAX_AGE_H,
      backupAt,
      note: ageH <= BACKUP_MAX_AGE_H ? '' : `бэкап устарел (${ageH.toFixed(1)}ч)`,
    }
  } catch (err) {
    return { ok: false, backupAt: '', note: `ошибка проверки бэкапа: ${err.message}` }
  }
}

/** Заявки за сегодня (с полуночи по локальному времени). */
async function leadsToday() {
  try {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return await countSince('form-submissions', start.toISOString())
  } catch (err) {
    log('leadsToday: не удалось получить (нужен auth?):', err.message)
    return 0
  }
}

function fmtStatusLine(label, ok) {
  return `${ok ? '✅' : '🔴'} ${label}`
}

async function getAllowedChats() {
  try {
    const cfg = await getGlobal('bot-config')
    const ids = Array.isArray(cfg?.allowedChatIds) ? cfg.allowedChatIds : []
    return ids
  } catch (err) {
    log('Не удалось прочитать bot-config:', err.message)
    return []
  }
}

async function main() {
  log('=== Monitor run start ===')

  const [pages, forms, cms, leads] = await Promise.all([
    checkPages(),
    checkForms(),
    checkCms(),
    leadsToday(),
  ])
  const backup = checkBackup()

  const nowISO = new Date().toISOString()
  const noteParts = []
  if (!pages.ok) {
    const bad = pages.results.filter((r) => !r.ok).map((r) => `${r.url} (${r.status})`)
    noteParts.push(`страницы: ${bad.join(', ')}`)
  }
  if (!forms.ok) noteParts.push(`формы: HTTP ${forms.status}`)
  if (!cms.ok) noteParts.push(`CMS: HTTP ${cms.status}`)
  if (!backup.ok) noteParts.push(backup.note || 'бэкап')

  const status = {
    lastPingAt: nowISO,
    pagesOk: pages.ok,
    formsOk: forms.ok,
    cmsOk: cms.ok,
    backupOk: backup.ok,
    backupAt: backup.backupAt,
    leadsToday: leads,
    note: noteParts.join('; '),
  }

  // 1) Записать статус в CMS (если не выйдет — не критично для алерта).
  try {
    await updateGlobal('monitor-status', status)
    log('monitor-status обновлён:', JSON.stringify(status))
  } catch (err) {
    log('Не удалось записать monitor-status:', err.message)
  }

  const allDown = !pages.ok || !forms.ok || !cms.ok || !backup.ok
  const chats = await getAllowedChats()

  // 2) Мгновенный алерт при сбое.
  if (allDown && chats.length) {
    const lines = [
      '🔴 <b>DVIZH — сбой мониторинга</b>',
      '',
      fmtStatusLine('Страницы', pages.ok),
      fmtStatusLine('Формы', forms.ok),
      fmtStatusLine('CMS', cms.ok),
      fmtStatusLine('Бэкап', backup.ok),
      '',
      status.note ? `Детали: ${status.note}` : '',
      `Время: ${nowISO}`,
    ].filter(Boolean)
    try {
      await tgBroadcast(chats, lines.join('\n'))
      log('Алерт отправлен в', chats.length, 'чатов')
    } catch (err) {
      log('Не удалось отправить алерт:', err.message)
    }
  }

  // 3) Ежедневная сводка (в окно DAILY_SUMMARY_HOUR или по флагу --summary).
  const hour = new Date().getHours()
  const sendSummary = forceSummary || hour === DAILY_SUMMARY_HOUR
  if (sendSummary && chats.length) {
    const lines = [
      '📊 <b>DVIZH — сводка за сутки</b>',
      '',
      fmtStatusLine('Страницы', pages.ok),
      fmtStatusLine('Формы', forms.ok),
      fmtStatusLine('CMS', cms.ok),
      fmtStatusLine('Бэкап', backup.ok),
      backup.backupAt ? `   последний: ${backup.backupAt}` : '',
      '',
      `📨 Заявок сегодня: <b>${leads}</b>`,
      status.note ? `⚠️ ${status.note}` : '',
      `Время: ${nowISO}`,
    ].filter(Boolean)
    try {
      await tgBroadcast(chats, lines.join('\n'))
      log('Сводка отправлена в', chats.length, 'чатов')
    } catch (err) {
      log('Не удалось отправить сводку:', err.message)
    }
  }

  log('=== Monitor run end ===')
}

main().catch((err) => {
  log('FATAL:', err.message)
  process.exitCode = 1
})
