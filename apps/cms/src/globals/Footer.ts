import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Футер',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Колонки',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Заголовок колонки',
        },
        {
          name: 'links',
          type: 'array',
          label: 'Ссылки',
          fields: [
            { name: 'label', type: 'text', label: 'Название', required: true },
            { name: 'href', type: 'text', label: 'Ссылка', required: true },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'Копирайт',
      defaultValue: '© 2024 Dvizh',
    },
  ],
}
