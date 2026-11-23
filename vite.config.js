import { defineConfig } from 'vite';

// Desde 2.6 el juego ya no va en un solo archivo: dist/index.html carga el código y las imágenes van aparte en dist/assets
// (con nombre que cambia en cada versión y caché larga), para que en el celular empiece a jugar sin bajar todo el juego.
// itch.io abre la versión en línea (itch/bloquevilla_itch.html), así que no necesita el archivo único.
export default defineConfig({
  base: '/',
  build: { target: 'es2019', chunkSizeWarningLimit: 4000, assetsInlineLimit: 2048 },
});
