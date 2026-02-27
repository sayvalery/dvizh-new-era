# Mega-Menu + BlogCard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace two separate nav dropdowns with a single "Продукты" mega-menu on hover, create a reusable BlogCard component, add a red dot badge on "Блог".

**Architecture:** Extend NavBar.astro with a new `sections` NavItem type that renders a full-width mega-menu panel on hover (Alpine.js). Create BlogCard.astro as a shared component used in the mega-menu and all blog listing pages. Header.astro fetches 2 latest posts at build time.

**Tech Stack:** Astro 5, Tailwind CSS, Alpine.js (already in project)

---

### Task 1: Create BlogCard.astro component

**Files:**
- Create: `apps/web/src/components/ui/BlogCard.astro`

**Step 1: Create the BlogCard component**

Create `apps/web/src/components/ui/BlogCard.astro` with this content:

```astro
---
/**
 * BlogCard — карточка блог-поста
 *
 * Переиспользуемый компонент для отображения блог-поста в виде карточки.
 * Используется в: мега-меню навигации, blog/index, blog/page/[page], category/[category].
 *
 * @example
 * <BlogCard
 *   title="Как автоматизировать ипотеку"
 *   slug="kak-avtomatizirovat-ipoteku"
 *   cover={{ url: "/api/media/file/cover.jpg", alt: "Обложка" }}
 *   category="Ипотека"
 *   excerpt="Краткое описание статьи..."
 * />
 */

import { normalizeMediaUrl } from '../../lib/payload'

interface Props {
  /** Заголовок поста */
  title: string
  /** Slug для ссылки /blog/{slug} */
  slug: string
  /** Обложка */
  cover?: { url?: string; alt?: string }
  /** Название категории */
  category?: string
  /** Краткое описание */
  excerpt?: string
  /** Дополнительные CSS классы */
  class?: string
}

const { title, slug, cover, category, excerpt, class: className = '' } = Astro.props
const coverUrl = normalizeMediaUrl(cover?.url ?? null)
---

<a href={`/blog/${slug}`} class:list={['group border rounded-xl overflow-hidden hover:shadow-md transition-shadow', className]}>
  {coverUrl ? (
    <img
      src={coverUrl}
      alt={cover?.alt ?? title}
      class="w-full aspect-video object-cover"
      loading="lazy"
      decoding="async"
      width="400"
      height="225"
    />
  ) : (
    <div class="w-full aspect-video bg-gray-100" />
  )}
  <div class="p-5">
    {category && (
      <span class="text-xs text-gray-500 uppercase tracking-wide">{category}</span>
    )}
    <h2 class="font-semibold mt-1 group-hover:underline">{title}</h2>
    {excerpt && <p class="text-sm text-gray-600 mt-2 line-clamp-2">{excerpt}</p>}
  </div>
</a>
```

**Step 2: Verify the component was created**

Run: `ls -la apps/web/src/components/ui/BlogCard.astro`
Expected: file exists

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/BlogCard.astro
git commit -m "feat: add BlogCard reusable component"
```

---

### Task 2: Replace inline blog cards with BlogCard component

**Files:**
- Modify: `apps/web/src/pages/blog/index.astro:54-74`
- Modify: `apps/web/src/pages/blog/page/[page].astro:66-86`
- Modify: `apps/web/src/pages/category/[category].astro:36-53`

**Step 1: Update blog/index.astro**

Add import at top (after existing imports, line 3):
```astro
import BlogCard from '../../components/ui/BlogCard.astro'
```

Remove `normalizeMediaUrl` from the existing import (it's no longer needed directly in this file):
```astro
import { getBlogPosts, getCategories } from '../../lib/payload'
```

Replace lines 54-74 (the grid with inline cards) with:
```astro
      <div class="grid md:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <BlogCard
            title={post.title}
            slug={post.slug}
            cover={post.cover}
            category={post.category?.title}
            excerpt={post.excerpt}
          />
        ))}
      </div>
```

**Step 2: Update blog/page/[page].astro**

Add import at top (after existing imports, line 3):
```astro
import BlogCard from '../../../components/ui/BlogCard.astro'
```

Remove `normalizeMediaUrl` from the existing import:
```astro
import { getBlogPosts, getCategories } from '../../../lib/payload'
```

Replace lines 66-86 (the grid with inline cards) with:
```astro
      <div class="grid md:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <BlogCard
            title={post.title}
            slug={post.slug}
            cover={post.cover}
            category={post.category?.title}
            excerpt={post.excerpt}
          />
        ))}
      </div>
