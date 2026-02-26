# Ночной план улучшений — 26 февраля 2026

## Блок 1: Критические исправления

### 1.1 Убрать CMS-driven футер и навигацию
- Footer.astro: захардкодить данные с dvizh.io (ООО "Цифровые продажи", 2018-2026, ИНН 7716899078 и т.д.)
- Убрать getFooter()/getNavigation() из payload.ts
- SiteLayout: не вызывать getFooter()
- BlogLayout: привести футер к единому виду с SiteLayout

### 1.2 Картинки на проде
- bodyHtml replaceAll с CMS_URL — при статической сборке CMS_URL может быть localhost
- Решение: использовать SITE_URL или убрать зависимость от CMS_URL для media-путей

### 1.3 Убрать внешние плейсхолдеры
- index.astro: 4x tailwindcss.com → убрать image prop, оставить только текст
- ipoteka.astro: 1x tailwindcss.com + 4x placehold.co + 4x pravatar.cc → серые блоки
- ui-kit: все placehold.co/pravatar.cc → серые блоки или убрать

### 1.4 Порядок авторов
- blog/[slug].astro: primaryAuthor уже сверху (в шапке inline, внизу full первый) — проверить

## Блок 2: Блог

### 2.1 Счётчики статей у категорий
- blog/index.astro: рядом с каждой категорией показать количество статей серым
- category/[category].astro: показать количество в заголовке

### 2.2 Пагинация (статическая)
- Вместо blog/index.astro с limit:20 — генерировать blog/1.astro, blog/2.astro...
- Или: /blog/ показывает первые 12, кнопка "Загрузить ещё" ведёт на /blog/2 etc.
- Подход: статические страницы /blog/page/[page].astro

### 2.3 Ссылка на глоссарий
- BlogLayout.astro NavBar: добавить items с ссылкой на /slovar-developera

### 2.4 Бренд-цвет
- Основной: #ff4d00 (оранжевый с dvizh.io)
- tailwind.config.ts: добавить colors.brand
- Заменить индиго/синий на brand в компонентах

## Блок 3: Продуктовые страницы (кроме ipoteka и index)

### 3.1 Наполнить данными с dvizh.io
- elektronnaya-registraciya
- ipotechnyy-kalkulyator
- qbr
- lichnyy-kabinet
- vitrina
- scoring
- banki
- developers
- agentstva-nedvizhimosti
- about
- contacts

## Блок 4: Качество

### 4.1 Аудит мусора
- Неиспользуемые функции в payload.ts
- Неиспользуемые компоненты
- Мёртвый код

### 4.2 Тесты
- Базовые smoke-тесты для сборки

### 4.3 Рекомендации
- Документ с предложениями по улучшению
