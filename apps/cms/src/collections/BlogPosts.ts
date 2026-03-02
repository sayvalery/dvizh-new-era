import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { RichTextBlock } from '../blocks/RichText'
import { ImageBlock } from '../blocks/ImageBlock'
import { FormBlock } from '../blocks/FormBlock'
import { CTABlock } from '../blocks/CTABlock'
import { VideoBlock } from '../blocks/VideoBlock'
import { QuoteBlock } from '../blocks/QuoteBlock'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: { singular: 'Статья', plural: 'Статьи' },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-fill SEO meta from post fields if empty
        if (!data.meta) data.meta = {}
        if (!data.meta.title && data.title) {
          data.meta.title = data.title.length > 60 ? data.title.slice(0, 57) + '...' : data.title
        }
        if (!data.meta.description && data.excerpt) {
          data.meta.description = data.excerpt.length > 160 ? data.excerpt.slice(0, 157) + '...' : data.excerpt
        }
        if (!data.meta.image && data.cover) {
          data.meta.image = typeof data.cover === 'string' ? data.cover : data.cover?.id ?? data.cover
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    preview: (doc) => `${process.env.WEB_URL}/blog/${doc.slug}`,
    group: 'Контент',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: { description: 'URL: /blog/[slug]' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Категория',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Анонс',
      admin: { description: 'Короткое описание для списка статей' },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Обложка',
    },
    {
      name: 'content',
      type: 'blocks',
      label: 'Контент',
      blocks: [RichTextBlock, ImageBlock, FormBlock, CTABlock, VideoBlock, QuoteBlock],
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      label: 'Тело статьи (HTML)',
      admin: {
        description: 'HTML-контент, мигрированный из Webflow. Если заполнено — используется вместо блоков.',
        rows: 15,
        condition: (data) => !data.content?.length,
      },
    },
    {
      name: 'author',
      type: 'text',
      label: 'Автор (текст) [deprecated]',
      admin: {
        description: 'Устаревшее поле. Используй primaryAuthor.',
        hidden: true,
      },
    },
    {
      name: 'primaryAuthor',
      type: 'relationship',
      relationTo: 'persons',
      label: 'Основной автор',
    },
    {
      name: 'coAuthors',
      type: 'relationship',
      relationTo: 'persons',
      hasMany: true,
      label: 'Соавторы',
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      label: 'Компания',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Теги',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', label: 'Meta title' },
        { name: 'description', type: 'textarea', label: 'Meta description' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'OG Image' },
      ],
    },
  ],
}
