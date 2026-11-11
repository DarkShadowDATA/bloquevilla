// Modo Aventura: niveles cortos con un objetivo, un límite de piezas y 1 a 3 estrellas. 60 niveles en 3 mundos.
// Objetivos: puntos, lineas, bombas (desactivar), hielo (romper), oro (limpiar bloques dorados), combo (llegar a xN),
// cadenas (romper bloques encadenados) y jefe (bajarle la vida a 0: cada línea le quita 1 y los combos quitan más).
import { save, persist } from './save.js';

// Tablero inicial compacto: 'X34' pone X en fila 3, columna 4; 'X3:2-5' llena la fila 3 de la columna 2 a la 5; 'X2|4-7' llena la columna 2 de la fila 4 a la 7.
// Lo que va después en el texto pisa lo anterior, así que las cadenas y bombas se escriben al final.
// Letras: # hueco, V cadena ↕ (se rompe con su columna), H cadena ↔ (con su fila), B bomba, I hielo, G oro, T tierra, r o y g b p k colores
function T(spec) {
  const g = Array.from({ length: 8 }, () => Array(8).fill('.'));
  spec.split(' ').filter(Boolean).forEach((tk) => {
    const ch = tk[0], r = Number(tk[1]);
    if (tk[2] === ':') { const [a, b] = tk.slice(3).split('-').map(Number); for (let c = a; c <= b; c++) g[r][c] = ch; }
    else if (tk[2] === '|') { const [a, b] = tk.slice(3).split('-').map(Number); for (let f = a; f <= b; f++) g[f][r] = ch; }   // 'X2|4-7': columna 2, filas 4 a 7
    else g[r][Number(tk[2])] = ch;
  });
  return g.map((row) => row.join(''));
}
const HUECOS = {
  centro: '#33 #34 #43 #44',
  esquinas: '#00 #07 #70 #77',
  cuatro: '#11 #16 #61 #66',
  rombo: '#22 #25 #52 #55',
  lados: '#30 #40 #37 #47',
  cruz: '#03 #04 #73 #74 #30 #40 #37 #47',
};

