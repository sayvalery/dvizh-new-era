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
    items: posts.map((post: any) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt || post.createdAt),
      description: post.excerpt || '',
      link: `/blog/${post.slug}`,
      ...(post.cover?.url ? { enclosure: { url: `${context.site}api/media/file/${post.cover.url.split('/').pop()}`, length: 0, type: 'image/jpeg' } } : {}),
    })),
    customData: '<language>ru-ru</language>',
  })
}
