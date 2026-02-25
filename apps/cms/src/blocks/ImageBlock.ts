import type { Block } from 'payload'

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: 'Картинка', plural: 'Картинки' },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Изображение',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt-текст',
    },
  ],
}
