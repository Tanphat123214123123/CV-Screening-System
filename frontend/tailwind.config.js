/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Be Vietnam Pro: body copy — rõ, hỗ trợ tiếng Việt tốt.
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        // Fraunces: serif hiển thị cho heading — chất "hồ sơ biên tập".
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        // IBM Plex Mono: số liệu, nhãn, badge trạng thái — như con dấu hồ sơ.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#16302b',
          soft: '#2a4a43',
        },
        moss: {
          DEFAULT: '#2f6b5e',
          dark: '#1f4a40',
          light: '#4d8b7c',
        },
        mint: '#e8f2ee',
        amber: {
          DEFAULT: '#e3a02d',
          dark: '#b97f16',
        },
        rust: {
          DEFAULT: '#b5482a',
          light: '#f6e3db',
        },
        paper: {
          DEFAULT: '#f4f1e8',
          card: '#fbfaf5',
        },
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.12em' }],
        display: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-lg': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'display-xl': ['3rem', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        stamp: '2px 2px 0 0 rgba(22,48,43,1)',
        'stamp-moss': '2px 2px 0 0 rgba(47,107,94,1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stamp: {
          '0%': { transform: 'scale(1.2) rotate(-8deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(-2deg)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms ease-out',
        stamp: 'stamp 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
