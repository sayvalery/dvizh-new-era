import { defineConfig } from 'astro/config'
import type { AstroIntegration } from 'astro'
import { readFileSync, readdirSync } from 'fs'
import { join, relative, resolve } from 'path'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

// process.env в astro.config.ts НЕ читает .env автоматически —
// переменные из .env доступны через import.meta.env только в коде приложения.
// Читаем .env вручную через Node.js built-ins, без новых зависимостей.
function parseDotEnv(path: string): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf-8')
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#'))
        .map(line => {
          const eq = line.indexOf('=')
          return eq === -1 ? null : [line.slice(0, eq).trim(), line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')]
        })
        .filter(Boolean) as [string, string][]
    )
  } catch {
    return {}
  }
}

const dotenv = parseDotEnv(resolve(process.cwd(), '.env'))

// Vite http-proxy использует c-ares (не резолвит .orb.local mDNS).
// VITE_PROXY_CMS — отдельная переменная для Vite dev proxy.
// CMS_URL (из .env) работает для build через undici/fetch.
const cmsProxy = dotenv.VITE_PROXY_CMS || dotenv.CMS_URL || process.env.VITE_PROXY_CMS || 'http://localhost:3002'

// ---------------------------------------------------------------------------
// Dev-only страницы (/lab/*, /sales)
// ---------------------------------------------------------------------------
// Astro НЕ создаёт маршруты для файлов и папок в src/pages, имя которых
// начинается с «_». Поэтому все экспериментальные страницы лежат в
// src/pages/_lab/ и src/pages/_sales.astro — в прод-сборку они физически
// не попадают (нет маршрута → нет HTML в dist), и никакой ручной гард
// в каждом файле для этого не нужен.
//
// В dev-режиме интеграция ниже возвращает их по прежним URL через
// injectRoute: /lab, /lab/<файл>, /lab/category-page/[cat], /sales.
//
// ДОБАВИТЬ НОВУЮ LAB-СТРАНИЦУ: просто положи файл в src/pages/_lab/ —
// в dev маршрут появится автоматически, в прод не утечёт. Ничего
// прописывать здесь не нужно.
const DEV_ONLY_PAGES: Array<{ source: string; urlBase: string }> = [
  { source: 'src/pages/_lab', urlBase: '/lab' },
  { source: 'src/pages/_sales.astro', urlBase: '/sales' },
]

/** Рекурсивно собирает .astro-файлы, пропуская служебные (`_`, `.`) имена. */
function collectAstroPages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return []
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectAstroPages(full)
    return entry.name.endsWith('.astro') ? [full] : []
  })
}

/** Файл → URL-паттерн: `article-page.astro` → `/lab/article-page`, `index.astro` → `/lab`. */
function toRoutePattern(urlBase: string, relPath: string): string {
  const tail = relPath
    .split(/[\\/]/)
    .join('/')
    .replace(/\.astro$/, '')
    .replace(/(^|\/)index$/, '')
  return tail ? `${urlBase}/${tail}` : urlBase
}

const devOnlyPages: AstroIntegration = {
  name: 'dvizh:dev-only-pages',
  hooks: {
    'astro:config:setup': ({ command, injectRoute, logger }) => {
      // Только dev-сервер. В build/preview маршрутов не существует.
      if (command !== 'dev') return

      for (const { source, urlBase } of DEV_ONLY_PAGES) {
        const abs = resolve(process.cwd(), source)
        const files = source.endsWith('.astro') ? [abs] : collectAstroPages(abs)
        for (const file of files) {
          const pattern = source.endsWith('.astro')
            ? urlBase
            : toRoutePattern(urlBase, relative(abs, file))
          injectRoute({ pattern, entrypoint: file })
        }
      }
      logger.info('dev-only маршруты подключены: ' + DEV_ONLY_PAGES.map(p => p.urlBase).join(', '))
    },
  },
}

export default defineConfig({
  site: process.env.SITE_URL || 'https://dvizh.io',
  output: 'static',
  prefetch: true,
  integrations: [
    devOnlyPages,
    tailwind({ applyBaseStyles: false }),
    sitemap({
      // Dev-only и служебные страницы не должны попадать в sitemap (и в прод-индексацию).
      filter: (page) =>
        !/\/(lab|sales|ui-kit|thanks)(\/|$)/.test(page) &&
        !/\/404(\/|$)/.test(page),
    }),
  ],
  server: {
    host: true, // expose on local network, not just localhost
  },
  vite: {
    server: {
      allowedHosts: ['preview.dvizh.cc'],
      watch: {
        usePolling: true,
        interval: 300,
      },
      proxy: {
        '/api': { target: cmsProxy, changeOrigin: true, secure: false },
        '/media': { target: cmsProxy, changeOrigin: true, secure: false },
      },
    },
    optimizeDeps: {
      include: ['alpinejs'],
    },
  },
})
