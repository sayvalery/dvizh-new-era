# Nova Ipoteka Lab Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать лабораторную страницу `/lab/nova-ipoteka` из 6 компонентов и добавить `FeatureBlock` в UI Kit.

**Architecture:** Страница собирается из существующих компонентов `ui/` по образцу `nova-glavnaya.astro`. UI Kit получает новую секцию `feature-block` по уже устоявшемуся паттерну (import + raw import + parseSource + getStaticPaths + sections + section template).

**Tech Stack:** Astro 5, Tailwind CSS 3.4, Alpine.js 3, TypeScript

---

## Files

| Действие | Файл |
|----------|------|
| Create | `apps/web/src/pages/lab/nova-ipoteka.astro` |
| Modify | `apps/web/src/pages/ui-kit/[...slug].astro` |

---

## Task 1: Создать страницу `/lab/nova-ipoteka`

**Files:**
- Create: `apps/web/src/pages/lab/nova-ipoteka.astro`

- [ ] **Создать файл страницы со всеми 6 блоками**

```astro
---
/**
 * Лабораторная страница: Новая Ипотека
 *
 * Сборка блоков для новой версии страницы ипотеки.
 * Контент — заглушки, финальный текст будет добавлен отдельно.
 *
 * Маршрут: /lab/nova-ipoteka (только в dev)
 */

import SiteLayout from '../../layouts/SiteLayout.astro'
import HeroSection from '../../components/ui/HeroSection.astro'
import AdvantageCard from '../../components/ui/AdvantageCard.astro'
import FeatureBlock from '../../components/ui/FeatureBlock.astro'
import BentoGrid from '../../components/ui/BentoGrid.astro'
import SuccessStoryBlock from '../../components/ui/SuccessStoryBlock.astro'
import FormClosing from '../../components/ui/FormClosing.astro'
---

<SiteLayout
  title="Новая Ипотека — ДВИЖ (лаборатория)"
  description="Новая версия страницы ипотеки ДВИЖ — в разработке"
>

  {/* ── 1. Hero Section ── */}
  <HeroSection
    layout="split"
    title="Закрывайте до 26% больше сделок на том же трафике"
    description="Ипотечная платформа для современных девелоперов. Повышаем конверсии на каждом этапе работы с заявками: от консультации до одобрения в банке"
    demoLabel="Получить демо"
    kpLabel="Получить КП"
  />

  {/* ── 2. AdvantageCard — 4 карточки ── */}
  <section class="bg-white py-24 sm:py-32">
    <div class="page-container">
      <h2 class="text-h2">Девелоперы с ДВИЖ Ипотекой</h2>
      <div class="mt-6 md:mt-8 lg:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdvantageCard
          title="Сократили количество отказов по ипотеке"
          stat="+26%"
          label="Сделок на том же трафике"
          expandHref="/blog/case-ayaks-dvizh"
        />
        <AdvantageCard
          title="Перестали терять сделки из-за клиентов с низким кредитным рейтингом"
          stat="90%"
          label="Одобрений при объёме выше рынка"
          expandHref="/blog/granel-rost-procenta-odobreniya"
        />
        <AdvantageCard
          title="Ускорили заполнение анкеты до 10 секунд, а получение одобрения — до 5 минут"
          stat="+281%"
          label="Заявок на одного менеджера"
          expandHref="/blog/kak-poluchat-bolshe-kachestvennyh-lidov-po-menshey-stoimosti"
        />
        <AdvantageCard
          title="Перестали терять сделки из-за клиентов с низким кредитным рейтингом"
          stat="-30%"
          label="Затрат на регистрацию"
          expandHref="/blog/alfavit-polzy-zastroyshchika-elektronnaya-registraciya"
        />
      </div>
    </div>
  </section>

  {/* ── 3. FeatureBlock ── */}
  <FeatureBlock
    heading="Повышаем конверсию первичной консультации в 2 раза"
    button={{ label: 'Узнать больше', href: '/ipoteka' }}
    features={[
      { title: 'Расчёт досрочных погашений и рефинансирования' },
      { title: '40+ банков-партнёров и большой выбор ипотечных программ' },
    ]}
  />

  {/* ── 4. BentoGrid variant three ── */}
  <section class="py-24 lg:py-[120px]">
    <div class="page-container">
      <BentoGrid
        heading="Дополнительные возможности"
        items={[
          {
            title: 'Готовые интеграции с популярными системами',
          },
          {
            title: 'Среднее время ответа в чате поддержки',
          },
          {
            title: 'Все ключевые показатели в одном готовом дашборде',
          },
        ]}
      />
    </div>
  </section>

  {/* ── 5. SuccessStoryBlock ── */}
  <SuccessStoryBlock
    heading="70+ историй успеха на рынке девелопмента"
    buttonLabel="Получить демо"
    buttonPreset="demo"
    stories={[
      {
        logo: '/partners/lsr.svg',
        logoAlt: 'ЛСР',
        titleHtml: 'Помогли начать обрабатывать на <span class="text-brand">281% заявок больше</span>, чем в среднем на рынке',
        personName: 'Петрова Надежда',
        personJobTitle: 'Директор по маркетингу, ЛСР',
      },
      {
        logo: '/partners/strana.svg',
        logoAlt: 'Страна Девелопмент',
        titleHtml: 'Увеличили объём закрытых сделок <span class="text-brand">с 1165 до 3500</span> за год',
        personName: 'Светлана Корнелюк',
        personJobTitle: 'Директор отдела продаж',
      },
      {
        logo: '/partners/glorax.svg',
        logoAlt: 'Glorax',
        titleHtml: 'Снизили процент отказов по ипотеке <span class="text-brand">до 10%</span> за три месяца',
        personName: 'Анна Смирнова',
        personJobTitle: 'Ипотечный брокер, Самолёт',
      },
    ]}
  />

  {/* ── 6. FormClosing ── */}
  <div class="page-container py-12">
    <FormClosing
      preset="lead"
      title="Подберем решение под ваши задачи"
      items={[
        'Найдём потерянные заявки и проанализируем путь клиента',
        'Проверим, не отстаёте ли вы от рынка, и сравним ваши показатели с бенчмарками',
        'Составим рекомендации на основе опыта работы с застройщиками из топ-50',
      ]}
      submitLabel="Оставить заявку"
    />
  </div>

</SiteLayout>
```

