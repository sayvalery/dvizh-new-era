import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: process.env.SITE_URL || 'https://dvizh.io',
  output: 'static',
  integrations: [tailwind(), sitemap()],
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:3002',
        '/media': 'http://localhost:3002',
      },
    },
  },
})
