// Pozo de la semana de Bloquevilla: reglas puras (sin Phaser) que corren IGUAL en el juego y en el servidor del estudio.
// COPIA EXACTA en DarkShadowDATA/mutantes-wasteland: server/src/pozo/bloquevilla-core.ts (con "// @ts-nocheck" arriba).
// Si cambias una regla aquí, copia el archivo allá en el mismo cambio: el servidor vuelve a jugar cada partida con este código
// y solo cuenta el puntaje si sale igual. Modo clásico sin poderes, sin oro, sin bombas y sin tiempo (solo habilidad).

export const POZO_BQ = { version: 1, N: 8, maxMoves: 3000 };
const N = 8;
const SCORE = { perCell: 1, lines: [0, 80, 200, 360], extraLine: 160, empty: 300 };
const COMBO_GRACE = 3;
const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

// Formas (las mismas del juego normal): [fila, columna]; w = qué tan seguido sale.
const BASE = [
  { c: [[0, 0]], w: 2 },
  { c: [[0, 0], [0, 1]], w: 3 },
  { c: [[0, 0], [1, 0]], w: 3 },
  { c: [[0, 0], [0, 1], [0, 2]], w: 4 },
  { c: [[0, 0], [1, 0], [2, 0]], w: 4 },
  { c: [[0, 0], [0, 1], [0, 2], [0, 3]], w: 3 },
  { c: [[0, 0], [1, 0], [2, 0], [3, 0]], w: 3 },
  { c: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], w: 1 },
  { c: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], w: 1 },
  { c: [[0, 0], [0, 1], [1, 0], [1, 1]], w: 4 },
  { c: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], w: 1 },
  { c: [[0, 0], [1, 0], [1, 1]], w: 3 },
  { c: [[0, 0], [1, 0], [2, 0], [2, 1]], w: 3 },
  { c: [[0, 0], [0, 1], [0, 2], [1, 1]], w: 3 },
  { c: [[0, 1], [0, 2], [1, 0], [1, 1]], w: 2 },
  { c: [[0, 0], [0, 1], [1, 1], [1, 2]], w: 2 },
];
const norm = (cells) => {
  const mr = Math.min(...cells.map((x) => x[0])), mc = Math.min(...cells.map((x) => x[1]));
  return cells.map(([r, c]) => [r - mr, c - mc]);
};
const rotate = (cells) => norm(cells.map(([r, c]) => [c, -r]));
const SHAPES = [];
BASE.forEach((s, i) => {
  if (i >= 11 && i <= 13) { let cur = s.c; for (let k = 0; k < 4; k++) { SHAPES.push({ c: cur, w: s.w / 2 }); cur = rotate(cur); } }
  else SHAPES.push(s);
});
const TOTAL = SHAPES.reduce((a, s) => a + s.w, 0);

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
function randomPiece(rnd) {
  let x = rnd() * TOTAL;
  for (const s of SHAPES) {
    x -= s.w;
    if (x <= 0) return { cells: s.c.map((p) => [...p]), color: COLORS[Math.floor(rnd() * COLORS.length)] };
  }
  return { cells: [[0, 0]], color: COLORS[0] };
}
export function canPlace(board, cells, r, c) {
  for (const [dr, dc] of cells) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= N || cc >= N || board[rr][cc]) return false;
  }
  return true;
}
function anyFit(board, cells) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(board, cells, r, c)) return true;
  return false;
}
function makeTray(board, rnd) {
  let best = null;
  for (let i = 0; i < 40; i++) {
    const tray = [randomPiece(rnd), randomPiece(rnd), randomPiece(rnd)];
    if (tray.some((p) => anyFit(board, p.cells))) return tray;
    best = tray;
  }
  return best;
}
function findLines(board) {
  const rows = [], cols = [];
  for (let r = 0; r < N; r++) if (board[r].every((v) => v)) rows.push(r);
  for (let c = 0; c < N; c++) if (board.every((row) => row[c])) cols.push(c);
  return { rows, cols };
}

/** Partida nueva del Pozo con la semilla que da el servidor. */
export function pozoNew(seed) {
  const g = { seed: String(seed), board: Array.from({ length: N }, () => Array(N).fill(null)), tray: [], trayN: 0,
    score: 0, combo: 0, miss: 0, lines: 0, moves: 0, over: false };
  refill(g);
  return g;
}
function refill(g) {
  const rnd = mulberry32(hash(`${g.seed}:t${g.trayN++}`));
  g.tray = makeTray(g.board, rnd).map((p) => ({ ...p, used: false }));
}

/** Juega la pieza `slot` (0-2) con su esquina en (r, c). Devuelve lo que pasó o null si la jugada no vale. */
export function pozoPlay(g, slot, r, c) {
  if (g.over || g.moves >= POZO_BQ.maxMoves) return null;
  const p = g.tray[slot];
  if (!p || p.used || !Number.isInteger(r) || !Number.isInteger(c) || !canPlace(g.board, p.cells, r, c)) return null;
  p.used = true; g.moves += 1;
  for (const [dr, dc] of p.cells) g.board[r + dr][c + dc] = p.color;
  let pts = p.cells.length * SCORE.perCell;
  const { rows, cols } = findLines(g.board), n = rows.length + cols.length;
  if (n > 0) { g.combo += 1; g.miss = 0; } else { g.miss += 1; if (g.miss >= COMBO_GRACE) g.combo = 0; }
  let empty = false, lineCells = [];
  if (n > 0) {
    const map = new Map();
    rows.forEach((rr) => { for (let cc = 0; cc < N; cc++) map.set(rr * N + cc, [rr, cc]); });
    cols.forEach((cc) => { for (let rr = 0; rr < N; rr++) map.set(rr * N + cc, [rr, cc]); });
    lineCells = [...map.values()];
    for (const [rr, cc] of lineCells) g.board[rr][cc] = null;
    pts += (SCORE.lines[Math.min(n, 3)] + Math.max(0, n - 3) * SCORE.extraLine) * Math.max(1, g.combo);
    g.lines += n;
    if (g.board.every((row) => row.every((v) => !v))) { pts += SCORE.empty; empty = true; }
  }
  g.score += pts;
  if (g.tray.every((t) => t.used)) refill(g);
  if (!g.tray.some((t) => !t.used && anyFit(g.board, t.cells))) g.over = true;
  return { pts, n, combo: g.combo, empty, lineCells, newTray: g.tray.every((t) => !t.used) };
}

/** El servidor vuelve a jugar la partida completa. Devuelve el puntaje o null si alguna jugada no vale. */
export function pozoReplay(seed, moves) {
  if (!Array.isArray(moves) || moves.length > POZO_BQ.maxMoves) return null;
  const g = pozoNew(seed);
  for (const m of moves) {
    if (!Array.isArray(m) || m.length !== 3) return null;
    if (!pozoPlay(g, m[0], m[1], m[2])) return null;
  }
  return { score: g.score, lines: g.lines, moves: g.moves, over: g.over };
}
