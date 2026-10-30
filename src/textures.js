// Gráficos de reemplazo dibujados con código.
// Si existe una imagen con el mismo nombre en src/assets/img/, se usa la imagen y esto se salta.
import { CELL, COLORS, HEX, WATER, BUILDINGS, W, H } from './config.js';

export function shade(hex, f) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function starPts(cx, cy, r, inner = 0.45, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
  }
  return pts;
}

function rotRect(cx, cy, w, h, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => ({ x: cx + x * c - y * s, y: cy + x * s + y * c }));
}

function arrowArc(g, cx, cy, r, a0, a1, width, color, ccw = false) {
  g.lineStyle(width, color, 1);
  g.beginPath();
  g.arc(cx, cy, r, a0, a1, ccw);
  g.strokePath();
  const end = a1;
  const px = cx + r * Math.cos(end), py = cy + r * Math.sin(end);
  const dir = ccw ? -1 : 1;
  const tx = -Math.sin(end) * dir, ty = Math.cos(end) * dir;
  const nx = Math.cos(end), ny = Math.sin(end);
  g.fillStyle(color, 1);
  g.fillTriangle(px + tx * width * 1.6, py + ty * width * 1.6, px + nx * width * 1.4, py + ny * width * 1.4, px - nx * width * 1.4, py - ny * width * 1.4);
}

function block(g, s, hex) {
  const r = s * 0.16;
  g.fillStyle(shade(hex, -0.3), 1);
  g.fillRoundedRect(3, 3, s - 6, s - 6, r);
  g.fillStyle(hex, 1);
  g.fillRoundedRect(3, 3, s - 6, s - 6 - s * 0.08, r);
  g.fillStyle(shade(hex, 0.42), 1);
  g.fillRoundedRect(s * 0.15, s * 0.12, s * 0.7, s * 0.12, s * 0.05);
}

function glass(g, s, hex) {
  const r = s * 0.2;
  g.fillStyle(shade(hex, -0.35), 1);
  g.fillRoundedRect(3, 3, s - 6, s - 6, r);
  g.fillStyle(hex, 0.85);
  g.fillRoundedRect(7, 7, s - 14, s - 18, r * 0.8);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(s * 0.68, s * 0.62, s * 0.07);
  g.fillCircle(s * 0.38, s * 0.7, s * 0.045);
  g.fillCircle(s * 0.55, s * 0.4, s * 0.035);
  g.fillStyle(0xffffff, 0.7);
  g.fillRoundedRect(s * 0.16, s * 0.14, s * 0.2, s * 0.32, s * 0.08);
}

function brick(g, cx, cy, w) {
  const h = w * 0.62;
  g.fillStyle(0xd6603c, 1);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, w * 0.12);
  g.lineStyle(Math.max(2, w * 0.06), 0x963c28, 1);
  g.lineBetween(cx - w / 2 + 3, cy, cx + w / 2 - 3, cy);
  g.lineBetween(cx - w * 0.1, cy - h / 2 + 2, cx - w * 0.1, cy);
  g.lineBetween(cx + w * 0.22, cy, cx + w * 0.22, cy + h / 2 - 2);
  g.fillStyle(0xf09070, 1);
  g.fillRoundedRect(cx - w / 2 + w * 0.08, cy - h / 2 + h * 0.1, w * 0.3, h * 0.12, 2);
}

// ---------- Edificios (340x340, el suelo en y = 320) ----------
const BLD = {
  casa: { wall: 0xf6deb2, roof: 0xd6483e },
  panaderia: { wall: 0xf3c99a, roof: 0x9b5a3a },
  pozo: { wall: 0xb8b8c4, roof: 0x9b6a40 },
  herreria: { wall: 0x9a9aa8, roof: 0x4a5068 },
  torre: { wall: 0xcdc8d7, roof: 0x5a5470 },
  plaza: { wall: 0xd9d2c3, roof: 0x4d96ff },
};

function house(g, cx, gy, w, h, wall, roof) {
  g.fillStyle(shade(wall, -0.2), 1);
  g.fillRect(cx - w / 2 - 4, gy - h - 4, w + 8, h + 4);
  g.fillStyle(wall, 1);
  g.fillRect(cx - w / 2, gy - h, w, h);
  g.fillStyle(roof, 1);
  g.fillTriangle(cx - w / 2 - 28, gy - h + 6, cx, gy - h - w * 0.55, cx + w / 2 + 28, gy - h + 6);
  g.fillStyle(shade(roof, -0.25), 1);
  g.fillRect(cx - w / 2 - 28, gy - h, w + 56, 10);
}

function windowPane(g, x, y, s) {
  g.fillStyle(0xffffff, 1);
  g.fillRect(x - s / 2 - 4, y - s / 2 - 4, s + 8, s + 8);
  g.fillStyle(0xffde5f, 1);
  g.fillRect(x - s / 2, y - s / 2, s, s);
  g.fillStyle(0xffffff, 1);
  g.fillRect(x - 2, y - s / 2, 4, s);
}

