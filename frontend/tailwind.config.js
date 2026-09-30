/** @type {import('tailwindcss').Config} */

// Mau lay tu bien CSS (xem src/index.css) de doi duoc theo light/dark mode
// ma van giu cu phap opacity cua Tailwind, vd: text-ink/60, bg-moss/10.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        ink: token('ink'),         // chu chinh
        paper: token('paper'),     // nen trang
        surface: token('surface'), // nen card
        moss: token('moss'),       // mau thuong hieu
        mint: token('mint'),       // nen nhat cua moss
        amber: token('amber'),     // diem nhan, diem trung binh
        clay: token('clay'),       // diem thap, tu choi
        forest: token('forest'),   // panel toi cua thuong hieu (toi o ca 2 mode)
        night: 'rgb(16 36 32 / <alpha-value>)', // chu toi co dinh tren nen amber
        cream: 'rgb(226 238 231 / <alpha-value>)', // chu sang co dinh tren nen forest
      },
      boxShadow: {
        card: '0 1px 0 rgb(var(--ink) / 0.04), 0 8px 24px -12px rgb(var(--ink) / 0.18)',
        lift: '0 2px 0 rgb(var(--ink) / 0.04), 0 18px 40px -16px rgb(var(--ink) / 0.28)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        sift: {
          '0%': { transform: 'translateY(-24px)', opacity: '0' },
          '15%': { opacity: '1' },
          '55%': { transform: 'translateY(64px)', opacity: '1' },
          '70%, 100%': { transform: 'translateY(64px)', opacity: '0' },
        },
        drop: {
          '0%, 55%': { transform: 'translateY(0)', opacity: '0' },
          '60%': { opacity: '1' },
          '100%': { transform: 'translateY(70px)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--r, 0deg))' },
          '50%': { transform: 'translateY(-6px) rotate(var(--r, 0deg))' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        shimmer: 'shimmer 2.2s linear infinite',
        sift: 'sift 3.2s ease-in infinite',
        drop: 'drop 3.2s ease-in infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
