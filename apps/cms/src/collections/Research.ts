import type { CollectionConfig } from 'payload'
import { RichTextBlock } from '../blocks/RichText'
import { ImageBlock } from '../blocks/ImageBlock'
import { CTABlock } from '../blocks/CTABlock'

export const Research: CollectionConfig = {
  slug: 'research',
  labels: { singular: 'Исследование', plural: 'Исследования' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status'],
    group: 'Контент',
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Название',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: { description: 'URL: /research/[slug]' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'content',
      type: 'blocks',
      label: 'Контент',
      blocks: [RichTextBlock, ImageBlock, CTABlock],
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF-файл',
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