function building(g, id) {
  const { wall, roof } = BLD[id];
  const gy = 318, cx = 170;
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, gy, 290, 34);
  if (id === 'casa') {
    g.fillStyle(0xaa5040, 1); g.fillRect(cx + 50, gy - 260, 30, 80);
    house(g, cx, gy, 200, 140, wall, roof);
    g.fillStyle(0x8c5834, 1); g.fillRoundedRect(cx - 24, gy - 78, 48, 78, 12);
    windowPane(g, cx - 62, gy - 92, 40); windowPane(g, cx + 62, gy - 92, 40);
  } else if (id === 'panaderia') {
    g.fillStyle(0x8a5038, 1); g.fillRect(cx - 80, gy - 270, 28, 80);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(cx - 66, gy - 285, 14); g.fillCircle(cx - 52, gy - 305, 18);
    house(g, cx, gy, 220, 150, wall, roof);
    for (let i = 0; i < 6; i++) { g.fillStyle(i % 2 ? 0xffffff : 0xe04848, 1); g.fillRect(cx - 120 + i * 40, gy - 112, 40, 34); }
    g.fillStyle(0xe04848, 1); g.fillTriangle(cx - 120, gy - 78, cx + 120, gy - 78, cx, gy - 70);
    windowPane(g, cx - 55, gy - 42, 44);
    g.fillStyle(0xd09040, 1); g.fillEllipse(cx - 55, gy - 34, 34, 16);
    g.fillStyle(0x8c5834, 1); g.fillRoundedRect(cx + 30, gy - 70, 50, 70, 10);
  } else if (id === 'pozo') {
    g.fillStyle(0x7a5030, 1); g.fillRect(cx - 90, gy - 230, 16, 170); g.fillRect(cx + 74, gy - 230, 16, 170);
    g.fillStyle(roof, 1); g.fillTriangle(cx - 125, gy - 210, cx, gy - 290, cx + 125, gy - 210);
    g.fillStyle(shade(roof, -0.3), 1); g.fillRect(cx - 125, gy - 214, 250, 10);
    g.lineStyle(4, 0x5a3a20, 1); g.lineBetween(cx, gy - 205, cx, gy - 150);
    g.fillStyle(0x8a6040, 1); g.fillRect(cx - 18, gy - 150, 36, 30);
    g.fillStyle(0x4d96ff, 1); g.fillRect(cx - 14, gy - 150, 28, 8);
    g.fillStyle(shade(wall, -0.2), 1); g.fillRoundedRect(cx - 110, gy - 100, 220, 100, 18);
    g.fillStyle(wall, 1); g.fillRoundedRect(cx - 104, gy - 96, 208, 88, 16);
    g.fillStyle(0x3a7ad0, 1); g.fillEllipse(cx, gy - 98, 190, 30);
    g.lineStyle(3, shade(wall, -0.25), 1);
    for (let i = 0; i < 4; i++) g.lineBetween(cx - 104, gy - 72 + i * 20, cx + 104, gy - 72 + i * 20);
  } else if (id === 'herreria') {
    g.fillStyle(0x6a6a78, 1); g.fillRect(cx + 50, gy - 270, 34, 90);
    house(g, cx, gy, 230, 150, wall, roof);
    g.fillStyle(0x3a3a48, 1); g.fillRoundedRect(cx - 90, gy - 110, 90, 90, 40);
    g.fillStyle(0xff8a2b, 1); g.fillCircle(cx - 45, gy - 50, 30);
    g.fillStyle(0xffd23f, 1); g.fillCircle(cx - 45, gy - 46, 16);
    g.fillStyle(0x50505c, 1);
    g.fillRect(cx + 30, gy - 62, 90, 22); g.fillRect(cx + 55, gy - 40, 40, 40); g.fillTriangle(cx + 120, gy - 62, cx + 145, gy - 62, cx + 120, gy - 45);
  } else if (id === 'torre') {
    g.lineStyle(6, 0x5a4030, 1); g.lineBetween(cx, gy - 330, cx, gy - 270);
    g.fillStyle(0xe63c46, 1); g.fillTriangle(cx, gy - 335, cx + 60, gy - 318, cx, gy - 300);
    g.fillStyle(shade(wall, -0.2), 1); g.fillRect(cx - 74, gy - 272, 148, 272);
    g.fillStyle(wall, 1); g.fillRect(cx - 68, gy - 268, 136, 268);
    for (let i = 0; i < 3; i++) { g.fillStyle(wall, 1); g.fillRect(cx - 74 + i * 56, gy - 300, 36, 32); }
    g.fillStyle(0xffde5f, 1); g.fillRoundedRect(cx - 22, gy - 210, 44, 70, 22);
    g.fillStyle(shade(wall, -0.35), 1); g.fillRoundedRect(cx - 32, gy - 80, 64, 80, 30);
    g.lineStyle(3, shade(wall, -0.15), 1);
    for (let i = 1; i < 8; i++) g.lineBetween(cx - 68, gy - i * 34, cx + 68, gy - i * 34);
  } else if (id === 'plaza') {
    g.fillStyle(0xe8dcc8, 1); g.fillEllipse(cx, gy - 20, 320, 70);
    g.fillStyle(shade(wall, -0.2), 1); g.fillEllipse(cx, gy - 40, 250, 60); g.fillRect(cx - 125, gy - 80, 250, 40);
    g.fillStyle(wall, 1); g.fillEllipse(cx, gy - 80, 250, 60);
    g.fillStyle(0x4d96ff, 1); g.fillEllipse(cx, gy - 82, 220, 46);
    g.fillStyle(wall, 1); g.fillRect(cx - 14, gy - 180, 28, 100);
    g.fillStyle(0x7ec8ff, 1); g.fillEllipse(cx, gy - 190, 70, 26);
    g.fillStyle(0xa0dcff, 1); g.fillCircle(cx - 30, gy - 150, 8); g.fillCircle(cx + 30, gy - 150, 8); g.fillCircle(cx, gy - 205, 10);
    [[-140, 0xf15bb5], [140, 0xffd93d], [-100, 0xff5a5f], [100, 0x9b5de5]].forEach(([dx, c]) => {
      g.fillStyle(0x4caf50, 1); g.fillCircle(cx + dx, gy - 22, 18);
      g.fillStyle(c, 1); g.fillCircle(cx + dx, gy - 30, 9);
    });
    [-150, 150].forEach((dx) => {
      g.fillStyle(0x3a3a48, 1); g.fillRect(cx + dx - 4, gy - 170, 8, 150);
      g.fillStyle(0xffde5f, 1); g.fillCircle(cx + dx, gy - 176, 14);
    });
  }
}

