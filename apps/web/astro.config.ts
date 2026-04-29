import { defineConfig } from 'astro/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
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

export default defineConfig({
  site: process.env.SITE_URL || 'https://dvizh.io',
  output: 'static',
  prefetch: true,
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()],
  server: {
    host: true, // expose on local network, not just localhost
  },
  vite: {
    server: {
      allowedHosts: ['preview.dvizh.cc'],
      proxy: {
        '/api': { target: cmsProxy, changeOrigin: true, secure: false },
        '/media': { target: cmsProxy, changeOrigin: true, secure: false },
      },
    },
  },
})
