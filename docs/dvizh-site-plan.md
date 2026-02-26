# Dvizh.io -- миграция с Webflow на Astro + Payload CMS

## Context

Корпоративный сайт dvizh.io на Webflow частично недоступен из-за блокировок РКН. Российские альтернативы (Taptop) недоступны через VPN. Патовая ситуация с потерей трафика. Решение: self-hosted статический сайт на Astro + Payload CMS с полным контролем инфраструктуры.

**Текущая цель:** собрать MVP-прототип для демонстрации CEO. Не прод. Должен работать локально (или на тестовом сервере), показывать рабочий пайплайн: CMS -> сборка -> статика. Маркетинг должен иметь возможность потыкать.

**Принцип разделения (по статье leerob.com/agents):**
- **В коде (Astro/MDX):** главная, о нас, контакты, продукты (7), решения (3), for-whom (4), thanks, 404. Редко меняются, AI-агент правит напрямую.
- **В Payload CMS:** блог, видео, кейсы, исследования, категории, формы, навигация, футер. Часто меняются, маркетологи управляют сами.

---

## Стек

- **Astro** -- генератор статики, SSG-режим
- **Payload CMS v3** -- headless CMS, code-first, Lexical rich text
- **Tailwind CSS** -- утилитарные стили
- **PostgreSQL** -- база для Payload
- **Docker Compose** -- локальный запуск всего стека одной командой
- **TypeScript** -- сквозная типизация

---

## Структура монорепы

```
dvizh-site/
├── apps/
│   ├── web/                    # Astro-сайт
│   │   ├── src/
│   │   │   ├── components/     # UI-компоненты (блоки, формы, навигация)
│   │   │   ├── layouts/        # Базовые шаблоны (default, blog, product)
│   │   │   ├── pages/          # Роутинг (файловый)
│   │   │   │   ├── index.astro                    # Главная
│   │   │   │   ├── about.astro                    # О нас
│   │   │   │   ├── contacts.astro                 # Контакты
│   │   │   │   ├── thanks.astro                   # Спасибо (после формы)
│   │   │   │   ├── products/
│   │   │   │   │   ├── index.astro                # Список продуктов
│   │   │   │   │   └── [slug].astro               # Продуктовая страница
│   │   │   │   ├── solutions/
│   │   │   │   │   ├── index.astro                # Список решений
│   │   │   │   │   └── [slug].astro               # Решение (для банков, девелоперов...)
│   │   │   │   ├── for-whom/
│   │   │   │   │   ├── index.astro                # Для кого
│   │   │   │   │   └── [slug].astro               # Конкретная роль
│   │   │   │   ├── blog/
│   │   │   │   │   ├── index.astro                # Список статей
│   │   │   │   │   ├── [slug].astro               # Статья
│   │   │   │   │   └── category/
│   │   │   │   │       └── [category].astro       # Фильтр по категории
│   │   │   │   ├── video/
│   │   │   │   │   ├── index.astro                # Список видео
│   │   │   │   │   └── [slug].astro               # Видео (вебинар/конференция/подкаст)
│   │   │   │   ├── research/
│   │   │   │   │   ├── index.astro                # Исследования
│   │   │   │   │   └── [slug].astro               # Конкретное исследование
│   │   │   │   ├── cases/
│   │   │   │   │   ├── index.astro                # Кейсы
│   │   │   │   │   └── [slug].astro               # Конкретный кейс
│   │   │   │   └── 404.astro                      # 404
│   │   │   ├── lib/
│   │   │   │   ├── payload.ts                     # API-клиент для Payload
│   │   │   │   └── utils.ts                       # Утилиты
│   │   │   └── styles/
│   │   │       └── global.css                     # Tailwind imports, базовые стили
│   │   ├── astro.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── cms/                    # Payload CMS
│       ├── src/
│       │   ├── collections/    # Типы контента
│       │   │   ├── Pages.ts             # Статические страницы (главная, о нас, контакты)
│       │   │   ├── Products.ts          # Продукты
│       │   │   ├── Solutions.ts         # Решения (для банков, девелоперов...)
│       │   │   ├── ForWhom.ts           # Для кого (роли)
│       │   │   ├── BlogPosts.ts         # Статьи блога
│       │   │   ├── Videos.ts            # Видео (вебинары, конференции, подкасты)
│       │   │   ├── Research.ts          # Исследования
│       │   │   ├── Cases.ts             # Кейсы
│       │   │   ├── Categories.ts        # Категории блога (управляемые из CMS)
│       │   │   ├── Media.ts             # Медиафайлы
│       │   │   └── FormSubmissions.ts   # Сабмиты форм
│       │   ├── blocks/         # Переиспользуемые блоки для Dynamic Zones
│       │   │   ├── RichText.ts          # Текстовый блок
│       │   │   ├── Image.ts             # Картинка с подписью
│       │   │   ├── Form.ts              # Форма (выбор пресета)
│       │   │   ├── CTA.ts               # CTA-баннер с кнопкой
│       │   │   ├── Video.ts             # Встроенное видео
│       │   │   ├── Quote.ts             # Цитата / отзыв
│       │   │   └── SidebarForm.ts       # Кнопка вызова сайдбара с формой
│       │   ├── globals/        # Глобальные данные
│       │   │   ├── Navigation.ts        # Меню навигации
│       │   │   └── Footer.ts            # Футер
│       │   └── payload.config.ts        # Главный конфиг
│       └── package.json
│
├── packages/
│   └── shared/                 # Общие типы
│       ├── types/              # Автогенерация из Payload
│       └── package.json
│
├── docker-compose.yml          # Payload + Postgres + (опционально) Astro dev
├── package.json                # Корневой (workspace)
├── turbo.json                  # Или pnpm workspaces
└── README.md
```

