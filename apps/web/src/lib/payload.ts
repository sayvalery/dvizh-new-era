const CMS_URL = import.meta.env.CMS_URL || 'http://localhost:3002'

type FetchOptions = {
  depth?: number
  limit?: number
  page?: number
  where?: Record<string, unknown>
  sort?: string
}

/** Flatten a nested object to bracket-notation query string entries.
 *  { slug: { equals: 'foo' } } → "slug[equals]=foo"
 *  Payload v3 REST API requires this format for `where` filters.
 */
function flattenParams(obj: unknown, prefix = ''): Record<string, string> {
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
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
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status} ${url}`)
  }

  return res.json() as Promise<T>
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
    where: publishedFilter,
    sort: 'title',
    limit: 50,
    depth: 1,
    ...options,
  })
}

export async function getGlossaryItem(slug: string) {
  const result = await fetchFromCMS<{ docs: any[] }>('/glossaries', {
    where: { ...publishedFilter, slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getNavigation() {
  return fetchFromCMS<any>('/globals/navigation', { depth: 1 })
}

export async function getFooter() {
  return fetchFromCMS<any>('/globals/footer', { depth: 1 })
}
