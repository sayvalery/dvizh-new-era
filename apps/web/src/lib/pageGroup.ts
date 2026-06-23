/**
 * pageGroup — определение ГРУППЫ страницы для инъекции скриптов (Тип B интеграций).
 *
 * Группы (контракт): all | home | blog | glossary | cases | research | video | product.
 * 'all' не выводится здесь — это маркер scope «весь сайт», а не конкретная группа.
 *
 * Маппинг по pathname:
 *   /                          → home
 *   /blog, /blog/*             → blog
 *   /category/*                → blog (категории блога)
 *   /person/*                  → blog (авторы статей)
 *   /slovar-developera, /...   → glossary
 *   /cases, /cases/*           → cases
 *   /research, /research/*     → research
 *   /video, /video/*           → video
 *   прочее (продуктовые и т.д.) → product
 */

import type { PageScriptGroup } from './payload'

/** Группа конкретной страницы (без 'all'). */
export type PageGroup = Exclude<PageScriptGroup, 'all'>

/** Нормализовать путь: убрать trailing slash (кроме корня), привести к нижнему регистру. */
function normPath(pathname: string): string {
  let p = pathname.toLowerCase()
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

/**
 * Определить группу страницы по её pathname.
 * @param pathname например Astro.url.pathname
 */
export function getPageGroup(pathname: string): PageGroup {
  const p = normPath(pathname)

  if (p === '' || p === '/') return 'home'

  if (p === '/blog' || p.startsWith('/blog/')) return 'blog'
  if (p === '/category' || p.startsWith('/category/')) return 'blog'
  if (p === '/person' || p.startsWith('/person/')) return 'blog'

  if (p === '/slovar-developera' || p.startsWith('/slovar-developera/')) return 'glossary'

  if (p === '/cases' || p.startsWith('/cases/')) return 'cases'

  if (p === '/research' || p.startsWith('/research/')) return 'research'

  if (p === '/video' || p.startsWith('/video/')) return 'video'

  // Всё остальное — продуктовые страницы (ipoteka, scoring, banki, about, …).
  return 'product'
}
