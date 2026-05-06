# История работы над проектом — ветка `stacy`

## Контекст

Разработчик: Stacy (a.sheveleva@dvizh.io), ветка `stacy` → мерджится в `dev`.
Figma: `PnfTfcrl6KaCZU0mEMQiws` (Перенос сайта блог)

---

## Новые компоненты (созданы с нуля)

### `ModalCard.astro` — карточка продукта
- Иконка 60×60 + заголовок + описание
- Hover: `bg-background-secondary` + `text-brand`
- Prop `href` → рендерит `<a>`, без — `<div>` (явный conditional, не динамический тег!)
- **Figma:** node 311:5194

### `ModalSection.astro` — секция продуктов по этапам сделки
- Группы: подзаголовок-категория (слева) + сетка `ModalCard` (справа)
- Desktop lg+: ширина колонки-подзаголовка = `calc((100%-3rem)/3)` (совпадает с 1 карточкой `SuccessStoryBlock grid-cols-3`)
- Mobile < lg: колонка, подзаголовок сверху
- **Figma:** node 308:5042

### `FeatureBlock.astro` — секция с авто-переключающимися пунктами
- Переименован из `DeveloperBlock` → `FeatureBlock`
- Props: `heading`, `description?`, `button?`, `imageSide?: 'left'|'right'`
- Desktop: 2 колонки (текст + изображение), `lg:aspect-square lg:self-end`
- Mobile: одна колонка, изображение inline под активным пунктом (Alpine.js + max-height анимация)
- Точки-буллеты удалены
- **Figma:** 402:7195 (desktop), 418:4462 (mobile)

### `FormClosing.astro` — секция-закрытие страницы (обновлён)
- Добавлен `mode: 'form' | 'buttons'`
- `mode="buttons"`: две кнопки (`Button primary` + `Button dark`) вместо полей формы
- `items[]`: список с иконкой check circle SVG
- Дефолтный фон: `#F3F1EE` (background-secondary)
- **Figma:** node 344:5373

### `KeyFacts.astro` — нумерованные факты/метрики (от 533va)
- 2–4 колонки, вертикальная черта

### `TextImageBlock.astro` — текст слева + слот для изображения справа (от 533va)

### `ReviewFull.astro` — полная цитата-отзыв (от 533va)

---

## Обновлённые компоненты