function ruin(g, id) {
  const { wall } = BLD[id];
  const gy = 318, cx = 170;
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, gy, 290, 34);
  const dark = shade(wall, -0.35);
  g.fillStyle(dark, 1);
  g.fillPoints([{ x: cx - 110, y: gy }, { x: cx - 110, y: gy - 120 }, { x: cx - 80, y: gy - 95 }, { x: cx - 60, y: gy - 140 }, { x: cx - 30, y: gy - 70 }, { x: cx, y: gy - 85 }, { x: cx + 20, y: gy }], true);
  g.fillPoints([{ x: cx + 50, y: gy }, { x: cx + 60, y: gy - 70 }, { x: cx + 85, y: gy - 50 }, { x: cx + 105, y: gy - 95 }, { x: cx + 115, y: gy }], true);
  const stones = [[-120, -12, 30], [-70, -8, 24], [-20, -14, 34], [30, -10, 26], [80, -12, 30], [125, -8, 22], [-45, -38, 22], [10, -42, 26], [60, -36, 20], [-95, -34, 18]];
  stones.forEach(([dx, dy, s]) => {
    g.fillStyle(0x6e6a68, 1); g.fillRoundedRect(cx + dx - s, gy + dy - s * 0.6 + 4, s * 2, s * 1.2, 8);
    g.fillStyle(0x9a9592, 1); g.fillRoundedRect(cx + dx - s, gy + dy - s * 0.6, s * 2, s * 1.2, 8);
  });
  g.fillStyle(0x8c6a48, 1);
  g.fillPoints(rotRect(cx - 10, gy - 60, 160, 14, -0.35), true);
  g.fillPoints(rotRect(cx + 60, gy - 30, 110, 12, 0.5), true);
}

// ---------- Iconos de poderes (192x192) ----------
function powerIcon(g, id) {
  const c = 96;
  if (id === 'martillo') {
    g.fillStyle(0x9b6a40, 1); g.fillPoints(rotRect(c + 10, c + 20, 26, 130, -0.6), true);
    g.fillStyle(0x7a8090, 1); g.fillPoints(rotRect(c - 22, c - 26, 100, 52, -0.6), true);
    g.fillStyle(0xb8c0cc, 1); g.fillPoints(rotRect(c - 28, c - 34, 84, 18, -0.6), true);
  } else if (id === 'girar') {
    g.fillStyle(0x4d96ff, 1); g.fillRoundedRect(c - 30, c - 30, 28, 28, 6); g.fillRoundedRect(c - 30, c + 2, 28, 28, 6); g.fillRoundedRect(c + 2, c + 2, 28, 28, 6);
    arrowArc(g, c, c, 66, -2.6, 1.4, 12, 0x2bb5a0);
  } else if (id === 'cambio') {
    [[c - 50, 0xff5a5f], [c, 0xffd93d], [c + 50, 0x6bcb77]].forEach(([x, col]) => { g.fillStyle(col, 1); g.fillRoundedRect(x - 18, c - 18, 36, 36, 8); });
    arrowArc(g, c, c + 6, 70, -2.7, -0.45, 10, 0x2bb5a0);
    arrowArc(g, c, c - 6, 70, 0.45, 2.7, 10, 0x2bb5a0);
  } else if (id === 'bomba') {
    g.fillStyle(0x2a2a36, 1); g.fillCircle(c - 6, c + 14, 58);
    g.fillStyle(0x555566, 1); g.fillCircle(c - 26, c - 6, 16);
    g.fillStyle(0x444450, 1); g.fillRect(c + 18, c - 52, 28, 22);
    g.lineStyle(6, 0x9b6a40, 1); g.lineBetween(c + 32, c - 52, c + 52, c - 72);
    g.fillStyle(0xffd23f, 1); g.fillPoints(starPts(c + 56, c - 76, 22, 0.4, 6), true);
    g.fillStyle(0xff8a2b, 1); g.fillCircle(c + 56, c - 76, 8);
  } else if (id === 'comodin') {
    g.fillStyle(0x6a3ab8, 1); g.fillRoundedRect(c - 56, c - 52, 112, 112, 22);
    g.fillStyle(0x9b5de5, 1); g.fillRoundedRect(c - 56, c - 56, 112, 104, 22);
    g.fillStyle(0xffd93d, 1); g.fillPoints(starPts(c, c - 4, 40), true);
  } else if (id === 'rayo') {
    g.fillStyle(0xc89a10, 1);
    g.fillPoints([{ x: c + 22, y: 14 }, { x: c - 42, y: c + 10 }, { x: c - 2, y: c + 10 }, { x: c - 22, y: 180 }, { x: c + 46, y: c - 14 }, { x: c + 6, y: c - 14 }], true);
    g.fillStyle(0xffd93d, 1);
    g.fillPoints([{ x: c + 18, y: 20 }, { x: c - 34, y: c + 4 }, { x: c + 4, y: c + 4 }, { x: c - 16, y: 168 }, { x: c + 38, y: c - 8 }, { x: c + 2, y: c - 8 }], true);
  } else if (id === 'deshacer') {
    arrowArc(g, c, c + 8, 56, 0.2, -3.0, 16, 0x4d96ff, true);
  } else if (id === 'doble') {
    brick(g, c - 10, c + 30, 110); brick(g, c + 10, c - 20, 110);
    g.fillStyle(0xffd93d, 1); g.fillPoints(starPts(c + 60, c - 60, 26), true);
  } else if (id === 'segunda') {
    g.fillStyle(0xffffff, 1); g.fillEllipse(c - 62, c - 6, 60, 34); g.fillEllipse(c + 62, c - 6, 60, 34);
    g.fillStyle(0xe63c58, 1); g.fillCircle(c - 24, c - 14, 32); g.fillCircle(c + 24, c - 14, 32);
    g.fillTriangle(c - 54, c, c + 54, c, c, c + 64);
    g.fillStyle(0xff8aa0, 1); g.fillCircle(c - 32, c - 24, 10);
  }
}

