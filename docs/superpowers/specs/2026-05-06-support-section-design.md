# SupportSection — Дизайн-спецификация

**Дата:** 2026-05-06  
**Компонент:** `SupportSection.astro`  
**Папка:** `apps/web/src/components/ui/`

---

## Назначение

Блок «поддержки» — показывает команду поддержки ДВИЖ по трём направлениям. Справа три кликабельные плашки-табы, слева меняется большое фото представителя направления + мини-аватарки команды в верхнем левом углу. Используется на продуктовых страницах.

---

## Пропсы

```ts
interface Tab {
  icon: string        // путь к иконке/фото 56px (или '' для серого плейсхолдера)
  title: string       // заголовок плашки, напр. «15 консультантов поддержки»
  bullets: string[]   // 3 пункта описания
  photo: string       // большое фото слева (или '' для серого плейсхолдера)
  personName: string  // имя человека на фото
  personTitle: string // должность
  avatars: string[]   // url мини-аватарок в углу (до 4, пустые → серые кружки)
}

interface Props {
  title?: string          // дефолт: «Не оставим вас одних.»
  titleAccent?: string    // дефолт: «Ни на одном этапе» (оранжевый)
  subtitle?: string       // дефолт: текст из Figma
  tabs: Tab[]             // ровно 3 таба
  ctaLabel?: string       // дефолт: «Оставить заявку»
  ctaDrawerPreset?: 'demo' | 'lead'  // дефолт: 'demo'
}
```

---

## Лейаут

### Шапка
- `flex items-end justify-between`
- Слева: заголовок `.text-h2` (две строки — первая `text-gray-900`, вторая `text-brand`) + subtitle `.text-body-lg text-gray-500`
- Справа: кнопка CTA (оранжевая, открывает Drawer)

### Контент (два столбца, `gap-6`)
- **Левый столбец** — фиксированная ширина `~45%` (или `w-[708px]` на максимальной ширине), высота `h-full` — подстраивается под высоту правого столбца
- **Правый столбец** — `flex-1`, три плашки `flex-col gap-6 h-full`

### Адаптив
- `< lg`: один столбец, правые плашки располагаются под фото
- `>= lg`: два столбца side-by-side

---

## Левая карточка

`rounded-[24px] bg-background-secondary overflow-hidden relative`

### Фото (плейсхолдер)
- Три `<div>` или `<img>` с `position: absolute inset-0`, скрыты через `opacity-0`, активное — `opacity-100`
- Transition: `transition-opacity duration-500 ease-in-out`
- Плейсхолдер: `bg-gray-200 w-full h-full` (серый фон)

### Нейм-бейдж (внизу)
- `absolute bottom-0 left-0 right-0 p-6`
- Фон: `bg-gray-900/30 backdrop-blur-sm rounded-b-[24px]`
- Имя: `.text-h4 text-white`
- Должность: `.text-body-lg text-white/80`

### Мини-аватарки (верхний левый угол)
- `absolute top-6 left-6 flex gap-2`
- Максимум 3 видимых аватарки: `size-[54px] rounded-[12px] overflow-hidden border-2 border-white`
- Плейсхолдер: `bg-gray-300`
- Если avatars.length > 3: показать первые 3 + кружок `+N` (N = avatars.length - 3), стиль `bg-white/20 text-white .text-h5`
- Переключаются вместе с активным табом через Alpine `x-show` + `x-transition:enter`

---

## Правые плашки

Каждая плашка: `rounded-[24px] p-6 flex flex-col justify-between cursor-pointer transition-colors duration-300`

### Состояния

| Состояние | Фон | Текст заголовка | Иконка | Пули | Текст пунктов |
|---|---|---|---|---|---|
| Неактивная | `bg-background-secondary` | `text-gray-900` | `bg-gray-200` | `bg-gray-300` | `text-gray-500` |
| Hover | `bg-gray-200` | `text-gray-900` | `bg-gray-300` | `bg-gray-400` | `text-gray-600` |
| Активная | `bg-gray-900` | `text-white` | `bg-brand` | `bg-brand` | `text-white/80` |

### Структура плашки
```
[иконка 56px] [заголовок .text-h4]
---
• пункт 1
• пункт 2
• пункт 3
```

---

## Alpine.js

```js
x-data="{ active: 0 }"
```

- Клик на плашку: `:class="active === i ? 'bg-gray-900' : 'bg-background-secondary hover:bg-gray-200'"`
- Левое фото: `:class="active === i ? 'opacity-100' : 'opacity-0'"`
- Аватарки: `x-show="active === i"` + `x-transition:enter="transition-opacity duration-300"`

---

## Токены дизайн-системы

| Figma | Токен |
|---|---|
| `#f9f7f5` | `bg-background-secondary` |
| `#1d1e21` | `text-gray-900` / `bg-gray-900` |
| `#ff4d00` | `text-brand` / `bg-brand` |
| `#858585` | `text-gray-500` |
| Styrene A 64px w500 | `.text-h2` |
| Styrene A 24px w500 | `.text-h4` |
| Inter 18px | `.text-body-lg` |
| rounded-24px | `rounded-[24px]` |
| padding 24px | `p-6` |
| gap 24px | `gap-6` |

---

## UI Kit

После реализации добавить демо на страницу `/ui-kit` с тремя заглушечными табами.

---

## Файлы к созданию/изменению

- `apps/web/src/components/ui/SupportSection.astro` — новый компонент
- `apps/web/src/pages/ui-kit/[...slug].astro` — добавить демо (или соответствующий ui-kit файл)
