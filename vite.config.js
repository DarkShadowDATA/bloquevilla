import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Todo el juego sale en un solo dist/index.html: listo para itch.io o cualquier hosting.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2019', chunkSizeWarningLimit: 4000 },
});