---

## Коллекции Payload (типы контента)

### Pages (статические страницы)
- title (text)
- slug (text, unique)
- content (Lexical rich text с inline-блоками)
- meta: SEO title, description, og:image
- status: draft / published

### Products (продукты)
- title (text)
- slug (text, unique) -- генерирует URL `/products/[slug]`
- description (text) -- короткое описание для карточки
- content (blocks -- Dynamic Zone)
- icon/image (media)
- order (number) -- порядок отображения
- meta: SEO
- status: draft / published

**Продукты:** ипотека, регистрация, скоринг, калькулятор, личный-кабинет, витрина, бизнес-ревью

### Solutions (решения)
- title (text)
- slug (text, unique) -- `/solutions/[slug]`
- description (text)
- content (blocks)
- meta: SEO
- status: draft / published

**Решения:** для банков, для девелоперов, для агентств недвижимости

### ForWhom (для кого)
- title (text)
- slug (text, unique) -- `/for-whom/[slug]`
- description (text)
- content (blocks)
- meta: SEO
- status: draft / published

**Роли:** департамент продаж, отдел ипотеки, отдел оформления, маркетинг и аналитика

### Categories (категории блога)
- title (text)
- slug (text, unique) -- используется в URL `/blog/category/[slug]`
- order (number) -- порядок отображения

Управляются маркетологами из CMS. Начальный набор: кейсы, новости, правила-девелопера, маркетинг-и-продажи, стратегии-развития, аналитика-рынка, работа-команды, инсайты.

### BlogPosts (статьи)
- title (text)
- slug (text, unique) -- `/blog/[slug]`
- category (relation -> Categories)
- excerpt (text) -- анонс для списка
- cover (media)
- content (blocks -- rich text + формы + CTA + картинки)
- author (text или relation)
- publishedAt (date)
- meta: SEO
- status: draft / published

### Videos (видео)
- title (text)
- slug (text, unique) -- `/video/[slug]`
- type (select): вебинар, конференция, подкаст
- videoUrl (text) -- ссылка на видео
- description (text)
- cover (media)
- publishedAt (date)
- meta: SEO
- status: draft / published

### Research (исследования)
- title (text)
- slug (text, unique) -- `/research/[slug]`
- description (text)
- content (blocks)
- file (media) -- PDF для скачивания
- meta: SEO
- status: draft / published

### Cases (кейсы)
- title (text)
- slug (text, unique) -- `/cases/[slug]`
- client (text)
- description (text)
- content (blocks)
- testimonial (text) -- отзыв
- meta: SEO
- status: draft / published

---

## Блоки (переиспользуемые компоненты для контента)

Маркетолог собирает тело страницы из этих блоков в любом порядке:

| Блок | Поля | Описание |
|------|------|----------|
| RichText | content (Lexical) | Текстовый блок с форматированием |
| Image | image (media), caption (text), alt (text) | Картинка с подписью |
| Form | preset (select: lead / subscribe / demo / research) | Встроенная форма |
| CTA | heading (text), description (text), buttonText (text), buttonAction (select: link / sidebarForm), link (text), formPreset (select) | Баннер с кнопкой (может открывать форму в сайдбаре) |
| Video | url (text), caption (text) | Встроенное видео |
| Quote | text (text), author (text), company (text), photo (media) | Цитата / отзыв |

---

## Пресеты форм

| Пресет | Поля | Назначение |
|--------|------|------------|
| lead | имя, email, компания | Общая лид-форма |
| subscribe | email | Подписка на рассылку |
| demo | имя, email, телефон, компания | Заявка на демо |
| research | имя, email, компания | Заказ исследования |

Все сабмиты -> Payload (хранение) -> webhook -> n8n/Albato (маркетинг разбирает дальше).

---

## Компоненты фронта (Astro + Tailwind)

### Layout-компоненты
- `BaseLayout` -- HTML-обертка, head, мета-теги
- `Header` -- навигация (из Payload Global)
- `Footer` -- футер (из Payload Global)

