/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mesh: '#090b10',
        spider: {
          red: '#e62429',
          'red-hover': '#ff3b30',
          blue: '#2563eb',
          'blue-hover': '#3b82f6',
          dark: '#111522',
        }
      },
    },
  },
  plugins: [],
};
