/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#16302b',      // xanh reu dam - mau chu dao
        moss: '#2f6b5e',     // xanh reu
        mint: '#e8f2ee',     // nen nhat
        amber: '#e3a02d',    // diem nhan (score, CTA phu)
        paper: '#f7f8f6',    // nen trang nga
      },
    },
  },
  plugins: [],
};