```

**Step 3: Update category/[category].astro**

Add import at top (after existing imports, line 3):
```astro
import BlogCard from '../../components/ui/BlogCard.astro'
```

Remove `normalizeMediaUrl` from the existing import:
```astro
import { getCategories, getBlogPosts } from '../../lib/payload'
```

Replace lines 36-53 (the grid with inline cards) with:
```astro
      <div class="grid md:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <BlogCard
            title={post.title}
            slug={post.slug}
            cover={post.cover}
            category={post.category?.title}
            excerpt={post.excerpt}
          />
        ))}
      </div>
```

**Step 4: Build to verify nothing is broken**

Run: `cd /Users/server/dev/dvizh-new-era && pnpm build`
Expected: Build succeeds with ~514 pages

**Step 5: Commit**

```bash
git add apps/web/src/pages/blog/index.astro apps/web/src/pages/blog/page/\[page\].astro apps/web/src/pages/category/\[category\].astro
git commit -m "refactor: replace inline blog cards with BlogCard component"
```

---

### Task 3: Update NavBar interfaces and Header data structure

**Files:**
- Modify: `apps/web/src/components/ui/NavBar.astro:25-44` (interfaces)
- Modify: `apps/web/src/components/layout/Header.astro` (full rewrite of navItems + blog fetch)

**Step 1: Update NavBar.astro interfaces**

Replace the interface block (lines 25-42) with:

```ts
export interface NavChild {
  label: string
  href: string
  description?: string
}

export interface NavSection {
  title: string
  items: NavChild[]
}

export interface NavItem {
  label: string
  href?: string
  children?: NavChild[]
  sections?: NavSection[]
  badge?: 'dot'
}

interface BlogPost {
  title: string
  slug: string
  cover?: { url?: string; alt?: string }
  category?: string
}

interface Props {
  logo: { label: string; href: string }
  items?: NavItem[]
  blogPosts?: BlogPost[]
  secondaryLink?: { label: string; href: string }
  cta?: { label: string; preset?: string }
}

const { logo, items = [], blogPosts = [], secondaryLink, cta } = Astro.props
```

**Step 2: Rewrite Header.astro**

Replace the full content of `apps/web/src/components/layout/Header.astro`:

```astro
---
import NavBar from '../ui/NavBar.astro'
import type { NavItem } from '../ui/NavBar.astro'
import { getBlogPosts, normalizeMediaUrl } from '../../lib/payload'

const isDev = import.meta.env.DEV

const navItems: NavItem[] = [
  {
    label: 'Продукты',
    sections: [
      {
        title: 'Продукты',
        items: [
          { label: 'Ипотека', href: '/ipoteka', description: 'Ипотечный процесс от заявки до выдачи' },
          { label: 'Электронная регистрация', href: '/elektronnaya-registraciya', description: 'Цифровая регистрация сделок' },
          { label: 'Скоринг', href: '/scoring', description: 'Оценка кредитоспособности' },
          { label: 'Ипотечный калькулятор', href: '/ipotechnyy-kalkulyator', description: 'Интеграция в сайт и CRM' },
          { label: 'Личный кабинет', href: '/lichnyy-kabinet', description: 'Кабинет клиента для ведения сделок' },
          { label: 'Витрина', href: '/vitrina', description: 'Витрина объектов недвижимости' },
          { label: 'Бизнес-ревью', href: '/qbr', description: 'Аналитика и бизнес-отчёты' },
        ],
      },
      {
        title: 'Решения',
        items: [
          { label: 'Для банков', href: '/banki', description: 'Ипотечные и розничные банки' },
          { label: 'Для девелоперов', href: '/developers', description: 'Автоматизация продаж и сделок' },
          { label: 'Для агентств недвижимости', href: '/agentstva-nedvizhimosti', description: 'Платформа для риелторов' },
        ],
      },
      {
        title: 'Для кого',
        items: [
          { label: 'Департамент продаж', href: '/developers' },
          { label: 'Отдел ипотеки', href: '/ipoteka' },
          { label: 'Отдел оформления', href: '/elektronnaya-registraciya' },
          { label: 'Команда маркетинга и аналитики', href: '/qbr' },
        ],
      },
    ],
  },
  { label: 'Блог', href: '/blog', badge: 'dot' },
  { label: 'О нас', href: '/about' },
]

