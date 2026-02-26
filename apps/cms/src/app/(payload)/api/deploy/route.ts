import { NextResponse } from 'next/server'

const WEBHOOK_URL = process.env.DEPLOY_WEBHOOK_URL || 'http://host.docker.internal:3099/deploy'

export async function POST() {
  try {
    const res = await fetch(WEBHOOK_URL, { method: 'POST' })

    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Сборка запущена. Сайт обновится через ~30 секунд.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ошибка соединения с deploy webhook'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
