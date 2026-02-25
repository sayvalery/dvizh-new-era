import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Мероприятие', plural: 'Мероприятия' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date'],
    preview: (doc) => `${process.env.WEB_URL}/events/${doc.slug}`,
  },
  fields: [
    {
      name: 'name',
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
      admin: { description: 'URL: /events/[slug]' },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Подзаголовок',
    },
    {
      name: 'date',
      type: 'text',
      label: 'Дата (текст)',
      admin: { description: 'Например: 17 апреля' },
    },
    {
      name: 'time',
      type: 'text',
      label: 'Время (текст)',
      admin: { description: 'Например: с 17:00 до 22:00' },
    },
    {
      name: 'address',
      type: 'text',
      label: 'Адрес',
    },
    {
      name: 'mapLink',
      type: 'text',
      label: 'Ссылка на карту',
    },
    {
      name: 'mapScreenshot',
      type: 'upload',
      relationTo: 'media',
      label: 'Скриншот карты',
    },
    {
      name: 'formTitle',
      type: 'text',
      label: 'Заголовок формы регистрации',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание (HTML)',
      admin: { rows: 8 },
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
