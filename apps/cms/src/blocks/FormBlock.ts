import type { Block } from 'payload'

export const FormBlock: Block = {
  slug: 'form',
  labels: { singular: 'Форма', plural: 'Формы' },
  fields: [
    {
      name: 'preset',
      type: 'select',
      label: 'Тип формы',
      required: true,
      options: [
        { label: 'Лид (имя, email, компания)', value: 'lead' },
        { label: 'Подписка (email)', value: 'subscribe' },
        { label: 'Демо (имя, email, телефон, компания)', value: 'demo' },
        { label: 'Исследование (имя, email, компания)', value: 'research' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок формы',
    },
    {
      name: 'description',
      type: 'text',
      label: 'Описание формы',
    },
  ],
}
