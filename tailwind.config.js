/** @type {import('tailwindcss').Config} */
const accent = (shade) => `rgb(var(--accent-${shade}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        canvas: "#f5f6f8",
        line: "#e4e7ec",
        ink: "#16181d",
        // Each workspace (admin / examiner / student) sets its own accent
        // through CSS variables, see src/index.css.
        accent: {
          50: accent(50),
          100: accent(100),
          200: accent(200),
          500: accent(500),
          600: accent(600),
          700: accent(700),
        },
      },
    },
  },
  plugins: [],
};
