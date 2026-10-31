// Modo Aventura: niveles cortos con un objetivo, un límite de piezas y 1 a 3 estrellas.
// Objetivos: puntos, lineas, bombas (desactivar), hielo (romper), oro (limpiar bloques dorados), combo (llegar a xN)
import { save, persist } from './save.js';

// t = tipo, n = meta, p = piezas disponibles, plantilla = tablero inicial (B bomba, I hielo, G oro, letras = color)
export const NIVELES = [
  { t: 'lineas', n: 3, p: 15, nombre: 'Primeros pasos' },
  { t: 'puntos', n: 400, p: 15, nombre: 'Calentando' },
  { t: 'hielo', n: 2, p: 18, nombre: 'Hielo fino', plantilla: ['........', '........', '.rr..bb.', 'rrI..Ibb', '........', '........', '........', '........'] },
  { t: 'lineas', n: 6, p: 18, nombre: 'Seis de seis' },
  { t: 'oro', n: 2, p: 18, nombre: 'Fiebre del oro', plantilla: ['........', '........', 'gG.yy...', '........', '........', '...ppG..', '........', '........'], oro: 0.5 },
  { t: 'bombas', n: 1, p: 15, nombre: 'Primera bomba', plantilla: ['........', '........', '........', 'ooo.Booo', '........', '........', '........', '........'] },
  { t: 'combo', n: 3, p: 20, nombre: 'En racha' },
  { t: 'hielo', n: 3, p: 24, nombre: 'Glaciar', plantilla: ['........', '.I....I.', '........', '..bbbb..', '........', '.I....I.', '........', '........'] },
  { t: 'puntos', n: 1200, p: 26, nombre: 'Mil y algo' },
  { t: 'bombas', n: 2, p: 22, nombre: 'Desactivador', plantilla: ['........', 'pp.B.ppp', '........', '........', '........', '........', 'gg.ggBgg', '........'] },
  { t: 'oro', n: 4, p: 24, nombre: 'Mina dorada', plantilla: ['G......G', '........', '..rrrr..', '........', '........', '..bbbb..', '........', 'G......G'], oro: 0.45 },
  { t: 'lineas', n: 12, p: 30, nombre: 'Doce líneas' },
  { t: 'combo', n: 4, p: 24, nombre: 'En llamas' },
  { t: 'hielo', n: 5, p: 30, nombre: 'Era de hielo', plantilla: ['I......I', '........', '..I..I..', '.yyyyyy.', '........', '..I..I..', '........', '........'] },
  { t: 'bombas', n: 3, p: 28, nombre: 'Campo minado', plantilla: ['Bkk..kkk', '........', '........', '........', 'ooo.Boo.', '........', '........', '.gg..ggB'] },
  { t: 'puntos', n: 2500, p: 34, nombre: 'Gran puntaje' },
  { t: 'oro', n: 6, p: 30, nombre: 'Tesoro', plantilla: ['..G..G..', '........', 'p.pppp.p', '........', '........', 'b.bbbb.b', '........', '..G..G..'], oro: 0.5 },
  { t: 'combo', n: 5, p: 30, nombre: 'Imparable' },
  { t: 'hielo', n: 6, p: 36, nombre: 'Polo norte', plantilla: ['I.I..I.I', '........', '.gggggg.', '..I..I..', '........', '.rrrrrr.', '........', 'I......I'] },
  { t: 'bombas', n: 4, p: 34, nombre: 'Gran final', plantilla: ['Bp..p..B', '........', '..I..I..', '........', '........', '..I..I..', '........', 'B..oo..B'] },
];

export const OBJ_TEXTO = {
  puntos: (n) => `Haz ${n.toLocaleString('es-MX')} puntos`,
  lineas: (n) => `Limpia ${n} líneas`,
  hielo: (n) => `Rompe ${n} bloques de hielo`,
  oro: (n) => `Limpia ${n} bloques dorados`,
  bombas: (n) => `Desactiva ${n} bomba${n > 1 ? 's' : ''}`,
  combo: (n) => `Llega a combo x${n}`,
};
export const OBJ_ICONO = { puntos: 'ui_trofeo', lineas: 'ui_estrella', hielo: 'blk_hielo', oro: 'block_gold', bombas: 'blk_bomba', combo: 'pw_rayo' };

export const PREMIO_ESTRELLAS = [0, 10, 15, 25];   // ladrillos por 1, 2, 3 estrellas (la primera vez)

export const nivelesSuperados = () => (save.aventura.estrellas || []).filter((e) => e > 0).length;
export const estrellasTotales = () => (save.aventura.estrellas || []).reduce((a, b) => a + (b || 0), 0);
export const desbloqueado = (i) => i <= nivelesSuperados();

// Estrellas según cuántas piezas sobraron
export function calcularEstrellas(piezasUsadas, total) {
  const sobran = total - piezasUsadas;
  if (sobran >= Math.ceil(total * 0.35)) return 3;
  if (sobran >= Math.ceil(total * 0.15)) return 2;
  return 1;
}

// Guarda el resultado y devuelve los ladrillos ganados (solo por estrellas nuevas)
export function guardarResultado(i, estrellas) {
  const lista = save.aventura.estrellas || (save.aventura.estrellas = []);
  const antes = lista[i] || 0;
  let premio = 0;
  for (let e = antes + 1; e <= estrellas; e++) premio += PREMIO_ESTRELLAS[e];
  if (estrellas > antes) lista[i] = estrellas;
  save.bricks += premio;
  persist();
  return premio;
}
