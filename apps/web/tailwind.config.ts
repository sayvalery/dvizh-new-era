import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Styrene A"', 'system-ui', 'sans-serif'],
      },
      colors: {
        gray: {
          100: '#FBF9F6',
          200: '#F3F1EE',
          300: '#E6E4E1',
          400: '#C2C2C2',
          500: '#858585',
          600: '#6D6C6C',
          700: '#505050',
          800: '#323232',
          900: '#1D1E21',
        },
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