// t = tipo, n = meta, p = piezas disponibles, plantilla = tablero inicial, raras = salen piezas raras, oro = probabilidad de bloque dorado
export const NIVELES = [
  // ---- Mundo 1: Pradera ----
  { t: 'lineas', n: 3, p: 15, nombre: 'Primeros pasos' },
  { t: 'puntos', n: 400, p: 15, nombre: 'Calentando' },
  { t: 'hielo', n: 2, p: 18, nombre: 'Hielo fino', plantilla: ['........', '........', '.rr..bb.', 'rrI..Ibb', '........', '........', '........', '........'] },
  { t: 'lineas', n: 6, p: 18, nombre: 'Seis de seis' },
  { t: 'oro', n: 2, p: 18, nombre: 'Fiebre del oro', plantilla: ['........', '........', 'gG.yy...', '........', '........', '...ppG..', '........', '........'], oro: 0.5 },
  { t: 'bombas', n: 1, p: 15, nombre: 'Primera bomba', plantilla: ['........', '........', '........', 'ooo.Booo', '........', '........', '........', '........'] },
  { t: 'combo', n: 3, p: 20, nombre: 'En racha' },
  { t: 'hielo', n: 3, p: 24, nombre: 'Glaciar', plantilla: ['........', '.I....I.', '........', '..bbbb..', '........', '.I....I.', '........', '........'] },
  { t: 'puntos', n: 1200, p: 26, nombre: 'Mil y algo' },
  { t: 'jefe', n: 12, p: 26, nombre: 'El Topo Gigante', jefe: { id: 'topo', cada: 4, cant: 2 } },
  { t: 'oro', n: 4, p: 24, nombre: 'Mina dorada', plantilla: ['G......G', '........', '..rrrr..', '........', '........', '..bbbb..', '........', 'G......G'], oro: 0.45 },
  { t: 'lineas', n: 12, p: 30, nombre: 'Doce líneas' },
  { t: 'combo', n: 4, p: 24, nombre: 'En llamas' },
  { t: 'hielo', n: 5, p: 30, nombre: 'Era de hielo', plantilla: ['I......I', '........', '..I..I..', '.yyyyyy.', '........', '..I..I..', '........', '........'] },
  { t: 'bombas', n: 3, p: 28, nombre: 'Campo minado', plantilla: ['Bkk..kkk', '........', '........', '........', 'ooo.Boo.', '........', '........', '.gg..ggB'] },
  { t: 'puntos', n: 2500, p: 34, nombre: 'Gran puntaje' },
  { t: 'oro', n: 6, p: 30, nombre: 'Tesoro', plantilla: ['..G..G..', '........', 'p.pppp.p', '........', '........', 'b.bbbb.b', '........', '..G..G..'], oro: 0.5 },
  { t: 'combo', n: 5, p: 30, nombre: 'Imparable' },
  { t: 'hielo', n: 6, p: 36, nombre: 'Polo norte', plantilla: ['I.I..I.I', '........', '.gggggg.', '..I..I..', '........', '.rrrrrr.', '........', 'I......I'] },
  { t: 'jefe', n: 24, p: 36, nombre: 'El Topo contraataca', jefe: { id: 'topo', cada: 3, cant: 2 }, plantilla: ['........', '..T..T..', '........', '........', '........', '........', '..T..T..', '........'] },
  // ---- Mundo 2: Puerto (huecos en el tablero, bloques encadenados y piezas raras) ----
  { t: 'lineas', n: 6, p: 20, nombre: 'Tablas rotas', plantilla: T(HUECOS.centro) },
  { t: 'puntos', n: 1500, p: 28, nombre: 'Marea alta' },
  { t: 'cadenas', n: 2, p: 12, nombre: 'Anclas', plantilla: T('r2|4-7 g5|0-3 V32 V45') },
  { t: 'oro', n: 5, p: 32, nombre: 'Cofre hundido', plantilla: T(HUECOS.cuatro + ' G33 G44'), oro: 0.6 },
  { t: 'lineas', n: 8, p: 26, nombre: 'Piezas del naufragio', raras: true },
  { t: 'hielo', n: 5, p: 30, nombre: 'Agua helada', plantilla: T('I12 I15 I33 I44 I62 I65') },
  { t: 'combo', n: 4, p: 20, nombre: 'Viento a favor', plantilla: T(HUECOS.esquinas) },
  { t: 'cadenas', n: 4, p: 24, nombre: 'Amarras', plantilla: T('b1|3-6 b6|3-6 y5:2-5 V21 V26 H51 H56') },
  { t: 'bombas', n: 3, p: 28, nombre: 'Pólvora mojada', plantilla: T('B13 k1:0-1 k1:5-7 B44 o4:0-2 o4:6-7 B62 g6:4-7') },
  { t: 'jefe', n: 22, p: 40, nombre: 'El Pulpo del Puerto', jefe: { id: 'pulpo', cada: 4, cant: 2 } },
  { t: 'puntos', n: 2500, p: 30, nombre: 'Carga rara', raras: true },
  { t: 'cadenas', n: 5, p: 30, nombre: 'Cadenas del muelle', plantilla: T(HUECOS.centro + ' r1|4-6 r6|2-5 g3:5-6 g4:1-2 b3|0-1 V11 V16 H31 H46 V63') },
  { t: 'lineas', n: 14, p: 38, nombre: 'Catorce nudos', plantilla: T(HUECOS.rombo) },
  { t: 'oro', n: 7, p: 24, nombre: 'Botín pirata', plantilla: T('G02 G05 G33 G44 G72 G75'), oro: 0.5, raras: true },
  { t: 'hielo', n: 5, p: 42, nombre: 'Témpano', plantilla: T('I11 I16 I23 I54 I61 I66') },
  { t: 'combo', n: 5, p: 30, nombre: 'Mar picado' },
  { t: 'bombas', n: 4, p: 34, nombre: 'Cañones', plantilla: T(HUECOS.centro + ' p1:2-7 o3:0-1 o3:5-7 g5:0-3 g5:6-7 k6:1-5 B11 B32 B55 B66') },
  { t: 'cadenas', n: 6, p: 38, nombre: 'Nudo marinero', plantilla: T('k0|2-5 k7|2-5 o2:3-4 o5:3-4 V10 V17 H22 H25 H52 H55'), raras: true },
  { t: 'puntos', n: 3500, p: 42, nombre: 'Gran pesca' },
  { t: 'jefe', n: 34, p: 46, nombre: 'El Pulpo furioso', jefe: { id: 'pulpo', cada: 3, cant: 1 }, plantilla: T(HUECOS.esquinas) },
  // ---- Mundo 3: Montaña ----
  { t: 'lineas', n: 16, p: 42, nombre: 'Sendero raro', raras: true },
  { t: 'hielo', n: 8, p: 48, nombre: 'Nevada', plantilla: T('I00 I07 I33 I44 I70 I77') },
  { t: 'cadenas', n: 6, p: 28, nombre: 'Puente colgante', plantilla: T(HUECOS.lados + ' b2|3-4 b5|3-4 V12 V15 H33 H44 V62 V65') },
  { t: 'puntos', n: 4000, p: 44, nombre: 'Cuesta arriba', raras: true },
  { t: 'bombas', n: 5, p: 40, nombre: 'Dinamita', plantilla: T('r0:2-7 y2:0-1 y2:5-7 b4:0-3 g6:3-7 k7:0-4 B01 B23 B45 B62 B76') },
  { t: 'oro', n: 8, p: 30, nombre: 'Veta dorada', plantilla: T(HUECOS.rombo + ' G00 G07 G33 G44 G70 G77'), oro: 0.55 },
  { t: 'combo', n: 6, p: 36, nombre: 'Avalancha' },
  { t: 'cadenas', n: 8, p: 30, nombre: 'Escalada', plantilla: T('p2|3-4 p5|3-4 V02 V62 V05 V65 H30 H37 H40 H47') },
  { t: 'lineas', n: 20, p: 50, nombre: 'Veinte cumbres', plantilla: T(HUECOS.cruz) },
  { t: 'jefe', n: 36, p: 50, nombre: 'El Yeti', jefe: { id: 'yeti', cada: 5, cant: 2 } },
  { t: 'puntos', n: 5000, p: 50, nombre: 'Aire delgado', plantilla: T(HUECOS.esquinas) },
  { t: 'hielo', n: 8, p: 54, nombre: 'Glaciar eterno', plantilla: T('I01 I06 I31 I46 I63 I64') },
  { t: 'bombas', n: 6, p: 44, nombre: 'Derrumbe', plantilla: T(HUECOS.centro + ' k0:3-7 o1:0-3 p2:2-6 g5:0-4 y6:3-7 r7:0-3 B02 B15 B21 B56 B62 B75') },
  { t: 'cadenas', n: 8, p: 24, nombre: 'Cordada', plantilla: T(HUECOS.cuatro + ' k2|3-4 k5|3-4 V02 V72 V05 V75 H20 H27 H50 H57') },
  { t: 'combo', n: 7, p: 42, nombre: 'Tormenta' },
  { t: 'oro', n: 10, p: 32, nombre: 'Tesoro del dragón', plantilla: T('G11 G16 G23 G24 G53 G54 G61 G66'), oro: 0.55, raras: true },
  { t: 'lineas', n: 24, p: 58, nombre: 'La última cuesta', plantilla: T(HUECOS.rombo) },
  { t: 'hielo', n: 9, p: 58, nombre: 'Cueva helada', plantilla: T(HUECOS.esquinas + ' I12 I15 I33 I44 I62 I65') },
  { t: 'puntos', n: 6000, p: 60, nombre: 'Cima a la vista', raras: true },
  { t: 'jefe', n: 60, p: 60, nombre: 'El Dragón de la Montaña', jefe: { id: 'dragon', cada: 4, cant: 2 }, plantilla: T(HUECOS.esquinas) },
];

