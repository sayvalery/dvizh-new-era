const CMS_URL = import.meta.env.CMS_URL || 'http://localhost:3002'

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

  // Таймаут 2 секунды, чтобы не зависать, если CMS недоступен
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`CMS fetch failed: ${res.status} ${url}`)
    }

    return res.json() as Promise<T>
  } catch {
    clearTimeout(timeoutId)
    throw new Error(`CMS unavailable: ${url}`)
  }
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

