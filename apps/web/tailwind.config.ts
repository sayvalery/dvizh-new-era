import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Styrene A"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#ff4d00',
          50: '#fff5ed',
          100: '#ffe8d5',
          200: '#fecda9',
          300: '#fda973',
          400: '#fb7a3a',
          500: '#ff4d00',
          600: '#e64600',
          700: '#be3500',
          800: '#972c07',
          900: '#7a280c',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
