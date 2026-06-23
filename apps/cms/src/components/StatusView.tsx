import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'

/**
 * Кастомная админ-страница «Статус» (Payload custom view).
 *
 * Показывает снимок здоровья (глобал monitor-status), последние заявки и общий счётчик.
 * Один источник данных с Telegram-ботом (/status). Доступна по /admin/status под
 * стандартной Payload-авторизацией.
 */

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month}, ${hh}:${mm}`
}

const PRESET_LABELS: Record<string, string> = {
  lead: 'Лид',
  subscribe: 'Подписка',
  demo: 'Демо',
  research: 'Исследование',
}

function HealthRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #ececec' }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: ok ? '#16a34a' : '#dc2626',
        }}
      />
      <span style={{ fontSize: 14 }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 13, color: ok ? '#16a34a' : '#dc2626' }}>
        {ok ? 'OK' : 'Сбой'}
      </span>
    </div>
  )
}

const StatusView = async ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  const payload = await getPayload({ config })

  let status: Record<string, unknown> = {}
  try {
    status = await payload.findGlobal({ slug: 'monitor-status' })
  } catch {
    status = {}
  }

  let recent: { docs: Array<Record<string, unknown>>; totalDocs: number } = { docs: [], totalDocs: 0 }
  try {
    recent = await payload.find({
      collection: 'form-submissions',
      limit: 10,
      sort: '-createdAt',
    }) as typeof recent
  } catch {
    recent = { docs: [], totalDocs: 0 }
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <h1 style={{ marginBottom: 4 }}>Статус</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
          Последний пинг: {fmt(status.lastPingAt as string)}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 32,
          }}
        >
          <section
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              padding: '16px 20px',
              background: '#fff',
            }}
          >
            <h2 style={{ fontSize: 15, marginBottom: 8 }}>Здоровье</h2>
            <HealthRow label="Страницы отвечают" ok={!!status.pagesOk} />
            <HealthRow label="Приём форм" ok={!!status.formsOk} />
            <HealthRow label="CMS / база" ok={!!status.cmsOk} />
            <HealthRow label="Бэкап свежий" ok={!!status.backupOk} />
            <div style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
              Бэкап: {fmt(status.backupAt as string)}
            </div>
            {status.note ? (
              <div style={{ marginTop: 10, fontSize: 13, color: '#b45309' }}>{String(status.note)}</div>
            ) : null}
          </section>

          <section
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              padding: '16px 20px',
              background: '#fff',
            }}
          >
            <h2 style={{ fontSize: 15, marginBottom: 8 }}>Заявки</h2>
            <div style={{ fontSize: 32, fontWeight: 600 }}>{recent.totalDocs}</div>
            <div style={{ fontSize: 13, color: '#888' }}>всего за всё время</div>
            <div style={{ marginTop: 12, fontSize: 24, fontWeight: 600 }}>
              {(status.leadsToday as number) ?? 0}
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>за сегодня</div>
          </section>
        </div>

        <h2 style={{ fontSize: 15, marginBottom: 12 }}>Последние заявки</h2>
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden' }}>
          {recent.docs.length === 0 ? (
            <div style={{ padding: 16, color: '#888', fontSize: 14 }}>Пока нет заявок.</div>
          ) : (
            recent.docs.map((d, i) => (
              <div
                key={(d.id as string) ?? i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < recent.docs.length - 1 ? '1px solid #f0f0f0' : 'none',
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#f3f4f6',
                    color: '#374151',
                    flexShrink: 0,
                  }}
                >
                  {PRESET_LABELS[String(d.preset)] ?? String(d.preset)}
                </span>
                <span>{String(d.name || d.email || d.phone || '—')}</span>
                <span style={{ color: '#999', fontSize: 13 }}>{String(d.email || '')}</span>
                <span style={{ marginLeft: 'auto', color: '#999', fontSize: 13 }}>
                  {fmt(d.createdAt as string)}
                </span>
              </div>
            ))
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default StatusView
