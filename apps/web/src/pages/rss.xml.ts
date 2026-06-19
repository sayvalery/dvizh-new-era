import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getBlogPosts } from '../lib/payload'
import { normalizeMediaUrl } from '../lib/payload'

export async function GET(context: APIContext) {
  const { docs: posts } = await getBlogPosts({ limit: 200 })

  return rss({
    title: 'ДВИЖ — Блог',
    description: 'AI-платформа для автоматизации продаж и маркетинга застройщиков. Статьи, кейсы, исследования.',
    site: context.site!.toString(),
    items: posts.map((post: any) => {
      // Нормализуем CMS-URL обложки (origin + двойная URL-кодировка), затем делаем
      // абсолютным относительно site — enclosure в RSS требует абсолютного URL.
      const coverPath = normalizeMediaUrl(post.cover?.url)
      const enclosureUrl = coverPath ? new URL(coverPath, context.site).toString() : null
      return {
        title: post.title,
        pubDate: new Date(post.publishedAt || post.createdAt),
        description: post.excerpt || '',
        link: `/blog/${post.slug}`,
        ...(enclosureUrl ? { enclosure: { url: enclosureUrl, length: 0, type: 'image/jpeg' } } : {}),
      }
    }),
    customData: '<language>ru-ru</language>',
  })
}
