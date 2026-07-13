import type { Config } from 'tailwindcss';

/**
 * Design tokens — โทนโรงพยาบาล/ธรรมชาติ
 * เขียวธรรมชาติ · ฟ้า · ขาว · น้ำตาลอ่อน · ชมพูอ่อน
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canopy: {
          50: '#f0f9f1', 100: '#dbf0dd', 200: '#b8e1bd', 300: '#8bcb95',
          400: '#5cae6b', 500: '#3a924e', 600: '#2b753d', 700: '#245d33',
          800: '#1f4a2b', 900: '#1a3d25',
        },
        sky2: {
          50: '#f1f9fe', 100: '#e2f2fc', 200: '#bfe3f2', 300: '#8ecfeb',
          400: '#55b5df', 500: '#2e9acb', 600: '#1f7cab', 700: '#1b638b',
        },
        bark: {
          100: '#f3ece4', 200: '#e4d5c3', 300: '#cbb096', 400: '#a67b5b',
          500: '#8a6247', 600: '#6f4e39', 700: '#573d2d',
        },
        blossom: {
          100: '#fdeef4', 200: '#f9d6e4', 300: '#f5c6d6', 400: '#ec9cba', 500: '#dd6f9b',
        },
        cream: {
          50: '#fdfbf5', 100: '#f8f4e8', 200: '#f1ead6', 300: '#e6dcc0',
        },
        care: {
          red: '#d9534f', yellow: '#e3b93d', green: '#2b753d',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(31, 99, 139, 0.12)',
        leaf: '0 4px 14px rgba(58, 146, 78, 0.25)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.22,1,.36,1) both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
