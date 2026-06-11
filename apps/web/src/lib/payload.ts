import { typografHtml, typografDoc } from './typography'

const CMS_URL = import.meta.env.CMS_URL || 'http://localhost:3002'
const PUBLIC_CMS_URL = import.meta.env.PUBLIC_CMS_URL || ''

/**
 * Нормализует URL медиафайла из CMS:
 * 1. Убирает абсолютный origin (http://192.168.18.87:3002) → оставляет только путь /api/media/...
 * 2. Декодирует двойную URL-кодировку (%2520 → %20, %25D0 → %D0)
 * 3. Если задан PUBLIC_CMS_URL — добавляет его как префикс (для dev без локальной CMS).
 *    В проде PUBLIC_CMS_URL пустой, nginx проксирует /api/media/ на CMS напрямую.
 */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let normalized = url
  // Убираем абсолютный origin CMS (любой http(s)://host:port)
  normalized = normalized.replace(/^https?:\/\/[^/]+/, '')
  // Декодируем многоуровневую URL-кодировку
  while (normalized.includes('%25')) {
    normalized = normalized.split('%25').join('%')
  }
  return PUBLIC_CMS_URL + normalized
}

/**
 * Исправляет двойную URL-кодировку в HTML-контенте (bodyHtml из CMS).
 * Также убирает абсолютные CMS URL из src/href атрибутов.
 */
