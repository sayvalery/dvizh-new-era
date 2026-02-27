# Мега-меню навигации + BlogCard

Дата: 2026-02-27

## Задача

Заменить два отдельных dropdown (Продукты, Решения) на единое мега-меню «Продукты», открывающееся по hover. Справа — 2 последние статьи блога. Добавить красную точку-индикатор на ссылку «Блог». Создать переиспользуемый компонент BlogCard.

## Структура мега-меню

Одна кнопка «Продукты» → hover → полноширинная панель:

```
Левая часть (3 колонки)                    | Правая часть
─────────────────────────────────────────────────────────
Продукты        Решения           Для кого   | BlogCard 1
 Ипотека         Для банков        Деп.продаж | BlogCard 2
 Регистрация     Для девелоперов   Отд.ипот.  |
 Скоринг         Для агентств      Отд.оформ. |
 Калькулятор                       Маркетинг  |
 Личный кабинет                               |
 Витрина                                      |
 Бизнес-ревью                                 |
```

## Hover-логика

Alpine.js `@mouseenter`/`@mouseleave` с таймаутом ~150ms. Не CSS group-hover (ненадёжно для full-width панели с gap).

## Компоненты

### BlogCard.astro (новый)
- Props: title, slug, cover (url + alt), category, excerpt
- Обложка (aspect-video) + заголовок + категория + excerpt
- Один дефолтный вариант, без вариаций
- Добавить в UI Kit
- Использовать в: мега-меню, blog/index, blog/page/[page], category/[category]

### NavBar.astro (изменить)
- Новый тип NavItem: `sections` — массив групп ссылок (для мега-меню)
- Новый prop: `blogPosts` — массив блог-постов для правой части мега-меню
- Мега-меню рендерится только если item имеет `sections`
- Обычные items (плоские ссылки, простые dropdown) — без изменений
- BlogLayout не затрагивается (передаёт плоские items)

### Header.astro (изменить)
- Объединить Продукты + Решения + «Для кого» в один NavItem с `sections`
- Убрать «Решения» из верхнего уровня
- Fetch 2 последних блог-поста при сборке: `getBlogPosts({ limit: 2 })`
- Передать blogPosts в NavBar

### Красная точка на «Блог»
- CSS `::after` pseudo-element или inline span с `bg-red-500 rounded-full w-1.5 h-1.5`

## Интерфейсы

```ts
interface NavSection {
  title: string
  items: NavChild[]
}

// Расширенный NavItem
interface NavItem {
  label: string
  href?: string
  children?: NavChild[]      // простой dropdown (как сейчас)
  sections?: NavSection[]    // мега-меню (новое)
  badge?: 'dot'              // красная точка
}
```

## «Для кого» — временные ссылки

- Департамент продаж → /developers
- Отдел ипотеки → /ipoteka
- Отдел оформления → /elektronnaya-registraciya
- Команда маркетинга и аналитики → /qbr

## Mobile

Текущее мобильное меню адаптируется:
1. Три группы ссылок (Продукты, Решения, Для кого) — как секции с заголовками
2. Затем 2 карточки BlogCard внизу
3. Навигация идёт первой, блог — после (не как в примере где картинки сверху)

## Затрагиваемые файлы

| Файл | Действие |
|------|----------|
| `components/ui/BlogCard.astro` | Создать |
| `components/ui/NavBar.astro` | Изменить (мега-меню + hover + blogPosts prop) |
| `components/layout/Header.astro` | Изменить (новая структура + fetch постов) |
| `pages/blog/index.astro` | Изменить (заменить инлайн на BlogCard) |
| `pages/blog/page/[page].astro` | Изменить (заменить инлайн на BlogCard) |
| `pages/category/[category].astro` | Изменить (заменить инлайн на BlogCard) |
| `pages/ui-kit/[...slug].astro` | Изменить (добавить BlogCard в каталог) |
| `layouts/BlogLayout.astro` | НЕ трогать |
