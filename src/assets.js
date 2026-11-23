// Imágenes opcionales: todo archivo en src/assets/img/ se carga con su nombre como clave.
// Ejemplo: src/assets/img/block_red.webp reemplaza al bloque rojo dibujado con código.
// Desde 2.6 son archivos aparte (no van dentro del index.html) y se cargan en dos tandas:
//  1) las que necesita la partida (bloques, poderes, iconos, fondo del tablero, el tema elegido) antes de empezar;
//  2) el resto (pueblo, fondos de menú, decoraciones, jefes…) en segundo plano mientras ya se juega (ver Carga.js).
const files = import.meta.glob('./assets/img/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' });

export const IMAGES = Object.entries(files).map(([path, url]) => ({
  key: path.split('/').pop().replace(/\.(png|webp|jpe?g)$/i, ''),
  url,
}));

const PARTIDA = ['block_', 'blk_', 'pw_', 'ui_', 'card_', 'medalla_', 'water_', 'bg_game'];
/** ¿La necesita la partida desde el primer cuadro? */
export const esDePartida = (key, tema, evento = false) => PARTIDA.some((p) => key.startsWith(p)) || (!!tema && key.startsWith(tema + '_'))
  || (evento && (key === 'deco_papel_picado' || key.startsWith('evento_')));   // adornos del evento de temporada, solo si hay evento
