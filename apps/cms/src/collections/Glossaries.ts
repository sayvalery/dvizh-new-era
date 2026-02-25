import type { CollectionConfig } from 'payload'

export const Glossaries: CollectionConfig = {
  slug: 'glossaries',
  labels: { singular: 'Термин', plural: 'Глоссарий' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    preview: (doc) => `${process.env.WEB_URL}/glossary/${doc.slug}`,
    group: 'Контент',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Термин',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: { description: 'URL: /glossary/[slug]' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Краткое описание',
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      label: 'Тело (HTML)',
      admin: {
        description: 'HTML-контент термина. Мигрирован из Webflow.',
        rows: 10,
      },
    },
    {
      name: 'showLeadForm',
      type: 'checkbox',
      label: 'Показывать лид-форму',
      defaultValue: false,
    },
    {
      name: 'formTitle',
      type: 'text',
      label: 'Заголовок формы',
      admin: { condition: (data) => !!data.showLeadForm },
    },
    {
      name: 'formDescription',
      type: 'text',
      label: 'Описание формы',
      admin: { condition: (data) => !!data.showLeadForm },
    },
    {
      name: 'showBanner',
      type: 'checkbox',
      label: 'Показывать баннер',
      defaultValue: false,
    },
    {
      name: 'bannerTitle',
      type: 'text',
      label: 'Заголовок баннера',
      admin: { condition: (data) => !!data.showBanner },
    },
    {
      name: 'bannerDescription',
      type: 'text',
      label: 'Описание баннера',
      admin: { condition: (data) => !!data.showBanner },
    },
    {
      name: 'bannerButtonText',
      type: 'text',
      label: 'Текст кнопки баннера',
      admin: { condition: (data) => !!data.showBanner },
    },
    {
      name: 'bannerButtonLink',
      type: 'text',
      label: 'Ссылка кнопки баннера',
      admin: { condition: (data) => !!data.showBanner },
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
