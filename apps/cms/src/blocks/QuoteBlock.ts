import type { Block } from 'payload'

export const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Цитата', plural: 'Цитаты' },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      label: 'Текст цитаты',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      label: 'Автор',
    },
    {
      name: 'company',
      type: 'text',
      label: 'Компания',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото',
    },
  ],
}
