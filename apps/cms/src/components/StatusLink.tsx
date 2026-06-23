import React from 'react'
import Link from 'next/link'

/**
 * Ссылка в боковой навигации админки на кастомную страницу «Статус» (/admin/status).
 * Серверный компонент — без интерактивности.
 */
export default function StatusLink() {
  return (
    <Link
      href="/admin/status"
      style={{
        display: 'block',
        padding: '6px 0',
        fontSize: 13,
        fontWeight: 600,
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      Статус мониторинга
    </Link>
  )
}
