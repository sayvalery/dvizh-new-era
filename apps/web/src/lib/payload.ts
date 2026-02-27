const CMS_URL = import.meta.env.CMS_URL || 'http://localhost:3002'

/**
 * Нормализует URL медиафайла из CMS:
 * 1. Убирает абсолютный origin (http://192.168.18.87:3002) → оставляет только путь /api/media/...
 * 2. Декодирует двойную URL-кодировку (%2520 → %20, %25D0 → %D0)
 * В проде nginx проксирует /api/media/ на CMS, поэтому нужны только относительные пути.
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
  return normalized
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
 * Очищает HTML из Webflow (bodyHtml):
 * - Убирает пустые id="" атрибуты
 * - Убирает Webflow-специфичные классы и атрибуты
 * - Убирает inline style=""
 * - Нормализует ссылки
 */
export function sanitizeBodyHtml(html: string | null | undefined): string | null {
  if (!html) return null
  let result = html
  // Убираем пустые id=""
  result = result.replace(/\s+id=""/g, '')
  // Убираем Webflow data-* атрибуты
  result = result.replace(/\s+data-rt-[a-z-]+="[^"]*"/g, '')
  result = result.replace(/\s+data-w-[a-z-]+="[^"]*"/g, '')
  // Убираем Webflow-классы (b-article-*, w-*)
  result = result.replace(/\s+class="[^"]*(?:b-article|w-embed|w-richtext|w-inline-block)[^"]*"/g, '')
  // Убираем inline styles
  result = result.replace(/\s+style="[^"]*"/g, '')
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
  const maxRetries = 3
  const timeoutMs = 5000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`CMS fetch failed: ${res.status} ${url}`)
      }

      return res.json() as Promise<T>
    } catch (err) {
      clearTimeout(timeoutId)

      if (attempt === maxRetries) {
        throw new Error(`CMS unavailable after ${maxRetries} attempts: ${url}`)
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error(`CMS unavailable: ${url}`)
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

