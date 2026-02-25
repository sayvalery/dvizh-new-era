import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Текст', plural: 'Текстовые блоки' },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: 'Контент',
      editor: lexicalEditor({}),
      required: true,
    },
  ],
}
