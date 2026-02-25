import type { CollectionConfig } from 'payload'

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Видео', plural: 'Видео' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'publishedAt'],
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
      admin: { description: 'URL: /video/[slug]' },
    },
    {
      name: 'type',
      type: 'select',
      label: 'Тип',
      required: true,
      options: [
        { label: 'Вебинар', value: 'webinar' },
        { label: 'Конференция', value: 'conference' },
        { label: 'Подкаст', value: 'podcast' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'URL видео',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Обложка',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата',
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
