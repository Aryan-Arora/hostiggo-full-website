import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Design tokens pulled from Figma "Website Guest UI/UX" (file
        // PkxxdQZz9FfGkmUWhnrMOW). Old `primary`/`brand` scales kept
        // temporarily so unmigrated pages don't break -- remove once every
        // page has been reskinned off them.
        primary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        brand: {
          blue: '#1a6ff4',
          dark: '#0f172a',
        },
        figma: {
          navy: '#004772', // primary brand color -- logo mark, headings, primary buttons
          accent: '#0086d8', // secondary blue -- links, gradient end, highlights
          indigo: '#3d50df', // rare accent (selected states)
          ink: '#1a1a1a', // primary body text
          'ink-soft': '#1b1b1b',
          cream: '#fffef9', // page background
          surface: '#f8f8f8', // card/section background
          border: '#e0e0e0',
          muted: '#5f5f5f', // secondary text
          'muted-light': '#a6a6a6', // tertiary text/placeholders
          success: '#00ad28', // ratings/positive badges
          footer: '#172934', // footer background
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 8px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 6px 24px rgba(0,0,0,0.12)',
        dropdown: '0 8px 40px rgba(0,0,0,0.14)',
        nav: '0 1px 4px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