// ---------- Cartas (300x430) ----------
function card(g, color, back = false) {
  g.fillStyle(shade(color, -0.45), 1); g.fillRoundedRect(0, 10, 300, 420, 30);
  if (back) {
    g.fillStyle(0x5a2a82, 1); g.fillRoundedRect(0, 0, 300, 420, 30);
    g.lineStyle(8, 0xdcb4ff, 1); g.strokeRoundedRect(8, 8, 284, 404, 24);
    g.fillStyle(0xffd23f, 1); g.fillPoints(starPts(150, 210, 70), true);
    return;
  }
  g.fillStyle(0xfff8ee, 1); g.fillRoundedRect(0, 0, 300, 420, 30);
  g.lineStyle(10, color, 1); g.strokeRoundedRect(5, 5, 290, 410, 26);
  g.fillStyle(color, 1); g.fillRoundedRect(0, 0, 300, 70, { tl: 30, tr: 30, bl: 0, br: 0 });
  g.fillStyle(shade(color, 0.75), 1); g.fillCircle(150, 165, 80);
}

// ---------- Iconos de interfaz (128x128) ----------
function uiIcon(g, id) {
  const c = 64;
  if (id === 'ladrillo') brick(g, c, c, 100);
  else if (id === 'estrella') { g.fillStyle(0xd28c14, 1); g.fillPoints(starPts(c, c + 5, 56), true); g.fillStyle(0xffcd32, 1); g.fillPoints(starPts(c, c, 56), true); }
  else if (id === 'candado') {
    g.lineStyle(14, 0xb4b4c0, 1); g.beginPath(); g.arc(c, c - 10, 28, Math.PI, 0); g.strokePath();
    g.lineBetween(c - 28, c - 10, c - 28, c + 6); g.lineBetween(c + 28, c - 10, c + 28, c + 6);
    g.fillStyle(0xbe8214, 1); g.fillRoundedRect(c - 44, c - 2, 88, 64, 14);
    g.fillStyle(0xfabe28, 1); g.fillRoundedRect(c - 44, c - 6, 88, 62, 14);
    g.fillStyle(0x785010, 1); g.fillCircle(c, c + 22, 9);
  } else if (id === 'regalo') {
    g.fillStyle(0xd84a5a, 1); g.fillRoundedRect(c - 48, c - 14, 96, 70, 10);
    g.fillStyle(0xff6b7d, 1); g.fillRoundedRect(c - 54, c - 34, 108, 28, 8);
    g.fillStyle(0xffd23f, 1); g.fillRect(c - 9, c - 34, 18, 90);
    g.fillEllipse(c - 22, c - 44, 40, 24); g.fillEllipse(c + 22, c - 44, 40, 24);
  } else if (id === 'trofeo') {
    g.fillStyle(0xfabe28, 1); g.fillRoundedRect(c - 38, c - 50, 76, 60, { tl: 6, tr: 6, bl: 34, br: 34 });
    g.lineStyle(9, 0xfabe28, 1); g.strokeCircle(c - 40, c - 26, 16); g.strokeCircle(c + 40, c - 26, 16);
    g.fillStyle(0xd29614, 1); g.fillRect(c - 8, c + 8, 16, 26); g.fillRoundedRect(c - 32, c + 32, 64, 18, 6);
  } else if (id === 'ajustes') {
    g.fillStyle(0xdcdcf0, 1);
    for (let i = 0; i < 8; i++) g.fillPoints(rotRect(c + Math.cos((i * Math.PI) / 4) * 40, c + Math.sin((i * Math.PI) / 4) * 40, 22, 22, (i * Math.PI) / 4), true);
    g.fillCircle(c, c, 40);
    g.fillStyle(0x2a2e5a, 1); g.fillCircle(c, c, 16);
  } else if (id === 'sonido') {
    g.fillStyle(0xdcdcf0, 1);
    g.fillRect(c - 46, c - 16, 26, 32);
    g.fillTriangle(c - 22, c - 16, c + 10, c - 42, c + 10, c + 42); g.fillTriangle(c - 22, c - 16, c - 22, c + 16, c + 10, c + 42);
    g.lineStyle(7, 0xdcdcf0, 1); g.beginPath(); g.arc(c + 14, c, 24, -0.8, 0.8); g.strokePath();
    g.beginPath(); g.arc(c + 14, c, 42, -0.8, 0.8); g.strokePath();
  } else if (id === 'musica') {
    g.fillStyle(0xdcdcf0, 1);
    g.fillEllipse(c - 22, c + 34, 40, 30); g.fillEllipse(c + 30, c + 24, 40, 30);
    g.fillRect(c - 6, c - 44, 9, 80); g.fillRect(c + 46, c - 54, 9, 80);
    g.fillPoints([{ x: c - 6, y: c - 44 }, { x: c + 55, y: c - 54 }, { x: c + 55, y: c - 34 }, { x: c - 6, y: c - 24 }], true);
  }
}

function gradient(scene, key, top, bottom) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, top);
  grd.addColorStop(1, bottom);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  tex.refresh();
}


// ---------- Día de Muertos (reemplazables por imágenes) ----------
const MUERTOS = [0xff5fa8, 0xff9a1f, 0x9b5de5, 0xffc93d];

