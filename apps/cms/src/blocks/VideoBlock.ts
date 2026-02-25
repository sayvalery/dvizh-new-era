import type { Block } from 'payload'

export const VideoBlock: Block = {
  slug: 'video',
  labels: { singular: 'Видео', plural: 'Видео' },
  fields: [
    {
      name: 'url',
      type: 'text',
      label: 'URL видео',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
    },
  ],
}