- [ ] **Проверить в браузере** — открыть `http://localhost:4321/lab/nova-ipoteka`, убедиться что все 6 блоков отрисовываются без ошибок в консоли

- [ ] **Коммит**

```bash
git add apps/web/src/pages/lab/nova-ipoteka.astro
git commit -m "feat(lab): страница nova-ipoteka — 6 блоков"
```

---

## Task 2: Добавить FeatureBlock в UI Kit

**Files:**
- Modify: `apps/web/src/pages/ui-kit/[...slug].astro`

В этом файле нужно сделать 5 изменений по установившемуся паттерну.

- [ ] **Шаг 1: Добавить импорт компонента** — после строки `import TextImageBlock from '../../components/ui/TextImageBlock.astro'`:

```astro
import FeatureBlock from '../../components/ui/FeatureBlock.astro'
```

- [ ] **Шаг 2: Добавить raw-импорт** — после строки `import textImageBlockRaw from '../../components/ui/TextImageBlock.astro?raw'`:

```astro
import featureBlockRaw from '../../components/ui/FeatureBlock.astro?raw'
```

- [ ] **Шаг 3: Добавить parseSource** — после строки `const textImageBlockMeta = parseSource(textImageBlockRaw)`:

```astro
const featureBlockMeta = parseSource(featureBlockRaw)
```

- [ ] **Шаг 4: Добавить маршрут** — в массив `getStaticPaths`, после записи `text-image-block`:

```ts
{ params: { slug: 'feature-block' }, props: { section: 'feature-block' } },
```

- [ ] **Шаг 5: Добавить в sidebar** — в массив `sections`, после `{ slug: 'text-image-block', label: 'TextImageBlock' }`:

```ts
{ slug: 'feature-block', label: 'FeatureBlock' },
```

- [ ] **Шаг 6: Добавить секцию-демо** — в конце шаблона, перед последним `</div>` и `</BaseLayout>`, после блока `section === 'text-image-block'`:

```astro
{section === 'feature-block' && (
  <div>
    <h1 class="text-3xl font-bold font-heading mb-2">FeatureBlock</h1>
    <p class="text-gray-600 mb-8">
      Секция с авто-переключающимися пунктами (таймер + прогресс-бар) и изображением справа или слева.
      Desktop: два столбца — текст + изображение. Mobile: изображение появляется inline под активным пунктом.
    </p>
    <PropsTable props={featureBlockMeta.props} class="mb-10" />

    <h2 class="text-xl font-semibold mb-4">Без изображения</h2>
    <div class="-mx-4 sm:-mx-6 lg:-mx-10 mb-10">
      <FeatureBlock
        heading="Повышаем конверсию первичной консультации в 2 раза"
        button={{ label: 'Узнать больше', href: '/ipoteka' }}
        features={[
          { title: 'Расчёт досрочных погашений и рефинансирования', subtitle: 'Досрочка, рефинансирование, субсидированные программы' },
          { title: '40+ банков-партнёров и большой выбор ипотечных программ', subtitle: '15 банков отвечают по API в течение минуты' },
          { title: 'Заполнение анкеты через Госуслуги', subtitle: 'Клиент заполняет анкету за 10 секунд' },
        ]}
      />
    </div>
  </div>
)}
```

- [ ] **Проверить в браузере** — открыть `http://localhost:4321/ui-kit/feature-block`, убедиться что секция отображается и PropsTable заполнена

- [ ] **Коммит**

```bash
git add apps/web/src/pages/ui-kit/[...slug].astro
git commit -m "feat(ui-kit): добавить FeatureBlock в каталог компонентов"
```
