const CMS_URL = import.meta.env.CMS_URL || 'http://localhost:3002'

type FetchOptions = {
  depth?: number
  limit?: number
  page?: number
  where?: Record<string, unknown>
  sort?: string
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
  if (options.where) params.set('where', JSON.stringify(options.where))

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
  return fetchFromCMS<{ docs: any[]; totalDocs: number }>('/blog-posts', {
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

export async function getNavigation() {
  return fetchFromCMS<any>('/globals/navigation', { depth: 1 })
}

export async function getFooter() {
  return fetchFromCMS<any>('/globals/footer', { depth: 1 })
}
