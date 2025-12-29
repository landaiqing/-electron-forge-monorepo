/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './src/renderer/src/**/*.{css}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{css}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
