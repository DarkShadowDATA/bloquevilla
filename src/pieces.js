import { N, COLORS } from './config.js';

// Formas clásicas del género: [fila, columna]. w = qué tan seguido sale.
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
  { c: [[0, 0], [1, 0], [1, 1]], w: 3 }, // L pequeña
  { c: [[0, 0], [1, 0], [2, 0], [2, 1]], w: 3 }, // L
  { c: [[0, 0], [0, 1], [0, 2], [1, 1]], w: 3 }, // T
  { c: [[0, 1], [0, 2], [1, 0], [1, 1]], w: 2 }, // S
  { c: [[0, 0], [0, 1], [1, 1], [1, 2]], w: 2 }, // Z
];

export function norm(cells) {
  const mr = Math.min(...cells.map((x) => x[0]));
  const mc = Math.min(...cells.map((x) => x[1]));
  return cells.map(([r, c]) => [r - mr, c - mc]);
}

export function rotate(cells) {
  return norm(cells.map(([r, c]) => [c, -r]));
}

// Las L, T y L pequeña salen en cualquiera de sus 4 giros
const SHAPES = [];
BASE.forEach((s, i) => {
  if (i >= 11 && i <= 13) {
    let cur = s.c;
    for (let k = 0; k < 4; k++) {
      SHAPES.push({ c: cur, w: s.w / 2 });
      cur = rotate(cur);
    }
  } else SHAPES.push(s);
});
const TOTAL = SHAPES.reduce((a, s) => a + s.w, 0);

export function size(cells) {
  return {
    rows: Math.max(...cells.map((x) => x[0])) + 1,
    cols: Math.max(...cells.map((x) => x[1])) + 1,
  };
}

export function randomPiece() {
  let x = Math.random() * TOTAL;
  for (const s of SHAPES) {
    x -= s.w;
    if (x <= 0) return { cells: s.c.map((p) => [...p]), color: COLORS[Math.floor(Math.random() * COLORS.length)] };
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

export function anyFit(board, cells) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(board, cells, r, c)) return true;
  return false;
}

// Generador justo: al menos una pieza de la bandeja cabe (si existe alguna forma posible)
export function makeTray(board) {
  let best = null;
  for (let i = 0; i < 40; i++) {
    const tray = [randomPiece(), randomPiece(), randomPiece()];
    if (tray.some((p) => anyFit(board, p.cells))) return tray;
    best = tray;
  }
  return best;
}

export function findLines(board) {
  const rows = [], cols = [];
  for (let r = 0; r < N; r++) if (board[r].every((v) => v)) rows.push(r);
  for (let c = 0; c < N; c++) if (board.every((row) => row[c])) cols.push(c);
  return { rows, cols };
}
