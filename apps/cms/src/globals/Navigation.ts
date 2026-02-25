import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Навигация',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Пункты меню',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Название',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          label: 'Ссылка',
          required: true,
        },
        {
          name: 'children',
          type: 'array',
          label: 'Подпункты',
          fields: [
            { name: 'label', type: 'text', label: 'Название', required: true },
            { name: 'href', type: 'text', label: 'Ссылка', required: true },
          ],
        },
      ],
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'Текст кнопки CTA',
      defaultValue: 'Запросить демо',
    },
    {
      name: 'ctaFormPreset',
      type: 'select',
      label: 'Форма кнопки CTA',
      defaultValue: 'demo',
      options: [
        { label: 'Лид', value: 'lead' },
        { label: 'Демо', value: 'demo' },
      ],
    },
  ],
}