// Fetch 2 latest blog posts for mega-menu
let blogPosts: { title: string; slug: string; cover?: { url?: string; alt?: string }; category?: string }[] = []
try {
  const { docs } = await getBlogPosts({ limit: 2 })
  blogPosts = docs.map((post: any) => ({
    title: post.title,
    slug: post.slug,
    cover: post.cover ? { url: normalizeMediaUrl(post.cover.url) ?? undefined, alt: post.cover.alt } : undefined,
    category: post.category?.title,
  }))
} catch {
  // CMS unavailable during build — mega-menu works without blog cards
}
---

<NavBar
  logo={{ label: 'ДВИЖ', href: '/' }}
  items={navItems}
  blogPosts={blogPosts}
  secondaryLink={isDev ? { label: 'UI Kit', href: '/ui-kit' } : undefined}
  cta={{ label: 'Запросить демо', preset: 'demo' }}
/>
```

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/NavBar.astro apps/web/src/components/layout/Header.astro
git commit -m "feat: update nav data structure for mega-menu"
```

---

### Task 4: Implement mega-menu rendering in NavBar (desktop)

**Files:**
- Modify: `apps/web/src/components/ui/NavBar.astro:46-81` (desktop nav rendering)

**Step 1: Add BlogCard import**

At the top of NavBar.astro frontmatter, after the interface definitions and before the `const { logo... }` line, add:

```ts
import BlogCard from './BlogCard.astro'
```

**Step 2: Replace desktop nav rendering**

Replace the desktop nav section (lines 51-81, inside `<div class="hidden md:flex md:gap-x-1">`) with:

```astro
      <div class="hidden md:flex md:gap-x-1">
        {items.map(item => (
          item.sections?.length ? (
            <div
              class="relative"
              x-data="{ megaOpen: false, timeout: null }"
              @mouseenter="clearTimeout(timeout); megaOpen = true"
              @mouseleave="timeout = setTimeout(() => megaOpen = false, 150)"
            >
              <button class="flex items-center gap-1 px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-gray-700">
                {item.label}
                <svg class="w-3.5 h-3.5 text-gray-400 transition-transform" :class="megaOpen && 'rotate-180'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <!-- Mega menu panel -->
              <div
                x-show="megaOpen"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 -translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 -translate-y-1"
                class="fixed left-0 right-0 top-16 z-50 border-b border-gray-200 bg-white shadow-lg"
                style="display: none"
              >
                <div class="mx-auto max-w-7xl px-4 py-8">
                  <div class="grid grid-cols-4 gap-8">
                    {/* Left: 3 columns of links */}
                    {item.sections.map(section => (
                      <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{section.title}</p>
                        <ul class="space-y-2">
                          {section.items.map(child => (
                            <li>
                              <a href={child.href} class="block text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2 py-1.5 -mx-2">
                                {child.label}
                                {child.description && (
                                  <span class="block text-xs text-gray-400 mt-0.5">{child.description}</span>
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {/* Right: blog posts */}
                    {blogPosts.length > 0 && (
                      <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Блог</p>
                        <div class="space-y-4">
                          {blogPosts.map(post => (
                            <BlogCard
                              title={post.title}
                              slug={post.slug}
                              cover={post.cover}
                              category={post.category}
                              class="border-0 shadow-none"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : item.children?.length ? (
            <div class="relative group">
              <button class="flex items-center gap-1 px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-gray-700">
                {item.label}
                <svg class="w-3.5 h-3.5 text-gray-400 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div class="absolute top-full left-0 pt-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 z-50">
                <div class="bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-52">
                  {item.children.map(child => (
                    <a href={child.href} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                      {child.label}
                      {child.description && (
                        <span class="block text-xs text-gray-400 mt-0.5">{child.description}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <a href={item.href} class="relative px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-gray-700">
              {item.label}
              {item.badge === 'dot' && (
                <span class="absolute top-1.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </a>
          )
        ))}
      </div>
```

**Step 3: Build to verify desktop mega-menu renders**

