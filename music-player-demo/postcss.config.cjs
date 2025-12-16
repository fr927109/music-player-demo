/**
 * Use the PostCSS entry package for Tailwind. Recent Tailwind builds moved the
 * PostCSS integration into a separate package. Install it with:
 *
 *   npm install -D @tailwindcss/postcss
 *
 * Then start the dev server again.
 */
module.exports = {
  plugins: {
    // Use the official Tailwind PostCSS plugin package
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
