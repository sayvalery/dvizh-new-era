import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

// Vite http-proxy использует c-ares (не резолвит .orb.local mDNS).
// VITE_PROXY_CMS — отдельная переменная для Vite dev proxy.
// CMS_URL (из .env) работает для build через undici/fetch.
const cmsProxy = process.env.VITE_PROXY_CMS || process.env.CMS_URL || 'http://localhost:3002'

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
        '/api': cmsProxy,
        '/media': cmsProxy,
      },
    },
  },
})
