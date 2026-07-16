// Tailwind v4 for the Vyxen-derived landing page only (app/page.js). The rest
// of the app uses plain CSS (globals.css) and never references Tailwind
// utility classes, so this plugin has nothing to do outside that one page.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