function muertosBlock(g, s, i) {
  block(g, s, MUERTOS[i]);
  const c = s / 2, k = s / 110;
  if (i === 0) { // calaverita
    g.fillStyle(0xffffff, 1); g.fillCircle(c, c - 4 * k, 30 * k); g.fillRoundedRect(c - 18 * k, c + 8 * k, 36 * k, 22 * k, 6 * k);
    g.fillStyle(0x3a1240, 1); g.fillCircle(c - 11 * k, c - 6 * k, 8 * k); g.fillCircle(c + 11 * k, c - 6 * k, 8 * k);
    g.fillTriangle(c, c + 2 * k, c - 4 * k, c + 9 * k, c + 4 * k, c + 9 * k);
    for (let t = -2; t <= 2; t++) g.fillRect(c + t * 7 * k - 1 * k, c + 16 * k, 2 * k, 12 * k);
    g.fillStyle(0xff9a1f, 1); g.fillCircle(c - 11 * k, c - 6 * k, 3 * k); g.fillCircle(c + 11 * k, c - 6 * k, 3 * k);
  } else if (i === 1) { // cempasúchil
    for (let a = 0; a < 10; a++) {
      const an = (a / 10) * Math.PI * 2;
      g.fillStyle(a % 2 ? 0xffd23f : 0xffb21f, 1);
      g.fillCircle(c + Math.cos(an) * 18 * k, c + Math.sin(an) * 18 * k, 11 * k);
    }
    g.fillStyle(0xc85a00, 1); g.fillCircle(c, c, 10 * k);
  } else if (i === 2) { // papel picado
    g.fillStyle(0xffffff, 0.85);
    g.fillTriangle(c - 26 * k, c - 18 * k, c - 14 * k, c - 18 * k, c - 20 * k, c - 6 * k);
    g.fillTriangle(c + 26 * k, c - 18 * k, c + 14 * k, c - 18 * k, c + 20 * k, c - 6 * k);
    g.fillCircle(c, c - 4 * k, 9 * k); g.fillCircle(c - 20 * k, c + 16 * k, 6 * k); g.fillCircle(c + 20 * k, c + 16 * k, 6 * k);
    g.fillRect(c - 3 * k, c + 10 * k, 6 * k, 16 * k);
  } else { // vela
    g.fillStyle(0xfff4e0, 1); g.fillRoundedRect(c - 10 * k, c - 4 * k, 20 * k, 34 * k, 4 * k);
    g.fillStyle(0xff7a1f, 1); g.fillCircle(c, c - 14 * k, 9 * k); g.fillTriangle(c - 7 * k, c - 15 * k, c + 7 * k, c - 15 * k, c, c - 32 * k);
    g.fillStyle(0xffe680, 1); g.fillCircle(c, c - 12 * k, 4 * k);
  }
}

function flor(g, cx, cy, r) {
  for (let a = 0; a < 12; a++) {
    const an = (a / 12) * Math.PI * 2;
    g.fillStyle(a % 2 ? 0xffc21f : 0xff9a0f, 1);
    g.fillCircle(cx + Math.cos(an) * r * 0.55, cy + Math.sin(an) * r * 0.55, r * 0.42);
  }
  g.fillStyle(0xffd84a, 1); g.fillCircle(cx, cy, r * 0.42);
  g.fillStyle(0xc85a00, 1); g.fillCircle(cx, cy, r * 0.2);
}

function papelPicado(g, w, h) {
  const cols = [0xff5fa8, 0xff9a1f, 0x9b5de5, 0x6bcb77, 0x4d96ff, 0xffc93d];
  g.lineStyle(4, 0x5a3a2a, 1); g.lineBetween(0, 40, w, 40);
  const n = 6, fw = w / n;
  for (let i = 0; i < n; i++) {
    const x = i * fw + fw * 0.08, ww = fw * 0.84;
    g.fillStyle(cols[i % cols.length], 1);
    g.fillRect(x, 40, ww, h * 0.62);
    g.fillTriangle(x, 40 + h * 0.62, x + ww, 40 + h * 0.62, x + ww / 2, 40 + h * 0.8);
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(x + ww / 2, 40 + h * 0.3, ww * 0.14);
    g.fillTriangle(x + ww * 0.15, 40 + h * 0.12, x + ww * 0.35, 40 + h * 0.12, x + ww * 0.25, 40 + h * 0.26);
    g.fillTriangle(x + ww * 0.65, 40 + h * 0.12, x + ww * 0.85, 40 + h * 0.12, x + ww * 0.75, 40 + h * 0.26);
  }
}

function ofrenda(g) {
  const cx = 170, gy = 318;
  g.fillStyle(0x000000, 0.12); g.fillEllipse(cx, gy, 280, 30);
  g.fillStyle(0x7a4a2a, 1); g.fillRect(cx - 120, gy - 80, 240, 80); g.fillRect(cx - 80, gy - 150, 160, 70);
  g.fillStyle(0xb06a3a, 1); g.fillRect(cx - 124, gy - 88, 248, 12); g.fillRect(cx - 84, gy - 158, 168, 12);
  g.fillStyle(0xff5fa8, 1); g.fillTriangle(cx - 124, gy - 76, cx - 60, gy - 76, cx - 92, gy - 50);
  g.fillStyle(0x9b5de5, 1); g.fillTriangle(cx - 60, gy - 76, cx + 4, gy - 76, cx - 28, gy - 50);
  g.fillStyle(0xff9a1f, 1); g.fillTriangle(cx + 4, gy - 76, cx + 68, gy - 76, cx + 36, gy - 50);
  g.fillStyle(0x6bcb77, 1); g.fillTriangle(cx + 68, gy - 76, cx + 124, gy - 76, cx + 96, gy - 50);
  [[-60, -160], [60, -160], [-100, -90], [100, -90]].forEach(([dx, dy]) => {
    g.fillStyle(0xfff4e0, 1); g.fillRect(cx + dx - 7, gy + dy - 34, 14, 34);
    g.fillStyle(0xff7a1f, 1); g.fillCircle(cx + dx, gy + dy - 42, 8);
  });
  g.fillStyle(0xffffff, 1); g.fillCircle(cx, gy - 185, 22); g.fillStyle(0x3a1240, 1); g.fillCircle(cx - 8, gy - 188, 5); g.fillCircle(cx + 8, gy - 188, 5);
  flor(g, cx - 30, gy - 100, 18); flor(g, cx + 30, gy - 100, 18); flor(g, cx - 140, gy - 10, 20); flor(g, cx + 140, gy - 10, 20);
  g.fillStyle(0xd08a3a, 1); g.fillEllipse(cx, gy - 168, 50, 22);
}


