// Acertijo del día: tablero armado + 3 piezas fijas; hay que dejar el tablero VACÍO.
// El mismo para todos (sale de la fecha). Se arma hacia atrás desde el tablero vacío, así que siempre tiene solución,
// y se pide que el orden importe (al menos un orden de las piezas no funciona), para que sea acertijo y no trámite.
import { N, COLORS } from './config.js';
import { norm, rotate } from './pieces.js';

export const ACERTIJO_INICIO = '2026-11-20'; // Acertijo #1
export const ACERTIJO_PREMIO = 20;

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

// Piezas del acertijo (se giran): de 2 a 5 cuadritos
const BASE = [
  [[0, 0], [0, 1]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 1], [1, 1], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
];
const FORMAS = [];
BASE.forEach((b) => {
  let c = b;
  for (let k = 0; k < 4; k++) {
    const n = norm(c);
    const key = JSON.stringify([...n].sort());
    if (!FORMAS.some((f) => f.key === key)) FORMAS.push({ key, cells: n });
    c = rotate(c);
  }
});

// Tablero como arreglo de 64 casillas (0/1); líneas = 8 filas + 8 columnas
const LINEAS = [];
for (let i = 0; i < N; i++) {
  LINEAS.push(Array.from({ length: N }, (_, c) => i * N + c));
  LINEAS.push(Array.from({ length: N }, (_, r) => r * N + i));
}
const mascara = (cells, r, c) => {
  const out = [];
  for (const [dr, dc] of cells) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= N || cc >= N) return null;
    out.push(rr * N + cc);
  }
  return out;
};
const lugares = (cells) => {
  const L = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const m = mascara(cells, r, c); if (m) L.push({ r, c, m }); }
  return L;
};
const llenas = (b) => LINEAS.filter((L) => L.every((i) => b[i]));
function colocar(b, m) {
  if (m.some((i) => b[i])) return null;
  const nb = b.slice();
  m.forEach((i) => { nb[i] = 1; });
  const f = llenas(nb);
  f.forEach((L) => L.forEach((i) => { nb[i] = 0; }));
  return { b: nb, n: f.length };
}
const vacio = (b) => b.every((x) => !x);

// ¿Se limpia todo con las piezas en este orden?
function seLimpia(b, piezas) {
  if (!piezas.length) return vacio(b);
  for (const { m } of piezas[0].lug) {
    const x = colocar(b, m);
    if (x && seLimpia(x.b, piezas.slice(1))) return true;
  }
  return false;
}

export function acertijoNumero(fecha) {
  return Math.round((new Date(fecha) - new Date(ACERTIJO_INICIO)) / 864e5) + 1;
}

export function generarAcertijo(fecha) {
  const rnd = mulberry32(hash('acertijo-' + fecha));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  for (let intento = 0; intento < 400; intento++) {
    const formas = [pick(FORMAS), pick(FORMAS), pick(FORMAS)].map((f) => ({ cells: f.cells, lug: lugares(f.cells) }));
    // hacia atrás: el último movimiento deja el tablero vacío
    let S = Array(N * N).fill(0);
    const plan = [];
    let ok = true;
    for (let k = 2; k >= 0 && ok; k--) {
      let hecho = false;
      for (let t = 0; t < 300 && !hecho; t++) {
        const nl = pick([1, 2, 2, 3]);
        const Ls = [];
        while (Ls.length < nl) { const L = pick(LINEAS); if (!Ls.includes(L)) Ls.push(L); }
        const U = new Set(Ls.flat());
        if ([...U].some((i) => S[i])) continue;
        const R = S.slice(); U.forEach((i) => { R[i] = 1; });
        const cand = formas[k].lug.filter(({ m }) => m.every((i) => R[i]) && m.some((i) => U.has(i)));
        if (!cand.length) continue;
        const { r, c, m } = pick(cand);
        const prev = R.slice(); m.forEach((i) => { prev[i] = 0; });
        if (llenas(prev).length) continue;
        const x = colocar(prev, m);
        if (!x || x.b.some((v, i) => v !== S[i])) continue;
        S = prev; plan.unshift({ k, r, c }); hecho = true;
      }
      if (!hecho) ok = false;
    }
    if (!ok) continue;
    const n = S.filter(Boolean).length;
    if (n < 20 || n > 40) continue;
    // que el orden importe: al menos un orden no funciona
    const ordenes = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const sirven = ordenes.filter((o) => seLimpia(S, o.map((i) => formas[i])));
    if (!sirven.length || sirven.length === ordenes.length) continue;
    // la bandeja revuelta para que no se adivine el orden
    const slots = [0, 1, 2].sort(() => rnd() - 0.5);
    const colores = formas.map(() => pick(COLORS));
    const board = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (S[r * N + c] ? pick(COLORS) : null)));
    return {
      tipo: 'acertijo',
      fecha,
      numero: acertijoNumero(fecha),
      board,
      piezas: slots.map((i) => ({ cells: formas[i].cells.map((x) => [...x]), color: colores[i] })),
      solucion: plan.map(({ k, r, c }) => ({ slot: slots.indexOf(k), r, c })),
    };
  }
  throw new Error('No se pudo generar el acertijo de ' + fecha);
}