### Блок-компоненты (рендерят блоки из CMS)
- `BlockRenderer` -- маппинг типа блока -> компонент
- `RichTextBlock`
- `ImageBlock`
- `FormBlock`
- `CTABlock`
- `VideoBlock`
- `QuoteBlock`

### UI-компоненты
- `Button`
- `Card` -- карточка для списков (продукты, статьи, кейсы)
- `FormField` -- поле формы
- `SidebarForm` -- сайдбар с формой, вызывается по кнопке
- `CategoryFilter` -- фильтр по категориям (блог)
- `Pagination` -- пагинация для списков

### Страничные компоненты
- `HeroSection` -- герой-баннер для главной и продуктов
- `ProductCard` -- карточка продукта
- `BlogCard` -- карточка статьи
- `CaseCard` -- карточка кейса

---

## Роутинг и URL-структура

```
/                              -- Главная
/about                         -- О нас
/contacts                      -- Контакты
/thanks                        -- Спасибо
/products                      -- Список продуктов
/products/ipoteka              -- Продукт
/products/registratsiya        -- Продукт
/products/scoring              -- ...
/solutions                     -- Список решений
/solutions/dlya-bankov         -- Решение
/solutions/dlya-developerov    -- ...
/for-whom                      -- Для кого
/for-whom/otdel-prodazh        -- Роль
/blog                          -- Все статьи
/blog/my-article-slug          -- Статья
/blog/category/kejsy           -- Фильтр по категории
/video                         -- Все видео
/video/my-webinar              -- Видео
/research                      -- Исследования
/research/my-research          -- Исследование
/cases                         -- Кейсы
/cases/my-case                 -- Кейс
```

---

## Порядок сборки MVP

### Фаза 0: Инфраструктура
1. Инициализировать монорепу (pnpm workspaces)
2. Настроить Astro-проект с Tailwind
3. Настроить Payload CMS с PostgreSQL
4. Docker Compose для локального запуска (Payload + Postgres)
5. Базовые конфиги: TypeScript, ESLint, Prettier
6. Проверить: `docker compose up` поднимает CMS, `pnpm dev` поднимает Astro

### Фаза 1: Каркас
1. Payload: создать коллекции Pages, Products, BlogPosts (без блоков, минимальные поля)
2. Payload: создать globals Navigation, Footer
3. Astro: BaseLayout + Header + Footer (данные из Payload API)
4. Astro: главная страница (пустая, с layout)
5. Astro: роутинг для products/[slug] и blog/[slug]
6. Astro: API-клиент (lib/payload.ts)
7. Проверить: создать запись в CMS -> увидеть на сайте после сборки

### Фаза 2: Блоки и формы
1. Payload: определить все блоки (RichText, Image, Form, CTA, Video, Quote)
2. Payload: добавить Dynamic Zone (blocks field) в коллекции
3. Astro: BlockRenderer + все блок-компоненты
4. Astro: FormBlock + SidebarForm (фронт)
5. Payload: FormSubmissions коллекция + API endpoint для приема форм
6. Проверить: собрать страницу из блоков в CMS -> все рендерится, форма отправляется

### Фаза 3: Все коллекции
1. Payload: добавить остальные коллекции (Solutions, ForWhom, Videos, Research, Cases, Categories)
2. Astro: шаблоны и роуты для всех типов страниц
3. Astro: списковые страницы (blog/index, products/index, cases/index и т.д.)
4. Astro: CategoryFilter для блога
5. Astro: страницы-заглушки: about, contacts, thanks, 404
6. Проверить: все роуты работают, навигация между страницами

### Фаза 4: Публикация и полировка
1. Настроить draft/published фильтрацию (Astro забирает только published)
2. Настроить Live Preview в Payload
3. Скрипт сборки: webhook от Payload -> astro build -> обновление статики
4. Страница /dev/components -- каталог всех компонентов
5. Базовая SEO: sitemap, meta-теги, og:image
6. Проверить: полный цикл -- создать контент -> превью -> опубликовать -> увидеть на статике

### Фаза 5: Наполнение и демо
1. Создать по одной записи каждого типа в CMS (минимальный контент для демо)
2. Проверить все формы
3. Проверить навигацию и перелинковку
4. Подготовить демо для CEO

---

## Верификация

- [ ] `docker compose up` поднимает Payload + Postgres
- [ ] Payload админка доступна на localhost:3000 (или другой порт)
- [ ] Astro dev-сервер запускается, отображает страницы
- [ ] Создание записи в CMS отражается на сайте после сборки
- [ ] Блоки рендерятся корректно в любой комбинации
- [ ] Формы отправляются и сохраняются в Payload
- [ ] Навигация работает, все роуты доступны
- [ ] Draft-контент не попадает на прод-сборку
- [ ] Live Preview показывает черновики в CMS