// ---------- Tienda: temas y decoraciones (si existe una imagen con el mismo nombre, se usa la imagen) ----------
function neonBlock(g, s, hex) {
  const r = s * 0.18;
  g.fillStyle(0x0b0b22, 1); g.fillRoundedRect(4, 4, s - 8, s - 8, r);
  g.fillStyle(hex, 0.16); g.fillRoundedRect(10, 10, s - 20, s - 20, r * 0.8);
  g.lineStyle(14, hex, 0.25); g.strokeRoundedRect(10, 10, s - 20, s - 20, r * 0.8);
  g.lineStyle(6, hex, 1); g.strokeRoundedRect(12, 12, s - 24, s - 24, r * 0.75);
  g.lineStyle(2, shade(hex, 0.7), 1); g.strokeRoundedRect(13, 13, s - 26, s - 26, r * 0.7);
  g.fillStyle(shade(hex, 0.6), 0.9); g.fillCircle(s * 0.3, s * 0.28, s * 0.045);
}

function carameloBlock(g, s, hex) {
  const r = s * 0.24;
  g.fillStyle(shade(hex, -0.3), 1); g.fillRoundedRect(3, 5, s - 6, s - 6, r);
  g.fillStyle(shade(hex, 0.15), 1); g.fillRoundedRect(3, 3, s - 6, s - 10, r);
  g.fillStyle(0xffffff, 0.55);
  for (let k = -2; k < 4; k++) {
    const x = k * s * 0.3;
    g.fillPoints([{ x: x + s * 0.12, y: s - 8 }, { x: x + s * 0.27, y: s - 8 }, { x: x + s * 0.27 + s * 0.6, y: 6 }, { x: x + s * 0.12 + s * 0.6, y: 6 }], true);
  }
  g.fillStyle(shade(hex, -0.3), 1);
  g.fillRect(0, 0, 3, s); g.fillRect(s - 3, 0, 3, s);
  g.lineStyle(6, shade(hex, 0.35), 1); g.strokeRoundedRect(6, 6, s - 12, s - 16, r * 0.85);
  g.fillStyle(0xffffff, 0.8); g.fillEllipse(s * 0.32, s * 0.24, s * 0.3, s * 0.1);
}

function farola(g, w, h) {
  const cx = w / 2;
  g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, h - 8, w * 0.7, 14);
  g.fillStyle(0x3a3448, 1); g.fillRect(cx - 7, h * 0.28, 14, h * 0.7);
  g.fillRoundedRect(cx - 20, h - 26, 40, 20, 6);
  g.fillStyle(0xffd76a, 0.28); g.fillCircle(cx, h * 0.2, w * 0.46);
  g.fillStyle(0x3a3448, 1); g.fillTriangle(cx - 30, h * 0.12, cx + 30, h * 0.12, cx, h * 0.03);
  g.fillStyle(0xfff0b0, 1); g.fillRoundedRect(cx - 20, h * 0.12, 40, h * 0.14, 8);
  g.fillStyle(0x3a3448, 1); g.fillRect(cx - 24, h * 0.26, 48, 8);
}

function arbol(g, w, h) {
  const cx = w / 2;
  g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, h - 10, w * 0.7, 22);
  g.fillStyle(0x8a5a32, 1); g.fillRoundedRect(cx - 14, h * 0.55, 28, h * 0.43, 8);
  [[0, 0.36, 0.3, 0x4f9e3c], [-0.2, 0.46, 0.24, 0x5cae45], [0.2, 0.46, 0.24, 0x5cae45], [0, 0.24, 0.24, 0x6ec452], [-0.1, 0.3, 0.12, 0x86d866]].forEach(([dx, dy, rr, col]) => {
    g.fillStyle(col, 1); g.fillCircle(cx + dx * w, dy * h, rr * w);
  });
  g.fillStyle(0xff5a5f, 1); [[-0.15, 0.4], [0.18, 0.34], [0.05, 0.5]].forEach(([dx, dy]) => g.fillCircle(cx + dx * w, dy * h, w * 0.035));
}

function jardin(g, w, h) {
  g.fillStyle(0x3f8a34, 1); g.fillEllipse(w / 2, h * 0.72, w * 0.92, h * 0.42);
  g.fillStyle(0x56a845, 1); g.fillEllipse(w / 2, h * 0.66, w * 0.8, h * 0.32);
  const cols = [0xff5f8f, 0xffd23f, 0xffffff, 0xb46cff, 0xff8a2b];
  for (let i = 0; i < 9; i++) {
    const x = w * (0.16 + (i % 5) * 0.17), y = h * (0.52 + Math.floor(i / 5) * 0.16) + (i % 2) * 6;
    const col = cols[i % cols.length];
    g.fillStyle(col, 1);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.fillCircle(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 10); }
    g.fillStyle(0xffe066, 1); g.fillCircle(x, y, 7);
  }
}

function fuente(g, w, h) {
  const cx = w / 2;
  g.fillStyle(0x000000, 0.2); g.fillEllipse(cx, h - 14, w * 0.95, 34);
  g.fillStyle(0x9a94a8, 1); g.fillEllipse(cx, h * 0.78, w * 0.92, h * 0.24);
  g.fillStyle(0xbab4c8, 1); g.fillRect(cx - w * 0.46, h * 0.66, w * 0.92, h * 0.12);
  g.fillStyle(0xd0cade, 1); g.fillEllipse(cx, h * 0.66, w * 0.92, h * 0.16);
  g.fillStyle(0x5ab8ee, 1); g.fillEllipse(cx, h * 0.665, w * 0.78, h * 0.11);
  g.fillStyle(0xbab4c8, 1); g.fillRect(cx - 12, h * 0.36, 24, h * 0.3);
  g.fillStyle(0xd0cade, 1); g.fillEllipse(cx, h * 0.37, w * 0.4, h * 0.07);
  g.fillStyle(0x8fd8ff, 0.9);
  [[-1], [1]].forEach(([d]) => {
    for (let k = 0; k < 7; k++) g.fillCircle(cx + d * (w * 0.06 + k * w * 0.04), h * (0.3 + k * k * 0.008), 7 - k * 0.5);
  });
  g.fillStyle(0xbfeaff, 1); g.fillEllipse(cx, h * 0.22, 26, 60);
}

