import type { CollectionConfig } from 'payload'

export const Persons: CollectionConfig = {
  slug: 'persons',
  labels: { singular: 'Персона', plural: 'Персоны' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'jobTitle'],
    group: 'Контент',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото',
    },
    {
      name: 'jobTitle',
      type: 'text',
      label: 'Должность',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      label: 'Компания',
    },
  ],
}