Run: `cd /Users/server/dev/dvizh-new-era && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/components/ui/NavBar.astro
git commit -m "feat: implement desktop mega-menu with hover and blog cards"
```

---

### Task 5: Update mobile menu for new structure

**Files:**
- Modify: `apps/web/src/components/ui/NavBar.astro:121-195` (mobile menu nav items section)

**Step 1: Replace mobile nav items section**

Replace the mobile nav items block (the `<!-- Nav items -->` section, lines 169-195) with:

```astro
      <!-- Nav items -->
      <div class="space-y-1">
        {items.map(item => (
          item.sections?.length ? (
            item.sections.map(section => (
              <div>
                <p class="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {section.title}
                </p>
                {section.items.map(child => (
                  <a
                    href={child.href}
                    @click="mobileOpen = false"
                    class="-mx-3 block rounded-lg px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            ))
          ) : item.children?.length ? (
            <div>
              <p class="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {item.label}
              </p>
              {item.children.map(child => (
                <a
                  href={child.href}
                  @click="mobileOpen = false"
                  class="-mx-3 block rounded-lg px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                >
                  {child.label}
                </a>
              ))}
            </div>
          ) : (
            <a
              href={item.href}
              @click="mobileOpen = false"
              class="relative -mx-3 block rounded-lg px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
            >
              {item.label}
              {item.badge === 'dot' && (
                <span class="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1.5 align-middle" />
              )}
            </a>
          )
        ))}
      </div>

      {/* Blog cards in mobile menu (after nav) */}
      {blogPosts.length > 0 && (
        <div class="mt-6 pt-6 border-t border-gray-100">
          <p class="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Из блога</p>
          <div class="space-y-3">
            {blogPosts.map(post => (
              <BlogCard
                title={post.title}
                slug={post.slug}
                cover={post.cover}
                category={post.category}
              />
            ))}
          </div>
        </div>
      )}
```

**Step 2: Build and verify**

Run: `cd /Users/server/dev/dvizh-new-era && pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/NavBar.astro
git commit -m "feat: update mobile menu with mega-menu sections and blog cards"
```

---

### Task 6: Add BlogCard to UI Kit

**Files:**
- Modify: `apps/web/src/pages/ui-kit/[...slug].astro`

**Step 1: Add imports**

Add to the imports section (after the existing component imports, around line 22):
```ts
import BlogCard from '../../components/ui/BlogCard.astro'
```

Add to the raw imports section (after existing raw imports, around line 36):
```ts
import blogCardRaw from '../../components/ui/BlogCard.astro?raw'
```

**Step 2: Add meta parsing**

Add after the existing parseSource calls (around line 107):
```ts
const blogCardMeta = parseSource(blogCardRaw)
```

**Step 3: Add the component section into the catalog**

Find the appropriate place in the catalog (e.g. after PersonCard section) and add a `blogcard` section to the catalog structure and to the page's rendering. Match the existing pattern: add it to the `catalog` map and render a section with demo examples.

The catalog entry should include the component name 'BlogCard', a demo with sample data, and the PropsTable. Follow the exact pattern of existing sections (e.g. PersonCard section).

**Step 4: Build in dev to verify UI Kit renders**

Run: `cd /Users/server/dev/dvizh-new-era && pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/web/src/pages/ui-kit/\\[...slug\\].astro
git commit -m "feat: add BlogCard to UI Kit catalog"
```

---

### Task 7: Run smoke tests and final verification

**Step 1: Full build**

Run: `cd /Users/server/dev/dvizh-new-era && pnpm build`
Expected: Build succeeds with ~514 pages

**Step 2: Run smoke tests**

Run: `cd /Users/server/dev/dvizh-new-era && bash apps/web/tests/build-smoke.sh`
Expected: All tests pass (no external placeholders, no broken links, all pages present)

**Step 3: Visual check**

Run dev server: `pnpm dev` and verify:
- Hover over "Продукты" → mega-menu appears with 3 columns + 2 blog cards
- Blog cards link to actual posts
- "Блог" has red dot
- Mobile menu shows sections → blog cards at bottom
- Blog pages (/blog, /blog/page/2, /category/*) render correctly with BlogCard
- BlogLayout nav is unchanged (simple links, no mega-menu)
- /ui-kit shows BlogCard section

**Step 4: Commit any fixes if needed**