function banderines(g, w, h) {
  g.lineStyle(5, 0x5a3a2a, 1);
  g.beginPath();
  const pts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push({ x: 10 + t * (w - 20), y: 20 + Math.sin(t * Math.PI) * h * 0.25 }); }
  g.strokePoints(pts);
  const cols = [0xff5a5f, 0xffd23f, 0x4d96ff, 0x6bcb77, 0xff8a2b, 0xb46cff];
  for (let i = 0; i < 11; i++) {
    const t = (i + 0.5) / 11, x = 10 + t * (w - 20), y = 20 + Math.sin(t * Math.PI) * h * 0.25;
    g.fillStyle(cols[i % cols.length], 1);
    g.fillTriangle(x - w * 0.035, y, x + w * 0.035, y, x, y + h * 0.5);
  }
}

function tiendaIcon(g, s) {
  g.fillStyle(0xfff3d6, 1); g.fillRoundedRect(s * 0.16, s * 0.42, s * 0.68, s * 0.46, 10);
  g.fillStyle(0x8a5a32, 1); g.fillRoundedRect(s * 0.4, s * 0.6, s * 0.2, s * 0.28, 6);
  for (let k = 0; k < 5; k++) {
    g.fillStyle(k % 2 ? 0xffffff : 0xff5a5f, 1);
    const x = s * (0.1 + k * 0.16);
    g.fillRect(x, s * 0.2, s * 0.16, s * 0.18);
    g.fillCircle(x + s * 0.08, s * 0.38, s * 0.08);
  }
  g.fillStyle(0x3a3448, 1); g.fillRect(s * 0.1, s * 0.16, s * 0.8, s * 0.06);
}

