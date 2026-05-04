# ReviewFull Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать компонент `ReviewFull.astro` — блок отзыва с фото спикера слева (заглушка) и цитатой + строкой автора справа (через существующий `Review.astro`).

**Architecture:** `ReviewFull` — тонкая обёртка над `Review`. Левая колонка — фото с `object-cover h-full` (пока серая заглушка). Правая — `Review` с переданными props. Layout переключается `flex-col lg:flex-row` через `overflow-hidden rounded-2xl`.

**Tech Stack:** Astro 5, Tailwind CSS 3.4. Без новых зависимостей.

---

## Файловая карта

| Действие | Файл |
|----------|------|
| **Create** | `apps/web/src/components/ui/ReviewFull.astro` |
| **Modify** | `apps/web/src/pages/ui-kit/[...slug].astro` |

---

## Task 1: Создать компонент `ReviewFull.astro`

**Files:**
- Create: `apps/web/src/components/ui/ReviewFull.astro`

- [ ] **Step 1: Создать файл компонента**

Создать `apps/web/src/components/ui/ReviewFull.astro` со следующим содержимым:

```astro
---
/**
 * ReviewFull — блок отзыва с фото спикера слева
 *
 * Обёртка над Review: слева фото (или серая заглушка),
 * справа цитата + строка автора (лого, имя, кнопка кейса).
 *
 * @example
 * ```astro
 * <ReviewFull
 *   photo={{ src: "/api/media/file/speaker.jpg", alt: "Бурганов Рунар" }}
 *   quote="Разработка отдельного инструмента под каждый проект — это большие трудозатраты"
 *   author="Бурганов Рунар"
 *   role="Руководитель отдела ипотеки и финансовых инструментов"
 *   company={{ logo: "/api/media/file/kortros-logo.svg", alt: "Кортрос" }}
 *   caseLink={{ label: "Читать кейс", href: "/cases/kortros" }}
 * />
 * ```
 */

import Review from './Review.astro'

interface Company {
  /** Путь к логотипу */
  logo: string
  /** Alt-текст */
  alt?: string
}

interface Props {
  /** Фото спикера. Если src пустой — показывается серая заглушка */
  photo?: { src: string; alt?: string }
  /** Текст цитаты */
  quote: string
  /** Имя автора */
  author: string
  /** Должность / роль автора */
  role: string
  /** Логотип компании */
  company?: Company
  /** Ссылка на кейс */
  caseLink?: { label?: string; href: string }
  /** Дополнительные CSS-классы для внешнего контейнера */
  class?: string
}

const {
  photo,
  quote,
  author,
  role,
  company,
  caseLink,
  class: className = ''
} = Astro.props

const hasPhoto = photo?.src
---

<div class:list={['flex flex-col lg:flex-row rounded-2xl overflow-hidden bg-gray-100', className]}>

  <!-- Левая колонка: фото или заглушка -->
  <div class="relative w-full aspect-[4/3] lg:aspect-auto lg:w-72 lg:shrink-0">
    {hasPhoto ? (
      <img
        src={photo!.src}
        alt={photo!.alt ?? ''}
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      <div class="absolute inset-0 bg-gray-200" aria-hidden="true" />
    )}
  </div>

  <!-- Правая колонка: Review -->
  <div class="flex-1 p-8 lg:p-10">
    <Review
      quote={quote}
      author={author}
      role={role}
      company={company}
      caseLink={caseLink}
    />
  </div>

</div>
```

- [ ] **Step 2: Проверить, что dev-сервер не падает**

```bash
pnpm dev
```

Ожидание: сервер стартует без ошибок, открыть `http://localhost:4321` — страница грузится.

- [ ] **Step 3: Закоммитить компонент**

```bash
git add apps/web/src/components/ui/ReviewFull.astro
git commit -m "feat(ui): add ReviewFull component — review with speaker photo"
```

---

## Task 2: Добавить `ReviewFull` в UI Kit

**Files:**
- Modify: `apps/web/src/pages/ui-kit/[...slug].astro`

- [ ] **Step 1: Добавить импорты в начало frontmatter (после строки `import Review from ...`)**

В файле `apps/web/src/pages/ui-kit/[...slug].astro`, после строки 24 (`import Review from '../../components/ui/Review.astro'`) добавить:

```astro
import ReviewFull from '../../components/ui/ReviewFull.astro'
```

После строки 55 (`import reviewRaw from '../../components/ui/Review.astro?raw'`) добавить:

```astro
import reviewFullRaw from '../../components/ui/ReviewFull.astro?raw'
```

- [ ] **Step 2: Добавить парсинг метаданных (после строки 144 с `reviewMeta`)**

После строки `const reviewMeta = parseSource(reviewRaw)` добавить:

```ts
const reviewFullMeta = parseSource(reviewFullRaw)
```

- [ ] **Step 3: Добавить slug в массив навигации**

Найти массив `slug` / навигационный список (около строки 226, рядом с `{ slug: 'product-card-review', label: 'Review' }`). После этой записи добавить:

```ts
{ slug: 'review-full', label: 'ReviewFull' },
```

- [ ] **Step 4: Добавить секцию с демо (после блока `section === 'product-card-review'`, около строки 1738)**

После закрывающего `)}` блока `product-card-review` (строка 1738) добавить новый блок:

```astro
      {section === 'review-full' && (
        <div>
          <h1 class="text-3xl font-bold font-heading mb-6">ReviewFull</h1>
          <p class="text-gray-600 mb-4">
            Блок отзыва с фото спикера слева и цитатой справа. Обёртка над <code>Review</code>.
            Фото занимает всю высоту блока; при отсутствии src показывается серая заглушка.
          </p>
          <PropsTable props={reviewFullMeta.props} class="mb-10" />

          <div class="space-y-12">
            <div>
              <p class="text-sm font-medium text-gray-400 mb-4">С заглушкой (нет фото) + полный набор атрибутов</p>
              <p class="text-xs text-gray-400 mb-6"><code>{`<ReviewFull quote="..." author="..." role="..." company={{...}} caseLink={{...}} />`}</code></p>
              <ReviewFull
                quote="Разработка отдельного инструмента под каждый проект — это большие трудозатраты и финансовые расходы. За счёт использования стороннего решения мы оптимизируем наши процессы и сокращаем сроки реализации."
                author="Бурганов Рунар"
                role="Руководитель отдела ипотеки и финансовых инструментов"
                company={{ logo: "https://admin.dvizh.cc/api/media/file/kortros-logo.svg", alt: "Кортрос" }}
                caseLink={{ label: "Читать кейс", href: "#" }}
              />
            </div>

            <div>
              <p class="text-sm font-medium text-gray-400 mb-4">Без кнопки кейса и логотипа</p>
              <ReviewFull
                quote="Интеграция с ДВИЖем заняла неделю, а ROI превысил ожидания уже в первый месяц"
                author="Елена Козлова"
                role="Коммерческий директор"
              />
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Открыть UI Kit и проверить визуально**

В браузере открыть `http://localhost:4321/ui-kit/review-full`.

Проверить:
- Левая колонка отображает серую заглушку
- Правая колонка: цитата, логотип, имя/должность, кнопка — всё на месте
- На мобильной ширине (< 1024px): заглушка сверху `aspect-[4/3]`, контент снизу
- Скруглённые углы блока работают (фото/заглушка не вылезает за края)

- [ ] **Step 6: Закоммитить UI Kit**

```bash
git add apps/web/src/pages/ui-kit/[...slug].astro
git commit -m "feat(ui-kit): add ReviewFull demo section"
```

---

## Self-review

**Spec coverage:**
- ✅ Фото слева, full-height — реализовано через `absolute inset-0 + relative` контейнер
- ✅ Цитата справа — через `<Review />`
- ✅ Нижняя строка (лого + имя + кнопка) — внутри `<Review />`
- ✅ Заглушка вместо фото — `bg-gray-200` при пустом `photo.src`
- ✅ Адаптивность — `flex-col lg:flex-row`, мобайл `aspect-[4/3]`
- ✅ UI Kit демо — Task 2

**Placeholder scan:** Нет TBD/TODO. Весь код полный.

**Type consistency:** `photo`, `quote`, `author`, `role`, `company`, `caseLink` — одинаковые имена в Props, компоненте и демо-примерах. `Company` interface совпадает с `Review.astro`.