export function normalizeBodyHtml(html: string | null | undefined): string | null {
  if (!html) return null
  let result = html
  // Убираем абсолютные CMS URL из src и href атрибутов
  result = result.replace(/(src|href)="https?:\/\/[^/]+\/api\//g, '$1="/api/')
  // Декодируем многоуровневую URL-кодировку (%252520 → %2520 → %20)
  while (result.includes('%25')) {
    result = result.split('%25').join('%')
  }
  return result
}

/**
 * Legacy Webflow CTA-баннер «компания» (b-article-company-card) в bodyHtml.
 * Структура: лого/картинка как background-image на <a>, описание <p>, кнопка-ссылка.
 * Картинка различается от статьи к статье (внешний логотип ДВИЖ или наша медиа
 * /api/media/...), поэтому её URL берём из разметки, а не подставляем фиксированный.
 *
 * Проблема: санитайзер ниже срезает inline style (с background-image) и
 * Webflow-классы (b-article-*, w-inline-block) — картинка и зацепки для CSS
 * пропадают. Поэтому ДО санитайзера пересобираем блок в чистую разметку с
 * настоящим <img> и собственными классами (.cta-company-card), которые санитайзер
 * не трогает. Стили — в global.css. Захватываем: 1=картинка, 2=ссылка-компания,
 * 3=описание, 4=ссылка-кнопка, 5=текст кнопки.
 */
const LEGACY_COMPANY_CARD_RE =
  /<div[^>]*data-rt-embed-type[^>]*>\s*<div[^>]*b-article-company-card[^>]*>\s*<a[^>]*background-image:url\((?:&quot;|["'])?(.*?)(?:&quot;|["'])?\)[^>]*href="([^"]*)"[^>]*>\s*<\/a>\s*<div[^>]*b-card-text-block[^>]*>\s*<p>([\s\S]*?)<\/p>\s*<a[^>]*href="([^"]*)"[^>]*>\s*<div[^>]*b-headline2[^>]*>\s*([\s\S]*?)\s*<\/div>[\s\S]*?<\/a>\s*<\/div>\s*<\/div>\s*<\/div>/g

function transformLegacyCompanyCard(html: string): string {
  return html.replace(
    LEGACY_COMPANY_CARD_RE,
    (_m, img: string, companyHref: string, desc: string, btnHref: string, btnText: string) => {
      const isLogo = /\.svg(\?|$)/i.test(img)
      return (
        '<div class="cta-company-card">' +
        `<a class="cta-company-card__media${isLogo ? ' is-logo' : ''}" href="${companyHref}">` +
        `<img src="${img}" alt="" loading="lazy" /></a>` +
        '<div class="cta-company-card__body">' +
        `<p class="cta-company-card__desc">${desc.trim()}</p>` +
        `<a class="cta-company-card__btn" href="${btnHref}">${btnText.trim()}</a>` +
        '</div></div>'
      )
    },
  )
}

/**
 * Очищает HTML из Webflow (bodyHtml):
 * - Пересобирает legacy CTA-баннеры «компания» в чистую разметку (до срезания классов/стилей)
 * - Убирает пустые id="" атрибуты
 * - Убирает Webflow-специфичные классы и атрибуты
 * - Убирает inline style=""
 * - Нормализует ссылки
 */
export function sanitizeBodyHtml(html: string | null | undefined): string | null {
  if (!html) return null
  let result = html
  // Пересобираем legacy company-card ДО срезания style/классов (иначе теряем картинку)
  result = transformLegacyCompanyCard(result)
  // Убираем пустые id=""
  result = result.replace(/\s+id=""/g, '')
  // Убираем Webflow data-* атрибуты
  result = result.replace(/\s+data-rt-[a-z-]+="[^"]*"/g, '')
  result = result.replace(/\s+data-w-[a-z-]+="[^"]*"/g, '')
  // Убираем Webflow-классы (b-article-*, w-*)
  result = result.replace(/\s+class="[^"]*(?:b-article|w-embed|w-richtext|w-inline-block)[^"]*"/g, '')
  // Убираем inline styles
  result = result.replace(/\s+style="[^"]*"/g, '')
  // Сворачиваем отступы-переносы между тегами (Webflow pretty-print). Внутри
  // flex-блоков (карточка автора цитаты) пробельные узлы между flex-элементами
  // распирают вёрстку — имя/должность «едут», плашка цитаты растягивается.
  // Берём только пробелы С переносом строки, чтобы не склеить инлайн-текст
  // (пробел между <strong>/<em>/<a> — это одиночный пробел без \n).
  result = result.replace(/>\s*\n\s*</g, '><')
  // Русская типографика (NBSP + ё→е) — только текстовые узлы, теги не трогаем.
  result = typografHtml(result) ?? result
  return result
}

type FetchOptions = {
  depth?: number
  limit?: number
  page?: number
  where?: Record<string, unknown>
  sort?: string
}

/** Flatten a nested object/array to bracket-notation query string entries.
 *  { slug: { equals: 'foo' } }               → "slug[equals]=foo"
 *  { or: [{ a: { equals: 1 } }] }            → "or[0][a][equals]=1"
 *  Payload v3 REST API requires this format for `where` filters.
 */
function flattenParams(obj: unknown, prefix = ''): Record<string, string> {
  if (Array.isArray(obj)) {
    const result: Record<string, string> = {}
    obj.forEach((item, i) => {
      Object.assign(result, flattenParams(item, `${prefix}[${i}]`))
    })
    return result
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, string> = {}
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const newKey = prefix ? `${prefix}[${key}]` : key
      Object.assign(result, flattenParams(val, newKey))
    }
    return result
  }
  return { [prefix]: String(obj) }
}

async function fetchFromCMS<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const params = new URLSearchParams()

  if (options.depth !== undefined) params.set('depth', String(options.depth))
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.page !== undefined) params.set('page', String(options.page))
  if (options.sort) params.set('sort', options.sort)
  if (options.where) {
    const flat = flattenParams(options.where, 'where')
    for (const [k, v] of Object.entries(flat)) params.set(k, v)
  }

  const url = `${CMS_URL}/api${path}?${params.toString()}`
  const isDev = import.meta.env.DEV
  const maxRetries = isDev ? 1 : 3
  const timeoutMs = isDev ? 1000 : 5000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`CMS fetch failed: ${res.status} ${url}`)
      }

      const json = await res.json()
      // Русская типографика (NBSP + ё→е) для всех текстовых полей CMS-контента.
      if (json && Array.isArray(json.docs)) {
        json.docs = json.docs.map((d: unknown) => typografDoc(d))
      }
      return json as T
    } catch (err) {
      clearTimeout(timeoutId)

      if (attempt === maxRetries) {
        console.warn(`[CMS] Недоступна, возвращаю пустой результат: ${path}`)
        return { docs: [], totalDocs: 0, hasNextPage: false } as unknown as T
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return { docs: [], totalDocs: 0, hasNextPage: false } as unknown as T
}

// Только опубликованный контент
const publishedFilter = {
  _status: { equals: 'published' },
}

export async function getBlogPosts(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number; hasNextPage: boolean }>('/blog-posts', {
    where: publishedFilter,
    sort: '-publishedAt',
    limit: 20,
    depth: 2,
    ...options,
  })
}

