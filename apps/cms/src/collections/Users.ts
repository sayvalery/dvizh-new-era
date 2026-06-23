import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: {
    useAsTitle: 'email',
    group: 'Система',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
    },
  ],
}
