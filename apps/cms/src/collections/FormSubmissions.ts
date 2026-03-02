import type { CollectionConfig } from 'payload'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Сабмит формы', plural: 'Сабмиты форм' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'preset', 'createdAt'],
    description: 'Данные из форм на сайте. После сохранения отправляются в n8n/Albato.',
    group: 'Система',
  },
  access: {
    // Публичный POST для создания, только авторизованные для чтения
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'preset',
      type: 'select',
      label: 'Тип формы',
      required: true,
      options: [
        { label: 'Лид', value: 'lead' },
        { label: 'Подписка', value: 'subscribe' },
        { label: 'Демо', value: 'demo' },
        { label: 'Исследование', value: 'research' },
      ],
    },
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'company',
      type: 'text',
      label: 'Компания',
    },
    {
      name: 'page',
      type: 'text',
      label: 'Страница',
      admin: { description: 'URL страницы, с которой отправлена форма' },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        // Webhook в n8n/Albato
        const webhookUrl = process.env.FORM_WEBHOOK_URL
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(doc),
            })
          } catch (err) {
            console.error('Webhook error:', err)
          }
        }
      },
    ],
  },
}
