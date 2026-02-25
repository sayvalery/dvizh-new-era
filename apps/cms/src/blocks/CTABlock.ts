import type { Block } from 'payload'

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'CTA-баннер', plural: 'CTA-баннеры' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Заголовок',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      label: 'Описание',
    },
    {
      name: 'buttonText',
      type: 'text',
      label: 'Текст кнопки',
      required: true,
    },
    {
      name: 'buttonAction',
      type: 'select',
      label: 'Действие кнопки',
      required: true,
      defaultValue: 'sidebarForm',
      options: [
        { label: 'Открыть форму в сайдбаре', value: 'sidebarForm' },
        { label: 'Перейти по ссылке', value: 'link' },
      ],
    },
    {
      name: 'formPreset',
      type: 'select',
      label: 'Пресет формы',
      admin: { condition: (_data, siblingData) => siblingData?.buttonAction === 'sidebarForm' },
      options: [
        { label: 'Лид', value: 'lead' },
        { label: 'Подписка', value: 'subscribe' },
        { label: 'Демо', value: 'demo' },
        { label: 'Исследование', value: 'research' },
      ],
    },
    {
      name: 'link',
      type: 'text',
      label: 'Ссылка',
      admin: { condition: (_data, siblingData) => siblingData?.buttonAction === 'link' },
    },
  ],
}
