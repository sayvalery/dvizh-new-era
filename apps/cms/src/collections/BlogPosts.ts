import type { CollectionConfig } from 'payload'
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
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'blog-posts',
      hasMany: true,
      maxRows: 3,
      label: 'Связанные статьи (вручную)',
      admin: {
        description: 'Опционально. Если выбраны — показываются первыми. Остальные слоты добиваются автоматически из той же категории.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    // SEO-поля добавляются автоматически плагином @payloadcms/plugin-seo
    // (см. payload.config.ts → plugins). Превью SERP-выдачи и автозаполнение
    // из title/excerpt/cover включены через generateTitle/Description/Image.
  ],
}
