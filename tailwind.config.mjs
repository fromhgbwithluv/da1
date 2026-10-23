/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Swiss & Minimalist Neutral Palette
        swiss: {
          950: '#0a0a0a',
          900: '#171717',
          800: '#262626',
          700: '#404040',
          600: '#525252',
          500: '#737373',
          400: '#a3a3a3',
          300: '#d4d4d4',
          200: '#e5e5e5',
          100: '#f5f5f5',
          50: '#fafafa',
        },
        // Purposeful Signal Accents
        signal: {
          emerald: '#059669',
          'emerald-light': '#ecfdf5',
          'emerald-dark': '#047857',
          amber: '#d97706',
          'amber-light': '#fffbeb',
          crimson: '#dc2626',
          blue: '#2563eb',
        },
        // Retain brand semantic tokens
        brand: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#171717',
          600: '#0a0a0a',
          700: '#059669',
          800: '#047857',
          900: '#064e3b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        'swiss-tight': '-0.035em',
        'swiss-wide': '0.08em',
        'swiss-widest': '0.14em',
      },
      borderRadius: {
        'swiss-sm': '2px',
        'swiss-md': '4px',
        'swiss-lg': '8px',
        'swiss-xl': '12px',
      },
      boxShadow: {
        'swiss-card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'swiss-elevated': '0 4px 12px rgba(0,0,0,0.05)',
        'swiss-hover': '0 6px 20px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
};