// Jefes: cada «cada» piezas lanzan «cant» bloques. lanza = tierra, cadena, hielo o fuego (tierra y, a veces, una bomba)
export const JEFES = {
  topo: { nombre: 'Topo Gigante', lanza: 'tierra', dice: 'lanza bloques de tierra' },
  pulpo: { nombre: 'Pulpo del Puerto', lanza: 'cadena', dice: 'lanza bloques encadenados' },
  yeti: { nombre: 'Yeti', lanza: 'hielo', dice: 'lanza bloques de hielo' },
  dragon: { nombre: 'Dragón', lanza: 'fuego', dice: 'lanza tierra y bombas' },
};

// Mundos del mapa: desde = primer nivel (índice)
export const MUNDOS = [
  { nombre: 'Pradera', desde: 0, bg: 'bg_aventura', color: 0x5ac85a },
  { nombre: 'Puerto', desde: 20, bg: 'bg_aventura_puerto', color: 0x3a9ad8 },
  { nombre: 'Montaña', desde: 40, bg: 'bg_aventura_montana', color: 0x9a7ad8 },
];
export const mundoDe = (i) => MUNDOS.filter((m) => i >= m.desde).pop();

export const OBJ_TEXTO = {
  puntos: (n) => `Haz ${n.toLocaleString('es-MX')} puntos`,
  lineas: (n) => `Limpia ${n} líneas`,
  hielo: (n) => `Rompe ${n} bloques de hielo`,
  oro: (n) => `Limpia ${n} bloques dorados`,
  bombas: (n) => `Desactiva ${n} bomba${n > 1 ? 's' : ''}`,
  combo: (n) => `Llega a combo x${n}`,
  cadenas: (n) => `Rompe ${n} cadenas`,
};
export const OBJ_ICONO = { puntos: 'ui_trofeo', lineas: 'ui_estrella', hielo: 'blk_hielo', oro: 'block_gold', bombas: 'blk_bomba', combo: 'pw_rayo', cadenas: 'blk_cadv' };
export const textoObjetivo = (def) => (def.t === 'jefe' ? `Vence al ${JEFES[def.jefe.id].nombre}` : OBJ_TEXTO[def.t](def.n));
export const iconoObjetivo = (def, scene) => (def.t === 'jefe' ? (scene && scene.textures.exists('jefe_' + def.jefe.id) ? 'jefe_' + def.jefe.id : 'jefe_generico') : OBJ_ICONO[def.t]);
const tiene = (def, ch) => (def.plantilla || []).some((row) => row.includes(ch));
// Avisos la primera vez que aparece algo nuevo: [clave, condición, texto]
export const AVISO_NUEVO = [
  ['jefe', (d) => d.t === 'jefe', '¡JEFE! Cada línea le quita 1 de vida; los combos quitan más'],
  ['cadena', (d) => tiene(d, 'V') || tiene(d, 'H'), 'CADENAS: ↕ se rompe con su columna y ↔ con su fila'],
  ['hueco', (d) => tiene(d, '#'), 'HUECOS: ahí no cabe nada, pero la línea se completa igual'],
  ['raras', (d) => d.raras, 'PIEZAS RARAS: cruces, diagonales y esquinas grandes'],
];

export const PREMIO_ESTRELLAS = [0, 10, 15, 25];   // ladrillos por 1, 2, 3 estrellas (la primera vez)
export const META_ESTRELLAS = 150;                 // premio grande al juntar 150 de las 180
export const PREMIO_META = 500;                    // ladrillos

export const nivelesSuperados = () => (save.aventura.estrellas || []).filter((e) => e > 0).length;
export const estrellasTotales = () => (save.aventura.estrellas || []).reduce((a, b) => a + (b || 0), 0);
export const desbloqueado = (i) => i <= nivelesSuperados();
export const metaLista = () => estrellasTotales() >= META_ESTRELLAS && !save.aventura.meta150;
export function cobrarMeta() {
  if (!metaLista()) return 0;
  save.aventura.meta150 = true;
  save.bricks += PREMIO_META;
  persist();
  return PREMIO_META;
}

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