### `NavBar.astro`
- Фон хедера: `bg-background-primary` (#FBF9F6)
- Dropdown фон: `bg-background-primary`, hover: `bg-background-secondary`
- **Адаптив (по Figma 431:4749):**
  - `< 480px`: лого + ghost-гамбургер (прозрачный, тёмная иконка)
  - `480–639px (xs)`: лого + ghost-гамбургер (тёмный квадрат)
  - `640px+ (sm)`: лого + телефон + «Получить расчет» + тёмный гамбургер
  - `1024px+ (lg)`: полная навигация
- Мобильное меню: лого СЛЕВА, ✕ СПРАВА, плоская навигация, «ИЗ БЛОГА», bottom bar с телефоном + CTA
- Текстовые стили: `text-body-lg`, `text-side-menu`, `text-btn`
- **Известный баг:** телефон+CTA должны появляться только с `sm` (640px), иначе overflow

### `HeroSection.astro`
- Full layout: `pb-16 lg:pb-24` (внутри content container)
- Кнопки: `flex-col xs:flex-row gap-4` + `w-full xs:flex-1 lg:flex-none lg:w-auto`

### `StoryCard.astro`
- Спейсер 64px между логотипом и нижним контентом (`flex-1 min-h-16`)
- Поддержка variant: `active` (с фоном) | `default` (светлый)

### `SuccessStoryBlock.astro`
- Убран `lg:h-[500px]` — карточки растут по контенту
- Отступы между карточками: `gap-6` (24px)
- Ширина заголовка: `max-w-[800px] w-full` (было `w-[800px] max-w-full` — это ломало адаптив!)

### `ComparisonSection.astro`
- Добавлен variant `prices` (ценовое сравнение)
- Фон левой карточки: `bg-background-secondary`
- Кнопки: `Button primary` + `Button ghost-dark`
- Заголовок: `max-w-[800px] w-full` (то же исправление)

### `LogoGrid.astro`
- 4 копии логотипов в одну строку, анимация `translateX(-25%)` (бесшовный loop)
- `max-width: 7.5rem` на логотипах
- `padding: 2rem 0`
- Использовать логотипы из `/partners/dark/` (тёмные SVG)

### `Button.astro`
- Добавлен вариант `ghost-dark`: прозрачный фон, белый текст, `hover:bg-white/10`

### `PersonCard.astro`
- Добавлен prop `showPhoto?: boolean` (default `true`) — скрывает аватар

---

## Типографика (global.css)

### Ключевое исправление cascade
Глобальные `h1, h2...` тег-селекторы с `letter-spacing` стояли вне `@layer` и перекрывали `@layer components` утилиты. **Убраны** — теперь letter-spacing берётся только из утилитарных классов.

### Текущая шкала заголовков

| Класс | Шрифт | Размеры | letter-spacing |
|-------|-------|---------|---------------|
| `text-h1` | Styrene A, 700 | 28px → 42px (sm) → 64px (lg) | -1px |
| `text-h2` | Styrene A, 500 | 24px → 32px (md) → 48px (lg) | -2px |
| `text-h3` | Styrene A, 500 | 24px → 32px (lg) | -1px |
| `text-h4` | Styrene A, 500 | 18px → 24px (lg) | -2px |
| `text-h5` | Styrene A, 700 | 16px → 18px (lg) | -1px |
| `text-h6` | Styrene A, 700 | 14px → 16px (lg) | -1px |
| `text-body-lg` | Inter, 400 | 16px → 18px (sm) | -0.5px |
| `text-side-menu` | Inter, 600 | 12px, uppercase, tracking 1px | — |

---

## Дизайн-система (Figma)

### Спейсинги (коллекция `Spacing`)
Полная шкала Tailwind от `0` (0px) до `96` (384px), 34 токена.
Визуальная шкала на странице **Spacing & Radius** расширена до spacing/96 (384px).

### Варианты кнопок
| Вариант | Стиль |
|---------|-------|
| `primary` | оранжевый фон, белый текст |
| `secondary` | белый фон, тёмный текст |
| `ghost` | прозрачный, тёмный текст |
| `ghost-dark` | прозрачный, белый текст (для тёмных фонов) |
| `dark` | тёмный фон (#1D1E21), белый текст |

---

## Страница /developers — текущая структура

```
HeroSection (full layout, прозрачный NavBar)
↓
[gap-контейнер: gap-10 xs:gap-12 md:gap-24 lg:gap-36]
  FeatureBlock "Повышаем конверсию в 2 раза"
  LogoGrid (партнёры)
  SuccessStoryBlock "70+ историй успеха"
  <div class="page-container"> ModalSection "Добиваемся высоких конверсий..." </div>
  ComparisonSection "Одно решение для всей сделки"
  <div class="page-container"> FormClosing mode="buttons" "Аудит отдела продаж" </div>
[/gap-контейнер]
```

### Spacing логика
- Компоненты **без** собственных `py-` (убраны)
- Gap-контейнер управляет всеми отступами между блоками
- HeroSection вне контейнера, отступ снизу: `pb-16 lg:pb-24` (внутри content div)
- `lg:pb-36` (144px) на самой `<section>` HeroSection для совпадения с gap

---

## Важные решения и подводные камни

### Горизонтальный overflow
- **Причина 1:** `w-[800px] max-w-full` на заголовках → при gap-контексте без строгого parent-width создаёт overflow. **Фикс:** заменить на `max-w-[800px] w-full`
- **Причина 2:** NavBar на xs (480-639px) показывал телефон+CTA+гамбургер → переполнение. **Фикс:** телефон и CTA только с `sm` (640px+)

### Динамические теги в Astro
`const Tag = 'a' | 'div'` + spread props не работает надёжно. Использовать явный conditional рендеринг:
```astro
{href ? <a href={href} class={cls}>...</a> : <div class={cls}>...</div>}
```

### CSS Cascade с `@layer`
Стили вне `@layer` имеют ВЫСШИЙ приоритет — перекрывают даже `@layer utilities`. Все кастомные стили должны быть внутри `@layer base/components/utilities`.

### LogoGrid и marquee
`min-width: 100%` на наборах логотипов создаёт огромный пустой хвост при малом количестве логотипов. Решение: 4 копии + `translateX(-25%)`.

---

## Текущее состояние веток

| Ветка | Статус |
|-------|--------|
| `stacy` | актуальная рабочая |
| `dev` | ниже stacy на несколько коммитов |
| `533va` | синхронизирована с stacy |

**Последний коммит:** `41616ca` — fix(typography): убрать letter-spacing из глобальных тег-селекторов

---

## Что ещё можно сделать

- [ ] Вернуть `lg:pb-36` на HeroSection section (для совпадения с gap lg:gap-36)
- [ ] Проверить адаптив остальных страниц (не только /developers)
- [ ] Добавить изображения в ModalCard (пока серые заглушки)
- [ ] Передать иконки для FeatureBlock
