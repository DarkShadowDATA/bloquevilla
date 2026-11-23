// Segunda tanda de imágenes: se bajan en segundo plano después de empezar a jugar.
// Si una pantalla las necesita antes, se pasa por la escena Carga (barra corta) y luego se abre la pantalla.
import { IMAGES, esDePartida } from './assets.js';

let lista = false, prom = null, prog = 0;
const oyentes = new Set();
export const cargaLista = () => lista;
/** Boot ya bajó todo (va al menú o es modo captura): no hace falta la segunda tanda. */
export const marcarCargaLista = () => { lista = true; prom = Promise.resolve(); };

/** Empieza (una sola vez) a bajar las imágenes que faltan. Usa una escena cualquiera para el cargador. */
export function empezarCarga(scene, tema, evento = false) {
  if (prom) return prom;
  const pend = IMAGES.filter(({ key }) => !esDePartida(key, tema, evento));
  prom = new Promise((resolve) => {
    if (!pend.length) { lista = true; resolve(); return; }
    const L = scene.load;   // el cargador de la escena Fondo (se queda prendida)
    pend.forEach(({ key, url }) => L.image(key + '__nueva', url));
    L.on('progress', (p) => { prog = p; oyentes.forEach((f) => f(p)); });
    // al llegar cada imagen reemplaza a la versión dibujada con código (si la había)
    L.on('filecomplete', (k) => {
      const key = k.replace(/__nueva$/, '');
      const T = scene.textures;
      if (T.exists(key)) T.remove(key);
      T.renameTexture(k, key);
    });
    L.once('complete', () => { lista = true; prog = 1; oyentes.forEach((f) => f(1)); resolve(); });
    L.start();
  });
  return prom;
}

/** Espera a que termine la segunda tanda (con avisos de avance). */
export function cargaRestante(alAvanzar) {
  if (lista) return Promise.resolve();
  if (alAvanzar) { oyentes.add(alAvanzar); alAvanzar(prog); }
  return (prom || Promise.resolve()).then(() => { oyentes.delete(alAvanzar); });
}
