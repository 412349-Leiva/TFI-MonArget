import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050b14',
          900: '#071322',
          800: '#0b1d31',
          700: '#112844',
        },
        gold: {
          500: '#d6b14a',
          600: '#c49e31',
        },
        ink: '#09111d',
      },
      boxShadow: {
        glow: '0 12px 40px rgba(214, 177, 74, 0.12)',
        soft: '0 16px 40px rgba(0, 0, 0, 0.28)',
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'dashboard-radial': 'radial-gradient(circle at top right, rgba(214, 177, 74, 0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.05), transparent 35%)',
      },
    },
  },
  plugins: [],
} satisfies Config;