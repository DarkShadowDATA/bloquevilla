// Reto del día: el mismo tablero para todos, generado a partir de la fecha.
// Siempre tiene solución: cada pieza completa sus propias filas, así que funcionan en cualquier orden.
import { N, COLORS } from './config.js';
import { canPlace, findLines, norm, rotate } from './pieces.js';

export const RETO_INICIO = '2026-10-24'; // Reto #1
export const RETO_PREMIO = 15;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Formas que pueden completar filas; sin la de 1x1 para que el reto no sea trivial
const BASE = [
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0]],
];

export function retoNumero(fecha) {
  const d = Math.round((new Date(fecha) - new Date(RETO_INICIO)) / 864e5);
  return d + 1;
}

export function generarReto(fecha) {
  const rnd = mulberry32(hash('bloquevilla-' + fecha));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  for (let intento = 0; intento < 500; intento++) {
    const board = Array.from({ length: N }, () => Array(N).fill(null));
    const ocupadas = new Set();
    const filasUsadas = new Set();
    const piezas = [];
    let ok = true;
    for (let i = 0; i < 3 && ok; i++) {
      let colocada = false;
      for (let t = 0; t < 60 && !colocada; t++) {
        let cells = pick(BASE).map((x) => [...x]);
        const giros = Math.floor(rnd() * 4);
        for (let k = 0; k < giros; k++) cells = rotate(cells);
        cells = norm(cells);
        const rows = Math.max(...cells.map((x) => x[0])) + 1;
        const cols = Math.max(...cells.map((x) => x[1])) + 1;
        const r = Math.floor(rnd() * (N - rows + 1));
        const c = Math.floor(rnd() * (N - cols + 1));
        const filas = new Set(cells.map(([dr]) => r + dr));
        if ([...filas].some((f) => filasUsadas.has(f))) continue;
        if (cells.some(([dr, dc]) => ocupadas.has((r + dr) * N + c + dc))) continue;
        cells.forEach(([dr, dc]) => ocupadas.add((r + dr) * N + c + dc));
        filas.forEach((f) => filasUsadas.add(f));
        piezas.push({ cells, color: pick(COLORS), r, c, filas: [...filas] });
        colocada = true;
      }
      if (!colocada) ok = false;
    }
    if (!ok) continue;
    const meta = filasUsadas.size;
    if (meta < 3 || meta > 5) continue;
    // Llena las filas objetivo menos las casillas de las piezas; el resto con ruido
    for (let r = 0; r < N; r++) {
      if (filasUsadas.has(r)) {
        for (let c = 0; c < N; c++) if (!ocupadas.has(r * N + c)) board[r][c] = pick(COLORS);
      } else {
        for (let c = 0; c < N; c++) if (rnd() < 0.42) board[r][c] = pick(COLORS);
        const llenas = board[r].filter((v) => v).length;
        if (llenas > N - 2) board[r][0] = board[r][N - 1] = null;
      }
    }
    // Verifica que la solución funcione en CUALQUIER orden, sin columnas sorpresa
    const ordenes = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    let valido = true;
    for (const ord of ordenes) {
      const sim = board.map((row) => [...row]);
      for (const k of ord) {
        const p = piezas[k];
        if (!canPlace(sim, p.cells, p.r, p.c)) { valido = false; break; }
        p.cells.forEach(([dr, dc]) => { sim[p.r + dr][p.c + dc] = p.color; });
        const { rows, cols } = findLines(sim);
        if (cols.length || rows.length !== p.filas.length) { valido = false; break; }
        rows.forEach((rr) => { for (let c = 0; c < N; c++) sim[rr][c] = null; });
      }
      if (!valido) break;
    }
    if (!valido) continue;
    // Sin líneas completas al empezar
    const ini = findLines(board);
    if (ini.rows.length || ini.cols.length) continue;
    // Orden de la bandeja revuelto para que no se adivine
    const orden = [0, 1, 2].sort(() => rnd() - 0.5);
    const bandeja = orden.map((i) => piezas[i]);
    return {
      fecha,
      numero: retoNumero(fecha),
      board,
      meta,
      piezas: bandeja.map((p) => ({ cells: p.cells, color: p.color })),
      solucion: bandeja.map((p, slot) => ({ slot, r: p.r, c: p.c })),
    };
  }
  throw new Error('No se pudo generar el reto de ' + fecha);
}