export async function getBlogPost(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/blog-posts', {
    where: { ...publishedFilter, slug: { equals: slug } },
    depth: 3,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getCategories() {
  return fetchFromCMS<{ docs: any[] }>('/categories', {
    sort: 'order',
    limit: 100,
  })
}

export async function getVideos(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/videos', {
    where: publishedFilter,
    sort: '-publishedAt',
    limit: 20,
    depth: 2,
    ...options,
  })
}

export async function getVideo(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/videos', {
    where: { ...publishedFilter, slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getResearch(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/research', {
    where: publishedFilter,
    sort: '-createdAt',
    depth: 2,
    ...options,
  })
}

export async function getResearchItem(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/research', {
    where: { ...publishedFilter, slug: { equals: slug } },
    depth: 3,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getCases(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/cases', {
    where: publishedFilter,
    sort: '-createdAt',
    depth: 2,
    ...options,
  })
}

export async function getCase(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/cases', {
    where: { ...publishedFilter, slug: { equals: slug } },
    depth: 3,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getGlossaries(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number; hasNextPage: boolean }>('/glossaries', {
    sort: 'name',
    limit: 50,
    depth: 1,
    ...options,
  })
}

export async function getGlossaryItem(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/glossaries', {
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getPersons(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number; hasNextPage: boolean }>('/persons', {
    sort: 'name',
    limit: 100,
    depth: 1,
    ...options,
  })
}

export async function getPerson(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/persons', {
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getPostsByPerson(slug: string) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/blog-posts', {
    where: {
      ...publishedFilter,
      or: [
        { 'primaryAuthor.slug': { equals: slug } },
        { 'coAuthors.slug': { equals: slug } },
      ],
    },
    sort: '-publishedAt',
    limit: 100,
    depth: 2,
  })
}

export async function getCompanies(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number; hasNextPage: boolean }>('/companies', {
    sort: 'name',
    limit: 100,
    depth: 1,
    ...options,
  })
}

export async function getCompany(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/companies', {
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getPersonsByCompany(slug: string) {
  return fetchFromCMS<{ docs: any[] }>('/persons', {
    where: { 'company.slug': { equals: slug } },
    sort: 'name',
    limit: 100,
    depth: 1,
  })
}

export async function getPostsByCompany(slug: string) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/blog-posts', {
    where: {
      ...publishedFilter,
      'company.slug': { equals: slug },
    },
    sort: '-publishedAt',
    limit: 100,
    depth: 2,
  })
}

export async function getTags(options: FetchOptions = {}) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number; hasNextPage: boolean }>('/tags', {
    sort: 'name',
    limit: 100,
    depth: 1,
    ...options,
  })
}

export async function getTag(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/tags', {
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getPostsByTag(tagId: number | string) {
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/blog-posts', {
    where: {
      ...publishedFilter,
      tags: { in: [tagId] },
    },
    sort: '-publishedAt',
    limit: 200,
    depth: 2,
  })
}

