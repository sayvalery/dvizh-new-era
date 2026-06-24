# Открытая редакция — страница автора Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать страницу `/otkrytaya-redakciya` из существующих компонентов с добавлением нового варианта `symmetric` в `ComparisonSection`.

**Architecture:** Два изменения — расширение `ComparisonSection` новым вариантом (обе карточки одного цвета, слот для иконки), затем создание страницы из `HeroSectionFull` + `ComparisonSection` + `BentoGrid` + `Banner` + `BlogCards`.

**Tech Stack:** Astro 5, Tailwind CSS 3.4, Alpine.js 3 (только в ComparisonSection tooltip)

---

## Chunk 1: ComparisonSection — вариант `symmetric`

**Files:**
- Modify: `apps/web/src/components/ui/ComparisonSection.astro`

### Task 1: Добавить вариант `symmetric` в ComparisonSection

Вариант `symmetric`: обе карточки `bg-gray-200`, чекмарк-иконки в `text-gray-500` для обеих колонок, заголовок правой карточки через проп `rightTitle`, слот `right-icon` для иконки в шапке правой карточки. CTA-кнопок нет.

- [ ] Добавить `variant?: 'default' | 'prices' | 'symmetric'` в Props интерфейс
- [ ] Добавить `rightTitle?: string` в Props (заголовок правой карточки в symmetric)
- [ ] Добавить `isSymmetric` константу рядом с `isPrices`
- [ ] Рендерить мобильный блок для `isSymmetric` (обе карточки `bg-gray-200`, check иконки `text-gray-500`)
- [ ] Рендерить десктопный блок для `isSymmetric` (оба абсолютных фона `bg-gray-200`, слот `right-icon` в шапке правой)
- [ ] Убедиться что `!isPrices` → `!isPrices && !isSymmetric` для existing default variant blocks

---

## Chunk 2: Страница `/otkrytaya-redakciya`

**Files:**
- Create: `apps/web/src/pages/otkrytaya-redakciya.astro`

### Task 2: Создать страницу

Структура сверху вниз:
1. `HeroSectionFull` — PixelArrowPattern + LogoGrid в слотах
2. `ComparisonSection variant="symmetric"` — «Нас читают» / «Вы можете рассказать»  
3. `BentoGrid variant="four"` — 4 карточки «Что вы получите»
4. `Banner` — CTA «Станьте автором ДВИЖ Инсайты»
5. `BlogCards` — «От наших экспертов» (6 статичных статей из Webflow)

**Тексты (из оригинала):**

Hero:
- title: "Станьте автором ДВИЖ Инсайты"
- description: "Поделитесь своим опытом с топами рынка недвижимости"
- demoLabel: "Стать автором", kpLabel: "Узнать подробнее"
- demoPreset/kpPreset: "lead"

Comparison:
- title: "ДВИЖ Инсайты — медиа для современных застройщиков"
- leftTitle: "Нас читают"
- leftItems: ["Руководители ипотечных отделов", "Руководители агентств недвижимости", "Ипотечные брокеры в банках", "Топы на рынке недвижимости", "Коммерческие директора крупных девелоперов"]
- rightTitle: "Вы можете рассказать"
- rightItems: ["О работе вашей команды", "О способах выстраивать воронку продаж", "Об уникальных подходах и методиках", "О способах привлекать клиентов", "О подходах, используемых в работе"]

BentoGrid:
- heading: "Что вы получите"
- items: email-рассылка, статистика рынка, вебинары, дистрибуция

Banner:
- title: "Станьте автором\nДВИЖ Инсайты"
- subtitle: "Поделитесь своим опытом с топами рынка недвижимости"
- buttons: [{ label: "Стать автором", drawerPreset: "lead" }]

BlogCards:
- title: "От наших экспертов"
- 6 статей из Webflow (статичные данные, без изображений)

- [ ] Создать файл с импортами всех компонентов
- [ ] Добавить SiteLayout с title/description/bodyClass
- [ ] Добавить HeroSectionFull с PixelArrowPattern и LogoGrid
- [ ] Добавить ComparisonSection symmetric
- [ ] Добавить BentoGrid four
- [ ] Добавить Banner
- [ ] Добавить BlogCards
- [ ] **НЕ коммитить, НЕ пушить**
