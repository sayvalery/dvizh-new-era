import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/deploy — запуск пересборки и деплоя статики (scripts/build-site.sh).
 *
 * Проксирует запрос на host-вебхук (scripts/deploy-webhook.js, порт 3099).
 * Сам вебхук слушает только 127.0.0.1 и НЕ имеет собственной авторизации,
 * поэтому проверка залогиненного пользователя здесь — единственный барьер.
 * Прямые локации /deploy и /build-status из nginx убраны: без них триггер
 * прод-деплоя был доступен без авторизации всем, кто дотянулся до admin-домена.
 */
const WEBHOOK_URL = process.env.DEPLOY_WEBHOOK_URL || 'http://host.docker.internal:3099/deploy'

export async function POST() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user) {
    return NextResponse.json({ success: false, error: 'Требуется авторизация' }, { status: 401 })
  }

  try {
    const res = await fetch(WEBHOOK_URL, { method: 'POST' })

    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`)
    }

    payload.logger.info(`Deploy запущен пользователем ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Сборка запущена. Сайт обновится через ~30 секунд.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ошибка соединения с deploy webhook'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
