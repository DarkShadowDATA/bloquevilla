// Imágenes opcionales: todo archivo en src/assets/img/ se carga con su nombre como clave.
// Ejemplo: src/assets/img/block_red.webp reemplaza al bloque rojo dibujado con código.
const files = import.meta.glob('./assets/img/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' });

export const IMAGES = Object.entries(files).map(([path, url]) => ({
  key: path.split('/').pop().replace(/\.(png|webp|jpe?g)$/i, ''),
  url,
}));
