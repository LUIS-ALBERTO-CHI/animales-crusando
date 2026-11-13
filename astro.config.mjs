// @ts-check
import { defineConfig } from 'astro/config';

// Sitio 100% estático: `npm run build` genera la carpeta dist/ lista para subir
// a Netlify, Vercel o GitHub Pages, o para probar con `npm run preview`.
export default defineConfig({
  output: 'static',
});
