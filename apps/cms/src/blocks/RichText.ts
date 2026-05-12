import type { Block } from 'payload'

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Текст', plural: 'Текстовые блоки' },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: 'Контент',
      // editor не указан — наследуется глобальный из payload.config.ts
      // (FixedToolbar + Heading H2-H4 + LinkFeature с nofollow + Strikethrough)
      required: true,
    },
  ],
}