// ---------- Bloques peligrosos ----------
function hielo(g, s, roto) {
  const r = s * 0.18;
  g.fillStyle(0x4f9fd6, 1); g.fillRoundedRect(3, 4, s - 6, s - 6, r);
  g.fillStyle(0xbfe9ff, 1); g.fillRoundedRect(3, 3, s - 6, s - 12, r);
  g.fillStyle(0xe8f8ff, 0.9); g.fillRoundedRect(10, 9, s - 20, s - 26, r * 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillPoints([{ x: s * 0.2, y: s * 0.62 }, { x: s * 0.62, y: s * 0.2 }, { x: s * 0.72, y: s * 0.2 }, { x: s * 0.3, y: s * 0.62 }], true);
  g.fillPoints([{ x: s * 0.42, y: s * 0.74 }, { x: s * 0.8, y: s * 0.36 }, { x: s * 0.84, y: s * 0.42 }, { x: s * 0.48, y: s * 0.78 }], true);
  g.fillStyle(0x9fd6f5, 1);
  [[0.25, 0.25], [0.75, 0.7], [0.3, 0.8], [0.7, 0.3]].forEach(([x, y]) => g.fillCircle(s * x, s * y, s * 0.03));
  if (roto) {
    g.lineStyle(5, 0x2f6f9f, 1);
    g.strokePoints([{ x: s * 0.12, y: s * 0.3 }, { x: s * 0.38, y: s * 0.45 }, { x: s * 0.5, y: s * 0.38 }, { x: s * 0.7, y: s * 0.62 }, { x: s * 0.9, y: s * 0.68 }]);
    g.strokePoints([{ x: s * 0.5, y: s * 0.38 }, { x: s * 0.55, y: s * 0.12 }]);
    g.strokePoints([{ x: s * 0.38, y: s * 0.45 }, { x: s * 0.3, y: s * 0.86 }]);
    g.lineStyle(2, 0xffffff, 0.9);
    g.strokePoints([{ x: s * 0.12, y: s * 0.28 }, { x: s * 0.38, y: s * 0.43 }, { x: s * 0.5, y: s * 0.36 }, { x: s * 0.7, y: s * 0.6 }]);
  }
}

function bombaTile(g, s) {
  const r = s * 0.18;
  g.fillStyle(0x4a1424, 1); g.fillRoundedRect(3, 4, s - 6, s - 6, r);
  g.fillStyle(0x7a2236, 1); g.fillRoundedRect(3, 3, s - 6, s - 12, r);
  g.fillStyle(0x1c1626, 1); g.fillCircle(s * 0.47, s * 0.56, s * 0.3);
  g.fillStyle(0x3a3448, 1); g.fillCircle(s * 0.42, s * 0.5, s * 0.22);
  g.fillStyle(0xffffff, 0.75); g.fillEllipse(s * 0.36, s * 0.44, s * 0.12, s * 0.07);
  g.fillStyle(0x6b6478, 1); g.fillRoundedRect(s * 0.56, s * 0.22, s * 0.14, s * 0.12, 3);
  g.lineStyle(5, 0xc89a5a, 1);
  g.strokePoints([{ x: s * 0.64, y: s * 0.24 }, { x: s * 0.72, y: s * 0.13 }, { x: s * 0.8, y: s * 0.16 }]);
  g.fillStyle(0xffd23f, 1); g.fillPoints(starPts(s * 0.82, s * 0.14, s * 0.1, 0.4, 5), true);
  g.fillStyle(0xff7a1f, 1); g.fillCircle(s * 0.82, s * 0.14, s * 0.035);
}

// Bloque dorado: se arma sobre el bloque amarillo (imagen o dibujo) con brillo de oro y una estrella
function makeOro(scene) {
  const T = scene.textures;
  if (T.exists('block_gold')) return;
  const src = T.get('block_yellow').getSourceImage();
  const s = Math.max(src.width, src.height);
  const ct = T.createCanvas('block_gold', s, s);
  const ctx = ct.getContext();
  ctx.drawImage(src, 0, 0, s, s);
  ctx.globalCompositeOperation = 'source-atop';
  const gr = ctx.createLinearGradient(0, 0, s, s);
  gr.addColorStop(0, 'rgba(255,248,190,0.65)');
  gr.addColorStop(0.45, 'rgba(255,196,40,0.45)');
  gr.addColorStop(1, 'rgba(190,110,0,0.55)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, s, s);
  ctx.globalCompositeOperation = 'source-over';
  const pts = starPts(s / 2, s / 2 + s * 0.02, s * 0.27, 0.45, 5);
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = '#fff7cc';
  ctx.strokeStyle = '#b06a00';
  ctx.lineWidth = s * 0.045;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(s * 0.3, s * 0.22, s * 0.12, s * 0.05, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ct.refresh();
}

export function makeTextures(scene) {
  const T = scene.textures;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const gen = (key, w, h, draw) => {
    if (T.exists(key)) return;
    g.clear();
    draw(g, w, h);
    g.generateTexture(key, w, h);
  };
  COLORS.forEach((c) => gen('block_' + c, CELL, CELL, (gg, s) => block(gg, s, HEX[c])));
  WATER.forEach((hex, i) => gen('water_' + (i + 1), CELL, CELL, (gg, s) => glass(gg, s, hex)));
  MUERTOS.forEach((hex, i) => gen('muertos_' + (i + 1), CELL, CELL, (gg, s) => muertosBlock(gg, s, i)));
  gen('ui_flor', 128, 128, (gg) => flor(gg, 64, 64, 56));
  gen('deco_papel_picado', 900, 260, (gg, w, h) => papelPicado(gg, w, h));
  gen('deco_ofrenda', 340, 340, (gg) => ofrenda(gg));
  gen('evento_marco', 900, 260, (gg, w, h) => {
    gg.fillStyle(0x2a1240, 0.95); gg.fillRoundedRect(10, 10, w - 20, h - 20, 40);
    gg.lineStyle(10, 0xff9a1f, 1); gg.strokeRoundedRect(10, 10, w - 20, h - 20, 40);
    flor(gg, 50, 50, 34); flor(gg, w - 50, 50, 34); flor(gg, 50, h - 50, 34); flor(gg, w - 50, h - 50, 34);
  });
  BUILDINGS.forEach((b) => {
    gen('bld_' + b.id, 340, 340, (gg) => building(gg, b.id));
    gen('bld_' + b.id + '_ruina', 340, 340, (gg) => ruin(gg, b.id));
  });
  ['martillo', 'girar', 'cambio', 'bomba', 'comodin', 'rayo', 'deshacer', 'doble', 'segunda'].forEach((id) => gen('pw_' + id, 192, 192, (gg) => powerIcon(gg, id)));
  gen('card_comun', 300, 430, (gg) => card(gg, 0x6e8caa));
  gen('card_raro', 300, 430, (gg) => card(gg, 0x2882e6));
  gen('card_epico', 300, 430, (gg) => card(gg, 0xa046dc));
  gen('card_back', 300, 430, (gg) => card(gg, 0xa046dc, true));
  ['ladrillo', 'estrella', 'candado', 'regalo', 'trofeo', 'ajustes', 'sonido', 'musica'].forEach((id) => gen('ui_' + id, 128, 128, (gg) => uiIcon(gg, id)));
  // efectos (siempre dibujados con código)
  COLORS.forEach((c) => {
    gen('neon_' + c, CELL, CELL, (gg, sz) => neonBlock(gg, sz, HEX[c]));
    gen('caramelo_' + c, CELL, CELL, (gg, sz) => carameloBlock(gg, sz, HEX[c]));
  });
  gen('deco_farola', 120, 230, (gg, w, h) => farola(gg, w, h));
  gen('deco_arbol', 220, 260, (gg, w, h) => arbol(gg, w, h));
  gen('deco_flores', 160, 110, (gg, w, h) => jardin(gg, w, h));
  gen('deco_fuente', 240, 240, (gg, w, h) => fuente(gg, w, h));
  gen('deco_banderines', 600, 120, (gg, w, h) => banderines(gg, w, h));
  gen('ui_tienda', 128, 128, (gg) => tiendaIcon(gg, 128));
  gen('fx_square', 18, 18, (gg) => { gg.fillStyle(0xffffff, 1); gg.fillRoundedRect(0, 0, 18, 18, 4); });
  gen('fx_dot', 24, 24, (gg) => { gg.fillStyle(0xffffff, 1); gg.fillCircle(12, 12, 12); });
  gen('fx_star', 48, 48, (gg) => { gg.fillStyle(0xffffff, 1); gg.fillPoints(starPts(24, 24, 24, 0.3, 4), true); });
  g.destroy();
  makeOro(scene);
  const T2 = scene.textures;
  const g2 = scene.make.graphics({ x: 0, y: 0 }, false);
  const gen2 = (key, draw) => { if (T2.exists(key)) return; g2.clear(); draw(g2, CELL); g2.generateTexture(key, CELL, CELL); };
  gen2('blk_hielo', (gg, s) => hielo(gg, s, false));
  gen2('blk_hielo2', (gg, s) => hielo(gg, s, true));
  gen2('blk_bomba', (gg, s) => bombaTile(gg, s));
  g2.destroy();
  gradient(scene, 'grad_game', '#161c4e', '#3e2680');
  gradient(scene, 'grad_menu', '#22184e', '#e0785a');
  gradient(scene, 'grad_sky', '#6eb9fa', '#ffe1be');
}
