import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/build-status — текущий статус сборки (logs/build-status.json).
 *
 * Проксирует на host-вебхук (scripts/deploy-webhook.js, порт 3099), который
 * слушает только 127.0.0.1. Авторизация обязательна: статус раскрывает ветку,
 * git sha и внутренние шаги пайплайна. Раньше отдавался через прямую локацию
 * nginx без всякой проверки — она убрана.
 */
const STATUS_URL =
  process.env.DEPLOY_STATUS_URL || 'http://host.docker.internal:3099/build-status'

export async function GET() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user) {
    return NextResponse.json({ success: false, error: 'Требуется авторизация' }, { status: 401 })
  }

  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store' })

    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`)
    }

    return NextResponse.json(await res.json(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ошибка соединения с deploy webhook'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
