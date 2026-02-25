import type { CollectionConfig } from 'payload'
import { RichTextBlock } from '../blocks/RichText'
import { ImageBlock } from '../blocks/ImageBlock'
import { CTABlock } from '../blocks/CTABlock'
import { QuoteBlock } from '../blocks/QuoteBlock'

export const Cases: CollectionConfig = {
  slug: 'cases',
  labels: { singular: 'Кейс', plural: 'Кейсы' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status'],
  },
  versions: { drafts: true },
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
      admin: { description: 'URL: /cases/[slug]' },
    },
    {
      name: 'client',
      type: 'text',
      label: 'Клиент',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Краткое описание',
    },
    {
      name: 'content',
      type: 'blocks',
      label: 'Контент',
      blocks: [RichTextBlock, ImageBlock, CTABlock, QuoteBlock],
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', label: 'Meta title' },
        { name: 'description', type: 'textarea', label: 'Meta description' },
      ],
    },
  ],
}
