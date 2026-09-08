/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FBF9F5',
        surface: {
          DEFAULT: '#FFFFFF',
          tint: '#F5F2EB',
          subtle: '#FAF8F3',
        },
        charcoal: {
          DEFAULT: '#1B1D19',
          muted: '#5F645D',
          light: '#888D85',
        },
        border: {
          warm: '#E7E3DA',
          subtle: '#EFEBE2',
          strong: '#D5CEC0',
        },
        forest: {
          50: '#F2F7F4',
          100: '#E4EFE8',
          200: '#C7DFD2',
          500: '#3D775B',
          600: '#2D5A43',
          700: '#1E3D2F',
          800: '#152C22',
          900: '#0E1D16',
        },
        honey: {
          50: '#FDFBF7',
          100: '#FBF4E8',
          200: '#F5E4C8',
          400: '#E3A23C',
          500: '#D48B28',
          600: '#C88A2C',
          700: '#A66E1D',
          800: '#835414',
          900: '#5E3B0C',
        },
        terracotta: {
          50: '#FDF6F5',
          100: '#FAEAE7',
          200: '#F4D2CC',
          500: '#D45E4C',
          600: '#C85341',
          700: '#B84A39',
          800: '#943729',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(27, 29, 25, 0.04), 0 1px 2px -1px rgba(27, 29, 25, 0.04)',
        'elevated': '0 4px 12px -2px rgba(27, 29, 25, 0.06), 0 2px 4px -2px rgba(27, 29, 25, 0.04)',
      },
    },
  },
  plugins: [],
}
