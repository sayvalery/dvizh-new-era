import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      // Дизайн-токены добавляются здесь
      // colors: { brand: { ... } },
      // fontFamily: { sans: [...] },
    },
  },
  plugins: [],
} satisfies Config
