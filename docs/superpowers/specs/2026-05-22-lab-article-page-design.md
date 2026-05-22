# Lab: Article Page — design

**Дата:** 2026-05-22
**Автор:** Valery Sayfullin
**Файл реализации:** `apps/web/src/pages/lab/article-page.astro`

## Цель

Экспериментальная страница в `/lab/` для отработки нового layout страницы статьи (универсальный шаблон под блог-пост/кейс/research). Доступна по адресу `preview.dvizh.cc/lab/article-page` (dev-only). Текущая итерация — только desktop-брейкпойнты `2xl` и `xl`. Адаптация `sm/md/lg` — отдельной итерацией.

## Контент

- Источник: реальный пост из CMS, slug захардкожен — `case-ayaks-dvizh`.
- Запрос: `getBlogPost('case-ayaks-dvizh')` через существующий `apps/web/src/lib/payload.ts`.
- Если пост не найден — редирект на `/404` (как в `blog/[slug].astro`).

## Layout (2xl / xl)

Два горизонтальных контейнера, оба внутри `.page-container` (max-width 1440px, стандартные горизонтальные паддинги дизайн-системы).

### Контейнер 1 — шапка статьи

Grid: `grid-cols-[340px_1fr] gap-x-10` (40px между колонками).

**Левая колонка (340px) — мета:**
- Хлебные крошки: `Блог › Категория` (если категория есть).
- Автор: компонент `PersonCard variant="inline"` (уже есть в `components/ui/PersonCard.astro`).
- Дата публикации (`post.publishedAt`, локаль `ru-RU`, формат «27 февраля 2026»).
- Время чтения — расчёт по словам (как в `blog/[slug].astro:72-74`: `Math.ceil(wordCount / 200)`).

Вертикальный flex-стэк. Шрифт мелкий (`.text-footnote` / `.text-subhead`), цвет `text-gray-500`.

**Правая колонка (1fr) — заголовок:**
- Заголовок статьи — `<h2 class="text-h2 text-gray-900">{post.title}</h2>`.
- Подзаголовок — `<p class="text-body-lg text-gray-500">{post.excerpt}</p>` (если есть).

### Контейнер 2 — тело статьи

Grid: `grid-cols-[340px_1fr] gap-x-10`.

**Левая колонка (340px) — sticky TOC:**
- `<aside class="sticky top-24 self-start">`.
- Двухуровневое оглавление: первый уровень — H2 статьи, второй уровень — H3 (с отступом слева).
- Источник пунктов: парсинг bodyHtml/RichText на билде → массив вида `[{level:2, id, text, children:[{level:3, id, text}]}]`.
- Активный пункт подсвечивается по скроллу через Alpine-компонент `articleToc` с `IntersectionObserver` (см. секцию «Интерактив»).
- Клик по пункту — обычный якорь `<a href="#{id}">`. Плавный скролл — CSS `html { scroll-behavior: smooth }` (если ещё не глобально, добавить локально на странице).
- Если в статье нет H2 — колонка пустая, без падения сборки.

**Правая колонка (1fr) — обложка + тело:**
- Обложка: `<img src={normalizeMediaUrl(post.cover?.url)} class="w-full rounded-xl aspect-video object-cover mb-10">` (если есть).
- Тело статьи:
  - Если `post.content` (RichText блоки) — `<BlockRenderer blocks={post.content} />`.
  - Иначе если `post.bodyHtml` — `<div class="prose prose-lg max-w-none" set:html={bodyHtmlWithIds} />` (через `sanitizeBodyHtml(normalizeBodyHtml(...))`, как в `blog/[slug].astro`).

Между контейнерами — вертикальный отступ ≈ `mt-16` (64px). Финальный размер уточним по факту.

## Извлечение TOC и проставление id

Заголовкам в теле статьи нужно проставить `id`, чтобы якорные ссылки TOC работали.

**Для `bodyHtml`:**
- В скрипте Astro (frontmatter) — regex по `bodyHtml` ищем все `<h2>...</h2>` и `<h3>...</h3>`, для каждого вычисляем slug текста (через утилитарную функцию — простой transliterate + lowercase + replace non-alnum на `-`).
- Собираем массив `tocItems` для рендера TOC.
- В `bodyHtml` подменяем теги на `<h2 id="{slug}">...</h2>` и `<h3 id="{slug}">...</h3>`.

**Для RichText (`post.content`):**
- Если используем `BlockRenderer`, нужна возможность пробросить id в `RichTextBlock`. На этой итерации **не трогаем RichText-ветку** — `case-ayaks-dvizh` использует `bodyHtml` (как большинство импортированных из Webflow). Если у поста только RichText — TOC просто пустой (graceful degradation).

Slugify — лёгкая локальная функция в файле страницы (не выносим в `lib/`, потому что lab). Корректно обрабатывает кириллицу через простую трансли­терацию (готовая таблица).

## Интерактив (Alpine.js)

Один компонент: `<aside x-data="articleToc()" ...>`.

```js
function articleToc() {
  return {
    activeId: null,
    init() {
      const headings = document.querySelectorAll('article h2[id], article h3[id]')
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) this.activeId = entry.target.id
          }
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      headings.forEach(h => observer.observe(h))
    },
  }
}
```

Подсветка активного пункта — через `:class="{ 'text-brand': activeId === 'slug-here' }"` или, чтобы не дублировать, через атрибут data + `:class`.

Никаких внешних библиотек. Никаких отдельных `.js` файлов — inline `<script>` в конце страницы (как в других lab-страницах проекта).

## Что НЕ делаем в этой итерации

- Адаптация под `sm/md/lg` (мобилки/планшеты) — отдельный спринт.
- Блок автора в подвале, шаринг (Telegram/VK/копия ссылки), «Читайте также», CTA в конце — вне скоупа.
- Поддержка id у RichText-заголовков в `BlockRenderer` — вне скоупа.
- Регистрация страницы в UI Kit (lab-страницы туда не идут).
- Изменения в CMS (новые поля типа `toc` — не нужны, всё извлекаем на билде).

## Зависимости и риски

- Никаких новых npm-пакетов.
- `case-ayaks-dvizh` должен быть опубликован в CMS на момент билда. Если slug удалят/переименуют — lab сломается; это приемлемо (lab-страница, не прод).
- Slugify заголовков на билде должен дать те же id, что и regex-подмена в bodyHtml (одна функция, один источник истины).

## Acceptance

- Страница открывается по `preview.dvizh.cc/lab/article-page` без ошибок сборки.
- На viewport ≥ 1280px (xl) и ≥ 1536px (2xl): два контейнера по 340px+gap40+1fr.
- Левая колонка контейнера 1 — мета (хлебные крошки, автор, дата, время чтения).
- Правая колонка контейнера 1 — H2-заголовок статьи + excerpt.
- Левая колонка контейнера 2 — sticky двухуровневый TOC из H2/H3 статьи.
- Правая колонка контейнера 2 — обложка + тело статьи.
- Клик по пункту TOC — скролл к соответствующему заголовку.
- Активный пункт TOC подсвечивается при скролле (Alpine + IntersectionObserver).
- На viewport < 1280px — допустимо «как получится» (адаптация позже).
