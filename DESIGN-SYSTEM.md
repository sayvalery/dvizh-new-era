# Дизайн-система ДВИЖ

Figma-файл: https://www.figma.com/design/PnfTfcrl6KaCZU0mEMQiws/

---

## ✅ Сделано

### Переменные (Figma Variables)

| Коллекция | Описание | Переменных |
|---|---|---|
| **Primitives** | Сырые цвета: brand/50–900, gray/100–900, white, black | 21 |
| **Color** | Семантические цвета: background, brand, text, border | 11 |
| **Spacing** | Отступы: 4–128px (шаг из Tailwind) | 13 |
| **Border Radius** | Радиусы: sm(8) md(12) lg(16) xl(18) 2xl(24) 3xl(32) full | 7 |
| **Font Size** | Размеры шрифтов с 4 модами: xs / sm / md / lg | 12 × 4 моды |

### Текстовые стили (Figma Text Styles)

27 стилей с брейкпойнтами через `/`:

| Стиль | Шрифт | xs | sm | md | lg |
|---|---|---|---|---|---|
| h1 / h1-italic | Commissioner Bold | 28 | 42 | 42 | 64 |
| h2 | Commissioner Medium | 24 | 24 | 32 | 48 |
| h3 | Commissioner Medium | 18 | 24 | 24 | 32 |
| h4 | Commissioner Medium | 24 | — | — | 24 |
| h5 | Commissioner Bold | 18 | — | — | 18 |
| h6 | Commissioner Bold | 14 | — | — | 16 |
| body-lg / body-lg-italic | Inter Regular | 16 | 18 | — | — |
| subhead | Inter Regular | 14 | — | — | 16 |
| footnote | Inter Regular | 14 | — | — | — |
| side-menu | Inter Semi Bold | 12 | — | — | — |
| medium-32 | Inter Medium | 18 | 24 | — | 32 |

> ⚠️ Commissioner — временная замена Styrene A. Заменить вручную после установки шрифта.
> Установить: `apps/web/public/fonts/StyreneAWeb-*.ttf` → Font Book → Install

---

## 🗂 Брейкпойнты проекта

| Название | Ширина |
|---|---|
| xs | 480px |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |

---

## 📋 План

### Phase 2 — Структура файла и документация ✅
- [x] Создать страницы: Cover, Getting Started, Foundations, Components
- [x] Страница Colors — цветовые свотчи (brand, gray, base)
- [x] Страница Typography — типографическая шкала с примерами по брейкпойнтам
- [x] Страница Spacing & Radius — визуализация отступов и радиусов

### Phase 3 — Компоненты (атомы → молекулы) ✅

| Компонент | Варианты | Статус |
|---|---|---|
| **Button** | Primary/Secondary/Ghost/Dark × SM/MD/LG × Default/Hover/Disabled (36 вариантов) | ✅ |
| **PersonCard** | Full/Inline × Light/Dark + HasPhoto boolean prop | ✅ |
| **Island** | Default/Hover + редактируемые пропсы Label/ButtonText | ✅ |
| **SideMenu** | MenuItem (Active/Default) + полный пример меню | ✅ |
| **AdvantageCard** | Default/Hover с текстовыми стилями и цветами | ✅ |
| **StoryCard** | Light/Dark + инстанс PersonCard + инстанс Logo | ✅ |
| **Logo** | Brand=ЛСР / Самолёт / Точно (плейсхолдеры для замены) | ✅ |
| **ModalInlineForm** | Step=1/2 × Breakpoint=xs-sm/md/lg (6 вариантов) | ✅ |

> ⚠️ Все компоненты используют текстовые стили и переменные цветов/отступов.
> INSTANCE_SWAP для Logo заработает после публикации библиотеки.

### Phase 4 — QA
- [ ] Проверить биндинги переменных во всех компонентах
- [ ] Консистентность именования (нет дублей, нет unnamed nodes)
- [ ] Финальные скриншоты каждой страницы

---

## 🔧 Инструменты

- Claude Code + `figma-generate-library` + `figma-use` скиллы
- Figma MCP (desktop, порт 3845)
- Скрипт токенов: `scripts/push-tokens-to-figma.mjs`
- Токены JSON: `design-tokens.json`

---

## ⚠️ Согласованные исключения

- **FlutedGlassBg (vanilla WebGL)** — самописный шейдерный фон без внешних библиотек. Разрешённое исключение из правила «только Alpine.js ~15KB на клиенте». Внешние анимационные/шейдерные библиотеки (Three.js, GSAP, Lottie, Framer Motion и т.п.) по-прежнему запрещены.
