import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Override pure black and white so the entire system never uses #000000 or #ffffff
        black: '#0e1412',
        white: '#f8faf7',

        // Primary Brand Accent: #70ffaf
        mint: {
          DEFAULT: '#70ffaf',
          50: '#eefcf4',
          100: '#d5f7e3',
          200: '#adf0cb',
          300: '#70ffaf',
          400: '#47e690',
          500: '#24c46f',
          600: '#179954',
          700: '#147844',
          800: '#125e37',
          900: '#0f4d2e',
        },

        // Deep Obsidian / Forest Carbon (Off-black scale)
        obsidian: {
          950: '#0a0e0c',
          900: '#0e1412',
          850: '#121a17',
          800: '#16201c',
          700: '#1f2d27',
          600: '#2c3e36',
          500: '#42594f',
        },

        // Warm Sage Alabaster (Off-white scale)
        alabaster: {
          50: '#f8faf7',
          100: '#f1f5f0',
          200: '#e3eae1',
          300: '#cdd8ca',
          400: '#9bad97',
        },

        // Harmonized neutral scale mapped to organic sage-charcoal (no pure black/white)
        swiss: {
          950: '#0e1412',
          900: '#16201c',
          800: '#212e29',
          700: '#35463f',
          600: '#4c6057',
          500: '#687d73',
          400: '#92a59c',
          300: '#cad5cf',
          200: '#e1e8e4',
          100: '#eef3f0',
          50: '#f5f8f6',
        },

        signal: {
          emerald: '#179954',
          'emerald-light': '#eefcf4',
          'emerald-dark': '#125e37',
          mint: '#70ffaf',
          amber: '#d97706',
          'amber-light': '#fdf8eb',
          crimson: '#d63638',
          blue: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', '"Be Vietnam Pro"', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      letterSpacing: {
        'swiss-tight': '-0.03em',
        'swiss-wide': '0.06em',
        'swiss-widest': '0.12em',
      },
      borderRadius: {
        'swiss-xs': '6px',
        'swiss-sm': '10px',
        'swiss-md': '16px',
        'swiss-lg': '24px',
        'swiss-xl': '32px',
      },
      boxShadow: {
        'swiss-card': '0 4px 20px -2px rgba(14, 20, 18, 0.05), 0 1px 3px rgba(14, 20, 18, 0.03)',
        'swiss-elevated': '0 16px 40px -8px rgba(14, 20, 18, 0.10)',
        'swiss-hover': '0 12px 32px -4px rgba(14, 20, 18, 0.12), 0 0 0 1px rgba(112, 255, 175, 0.4)',
        'mint-glow': '0 0 28px -4px rgba(112, 255, 175, 0.35)',
        'mint-glow-lg': '0 0 48px -6px rgba(112, 255, 175, 0.45)',
      },
    },
  },
  plugins: [],
};

