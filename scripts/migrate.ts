#!/usr/bin/env tsx
/**
 * Webflow → Payload CMS migration script
 *
 * Usage:
 *   PAYLOAD_EMAIL=admin@example.com PAYLOAD_PASSWORD=secret npx tsx scripts/migrate.ts
 *
 * Env vars:
 *   CMS_URL          — default: http://localhost:3002
 *   PAYLOAD_EMAIL    — required
 *   PAYLOAD_PASSWORD — required
 *   SKIP_IMAGES      — set to "1" to skip image uploads (use cached log)
 *   STEP             — run only one step: images|tags|companies|persons|categories|posts|glossaries|events
 *
 * The script is resumable: progress is saved to scripts/migrate-log.json after each step.
 * Re-running skips already-created records (checked by slug).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(ROOT, 'source')
const IMAGE_MAP_PATH = path.join(SOURCE_DIR, 'image-map.json')
const LOG_PATH = path.join(__dirname, 'migrate-log.json')

const CMS_URL = (process.env.CMS_URL ?? 'http://localhost:3002').replace(/\/$/, '')
const EMAIL = process.env.PAYLOAD_EMAIL ?? ''
const PASSWORD = process.env.PAYLOAD_PASSWORD ?? ''
const SKIP_IMAGES = process.env.SKIP_IMAGES === '1'
const STEP = process.env.STEP ?? ''

if (!EMAIL || !PASSWORD) {
  console.error('Error: PAYLOAD_EMAIL and PAYLOAD_PASSWORD env vars are required')
  process.exit(1)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaEntry {
  id: string
  // relative URL, e.g. /api/media/file/xxx.jpg
  url: string
}

interface MigrateLog {
  // webflow CDN url → payload media entry
  media: Record<string, MediaEntry>
  // slug → payload id
  tags: Record<string, string>
  companies: Record<string, string>
  persons: Record<string, string>
  categories: Record<string, string>
  blogPosts: Record<string, string>
  glossaries: Record<string, string>
  events: Record<string, string>
}

// ─── Log ─────────────────────────────────────────────────────────────────────

function loadLog(): MigrateLog {
  if (fs.existsSync(LOG_PATH)) {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'))
  }
  return {
    media: {},
    tags: {},
    companies: {},
    persons: {},
    categories: {},
    blogPosts: {},
    glossaries: {},
    events: {},
  }
}

let log = loadLog()

function saveLog() {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

// ─── CSV parser (RFC 4180) ────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field)
        field = ''
      } else if (ch === '\r' && next === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        i++
      } else if (ch === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else {
        field += ch
      }
    }
  }

  // Flush last field/row
  if (row.length > 0 || field !== '') {
    row.push(field)
    rows.push(row)
  }

  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim())
  return rows
    .slice(1)
    .filter(r => r.some(c => c !== ''))
    .map(r => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? ''
      })
      return obj
    })
}

function readCSV(filename: string): Record<string, string>[] {
  const p = path.join(SOURCE_DIR, filename)
  if (!fs.existsSync(p)) throw new Error(`CSV not found: ${p}`)
  return parseCSV(fs.readFileSync(p, 'utf8'))
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

let token = ''

async function apiFetch(method: string, endpoint: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `JWT ${token}`

  const res = await fetch(`${CMS_URL}/api${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json: any = await res.json()
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} → HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
  }
  return json
}

async function uploadFile(filePath: string): Promise<MediaEntry> {
  const filename = path.basename(filePath)
  const ext = path.extname(filename).toLowerCase()
  const mimes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
    '.pdf': 'application/pdf',
  }
  const mimeType = mimes[ext] ?? 'application/octet-stream'

  const blob = new Blob([fs.readFileSync(filePath)], { type: mimeType })
  const fd = new FormData()
  fd.set('file', blob, filename)

  const res = await fetch(`${CMS_URL}/api/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: fd,
  })

  const json: any = await res.json()
  if (!res.ok) {
    throw new Error(`Upload ${filename} → HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`)
  }

  const doc = json.doc ?? json
  let url: string = doc.url ?? `/api/media/file/${doc.filename}`
  // Always store as relative path for portability
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try { url = new URL(url).pathname } catch {}
  }

  return { id: String(doc.id), url }
}

async function findBySlug(collection: string, slug: string): Promise<string | null> {
  const res = await apiFetch(
    'GET',
    `/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&depth=0&limit=1`,
  )
  return res.docs?.[0]?.id ? String(res.docs[0].id) : null
}

/** POST or PATCH depending on whether the record already exists. Returns the Payload id. */
async function upsert(
  collection: string,
  slug: string,
  body: Record<string, unknown>,
  logMap: Record<string, string>,
): Promise<{ id: string; action: 'created' | 'updated' }> {
  let id = logMap[slug] ?? (await findBySlug(collection, slug))

  if (id) {
    const doc = await apiFetch('PATCH', `/${collection}/${id}`, body)
    const newId = String(doc.doc?.id ?? doc.id ?? id)
    logMap[slug] = newId
    return { id: newId, action: 'updated' }
  } else {
    const doc = await apiFetch('POST', `/${collection}`, body)
    const newId = String(doc.doc?.id ?? doc.id)
    logMap[slug] = newId
    return { id: newId, action: 'created' }
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function authenticate() {
  const res = await fetch(`${CMS_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const json: any = await res.json()
  if (!res.ok || !json.token) {
    throw new Error(`Auth failed: ${JSON.stringify(json)}`)
  }
  token = json.token
  console.log('Authenticated.')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitSemicolon(s: string): string[] {
  return s.split(';').map(x => x.trim()).filter(Boolean)
}

/** Convert string ID stored in log to integer (Payload v3/PostgreSQL uses numeric IDs) */
function toInt(id: string | undefined): number | null {
  if (!id) return null
  const n = parseInt(id, 10)
  return isNaN(n) ? null : n
}

/** Look up a single slug → integer ID */
function resolveId(map: Record<string, string>, slug: string): number | null {
  return toInt(map[slug.trim()])
}

/** Look up multiple slugs → array of integer IDs */
function lookupIds(slugs: string[], map: Record<string, string>, label: string): number[] {
  return slugs.flatMap(slug => {
    const id = toInt(map[slug])
    if (id === null) console.warn(`    [warn] ${label} slug not found: "${slug}"`)
    return id !== null ? [id] : []
  })
}

function parseBool(s: string): boolean {
  return s.trim().toLowerCase() === 'true'
}

/** Replace all Webflow CDN URLs in HTML with Payload media relative paths */
function replaceMediaUrls(html: string): string {
  let result = html
  for (const [webflowUrl, entry] of Object.entries(log.media)) {
    if (result.includes(webflowUrl)) {
      result = result.replaceAll(webflowUrl, entry.url)
    }
  }
  return result
}

/** Look up media entry by Webflow CDN URL, return Payload media ID (integer) or null */
function resolveMediaId(webflowUrl: string): number | null {
  if (!webflowUrl) return null
  const entry = log.media[webflowUrl.trim()]
  if (!entry) return null
  const id = parseInt(entry.id, 10)
  return isNaN(id) ? null : id
}

// ─── Step: Upload images ──────────────────────────────────────────────────────

async function uploadImages() {
  if (SKIP_IMAGES) {
    console.log('[images] Skipped (SKIP_IMAGES=1)')
    return
  }

  const imageMap: Record<string, string> = JSON.parse(fs.readFileSync(IMAGE_MAP_PATH, 'utf8'))

  // Group by local path — multiple webflow URLs can point to the same file
  const localToUrls = new Map<string, string[]>()
  for (const [webflowUrl, localPath] of Object.entries(imageMap)) {
    if (!localToUrls.has(localPath)) localToUrls.set(localPath, [])
    localToUrls.get(localPath)!.push(webflowUrl)
  }

  const total = localToUrls.size
  let done = 0
  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const [localPath, webflowUrls] of localToUrls) {
    // Already in log — skip upload
    if (log.media[webflowUrls[0]]) {
      skippedCount++
      done++
      continue
    }

    const absPath = path.join(ROOT, localPath)
    if (!fs.existsSync(absPath)) {
      console.warn(`  [skip] file not found: ${localPath}`)
      errorCount++
      done++
      continue
    }

    try {
      const entry = await uploadFile(absPath)
      // All webflow URLs mapping to this file share the same Payload entry
      for (const url of webflowUrls) {
        log.media[url] = entry
      }
      uploadedCount++
      done++

      if (done % 25 === 0) {
        console.log(`  ${done}/${total} (uploaded: ${uploadedCount}, skipped: ${skippedCount})`)
        saveLog()
      }
    } catch (e: any) {
      console.error(`  [error] ${localPath}: ${e.message}`)
      errorCount++
      done++
    }
  }

  console.log(`[images] Done: uploaded=${uploadedCount}, skipped=${skippedCount}, errors=${errorCount}`)
  saveLog()
}

// ─── Step: Tags ───────────────────────────────────────────────────────────────

async function migrateTags() {
  const rows = readCSV('Движ - Tags.csv')
  let created = 0, updated = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Slug']
    if (!slug) continue

    const { action } = await upsert('tags', slug, {
      name: row['Name'],
      slug,
      description: row['Description'] || undefined,
    }, log.tags)

    action === 'created' ? created++ : updated++
  }

  console.log(`[tags] created=${created}, updated=${updated}`)
  saveLog()
}

// ─── Step: Companies ──────────────────────────────────────────────────────────

async function migrateCompanies() {
  const rows = readCSV('Движ - Companies.csv')
  let created = 0, updated = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Slug']
    if (!slug) continue

    const body: Record<string, unknown> = {
      name: row['Name'],
      slug,
      description: row['Description'] || undefined,
      link: row['Link'] || undefined,
      linkText: row['Link Text'] || undefined,
    }

    const logoId = resolveMediaId(row['Logo'])
    if (logoId) body.logo = logoId

    try {
      const { action } = await upsert('companies', slug, body, log.companies)
      action === 'created' ? created++ : updated++
    } catch (e: any) {
      console.error(`  [error] "${slug}": ${e.message?.slice(0, 300)}`)
    }
  }

  console.log(`[companies] created=${created}, updated=${updated}`)
  saveLog()
}

// ─── Step: Persons ────────────────────────────────────────────────────────────

async function migratePersons() {
  const rows = readCSV('Движ - Persons.csv')
  let created = 0, updated = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Slug']
    if (!slug) continue

    const body: Record<string, unknown> = {
      name: row['Name'],
      slug,
      jobTitle: row['Jot title'] || undefined,
      description: row['Description'] || undefined,
    }

    const photoId = resolveMediaId(row['Photo'])
    if (photoId) body.photo = photoId

    const companySlug = row['Компания']
    if (companySlug) {
      const companyId = resolveId(log.companies, companySlug)
      if (companyId !== null) body.company = companyId
      else console.warn(`  [warn] person "${slug}": company slug not found: "${companySlug}"`)
    }

    try {
      const { action } = await upsert('persons', slug, body, log.persons)
      action === 'created' ? created++ : updated++
    } catch (e: any) {
      console.error(`  [error] "${slug}": ${e.message?.slice(0, 300)}`)
    }
  }

  console.log(`[persons] created=${created}, updated=${updated}`)
  saveLog()
}

// ─── Step: Categories ─────────────────────────────────────────────────────────

async function migrateCategories() {
  const rows = readCSV('Движ - Categories.csv')
  let created = 0, updated = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Slug']
    if (!slug) continue

    const { action } = await upsert('categories', slug, {
      title: row['Name'],
      slug,
    }, log.categories)

    action === 'created' ? created++ : updated++
  }

  console.log(`[categories] created=${created}, updated=${updated}`)
  saveLog()
}

// ─── Step: Blog posts ─────────────────────────────────────────────────────────

async function migrateBlogPosts() {
  const rows = readCSV('Движ - Articles.csv')
  let created = 0, updated = 0, errors = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Ссылка на статью']
    if (!slug) continue

    const isDraft = parseBool(row['Draft'])

    const body: Record<string, unknown> = {
      title: row['Заголовок'],
      slug,
      excerpt: row['Мини описание статьи'] || undefined,
      _status: isDraft ? 'draft' : 'published',
    }

    // Date: prefer explicit publish date, fall back to Published On
    const rawDate = row['Дата публикации'] || row['Published On']
    if (rawDate) {
      try { body.publishedAt = new Date(rawDate).toISOString() } catch {}
    }

    // Cover image
    const coverId = resolveMediaId(row['Обложка'])
    if (coverId) body.cover = coverId

    // Category
    const categorySlug = row['Категория']
    if (categorySlug) {
      const catId = resolveId(log.categories, categorySlug)
      if (catId !== null) body.category = catId
      else console.warn(`  [warn] "${slug}": category not found: "${categorySlug}"`)
    }

    // Company
    const companySlug = row['Компания']
    if (companySlug) {
      const companyId = resolveId(log.companies, companySlug)
      if (companyId !== null) body.company = companyId
    }

    // Primary author
    const primaryAuthorSlug = row['Выбор основного автора']
    if (primaryAuthorSlug) {
      const authorId = resolveId(log.persons, primaryAuthorSlug)
      if (authorId !== null) body.primaryAuthor = authorId
      else console.warn(`  [warn] "${slug}": primaryAuthor not found: "${primaryAuthorSlug}"`)
    }

    // Co-authors
    const coAuthorSlugs = splitSemicolon(row['Выбор нескольких авторов'])
    if (coAuthorSlugs.length > 0) {
      body.coAuthors = lookupIds(coAuthorSlugs, log.persons, 'coAuthor')
    }

    // Tags
    const tagSlugs = splitSemicolon(row['Выбор тегов'])
    if (tagSlugs.length > 0) {
      body.tags = lookupIds(tagSlugs, log.tags, 'tag')
    }

    // Body HTML with image URL replacement
    const rawHtml = row['Тело статьи']
    if (rawHtml) {
      body.bodyHtml = replaceMediaUrls(rawHtml)
    }

    try {
      const { action } = await upsert('blog-posts', slug, body, log.blogPosts)
      action === 'created' ? created++ : updated++

      const total = created + updated
      if (total % 50 === 0) {
        console.log(`  ${total} processed (created=${created}, updated=${updated}, errors=${errors})...`)
        saveLog()
      }
    } catch (e: any) {
      console.error(`  [error] "${slug}": ${e.message?.slice(0, 200)}`)
      errors++
    }
  }

  console.log(`[blog-posts] created=${created}, updated=${updated}, errors=${errors}`)
  saveLog()
}

// ─── Step: Glossaries ─────────────────────────────────────────────────────────

async function migrateGlossaries() {
  const rows = readCSV('Движ - Glossaries.csv')
  let created = 0, updated = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Slug']
    if (!slug) continue

    const showLeadForm = parseBool(row['Показывать лид форму?'] || 'false')
    const showBanner = parseBool(row['Показывать баннер?'] || 'false')

    const body: Record<string, unknown> = {
      name: row['Name'],
      slug,
      description: row['Description'] || undefined,
      bodyHtml: row['Body'] ? replaceMediaUrls(row['Body']) : undefined,
      showLeadForm,
      formTitle: showLeadForm ? row['Form title'] || undefined : undefined,
      formDescription: showLeadForm ? row['Form description'] || undefined : undefined,
      showBanner,
      bannerTitle: showBanner ? row['Banner title'] || undefined : undefined,
      bannerDescription: showBanner ? row['Banner description'] || undefined : undefined,
      bannerButtonText: showBanner ? row['Button text'] || undefined : undefined,
      bannerButtonLink: showBanner ? row['Button link'] || undefined : undefined,
    }

    const { action } = await upsert('glossaries', slug, body, log.glossaries)
    action === 'created' ? created++ : updated++

    const total = created + updated
    if (total % 50 === 0) {
      console.log(`  ${total} processed...`)
      saveLog()
    }
  }

  console.log(`[glossaries] created=${created}, updated=${updated}`)
  saveLog()
}

// ─── Step: Events ─────────────────────────────────────────────────────────────

async function migrateEvents() {
  const rows = readCSV('Движ - Client days.csv')
  let created = 0, updated = 0

  for (const row of rows) {
    if (parseBool(row['Archived'])) continue
    const slug = row['Slug']
    if (!slug) continue

    const body: Record<string, unknown> = {
      name: row['Name'],
      slug,
      subtitle: row['Subtitle'] || undefined,
      date: row['Date'] || undefined,
      time: row['Time'] || undefined,
      address: row['Address'] || undefined,
      mapLink: row['Link to the map'] || undefined,
      formTitle: row['Form title'] || undefined,
      description: row['Description'] ? replaceMediaUrls(row['Description']) : undefined,
    }

    const mapScreenshotId = resolveMediaId(row['Map screenshot'])
    if (mapScreenshotId) body.mapScreenshot = mapScreenshotId

    const { action } = await upsert('events', slug, body, log.events)
    action === 'created' ? created++ : updated++
  }

  console.log(`[events] created=${created}, updated=${updated}`)
  saveLog()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const STEPS = {
  images: uploadImages,
  tags: migrateTags,
  companies: migrateCompanies,
  persons: migratePersons,
  categories: migrateCategories,
  posts: migrateBlogPosts,
  glossaries: migrateGlossaries,
  events: migrateEvents,
} as const

async function main() {
  await authenticate()

  if (STEP) {
    const fn = STEPS[STEP as keyof typeof STEPS]
    if (!fn) {
      console.error(`Unknown step: "${STEP}". Available: ${Object.keys(STEPS).join(', ')}`)
      process.exit(1)
    }
    console.log(`\n=== ${STEP} ===`)
    await fn()
  } else {
    for (const [name, fn] of Object.entries(STEPS)) {
      console.log(`\n=== ${name} ===`)
      await fn()
    }
  }

  console.log('\nMigration complete.')
}

main().catch(e => {
  console.error('Fatal:', e)
  saveLog()
  process.exit(1)
})
