import Phaser from 'phaser';
import { FONT, W, H } from './config.js';
import { sfx } from './sfx.js';
import { shade } from './textures.js';

export function txt(scene, x, y, str, size, color = '#ffffff', opts = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontStyle: opts.weight || '800',
    fontSize: size + 'px',
    color,
    align: opts.align || 'center',
    stroke: opts.stroke || undefined,
    strokeThickness: opts.stroke ? opts.strokeW || 8 : 0,
    wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
  });
  t.setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
  return t;
}

// Fondo: imagen si existe (bg_game, bg_menu, bg_village), si no un degradado
export function background(scene, imgKey, gradKey) {
  const key = scene.textures.exists(imgKey) ? imgKey : gradKey;
  const im = scene.add.image(W / 2, H / 2, key);
  const s = Math.max(W / im.width, H / im.height);
  im.setScale(s);
  return im;
}

export function icon(scene, x, y, key, size) {
  const im = scene.add.image(x, y, key);
  im.setDisplaySize(size, size * (im.height / im.width));
  return im;
}

// Botón redondeado con sombra y animación al tocar
// Cantidad de Shadow: el número y a su lado la imagen de la moneda (nunca emoji), del alto del texto.
export function shadowAmount(scene, x, y, n, size = 34, color = '#ffd93d') {
  const c = scene.add.container(x, y);
  const t = txt(scene, 0, 0, String(n), size, color);
  const ic = scene.add.image(0, 0, 'ui_shadow');
  ic.setScale((size * 1.05) / ic.height);
  const gap = size * 0.18, ancho = t.width + gap + ic.displayWidth;
  t.setX(-ancho / 2 + t.width / 2);
  ic.setX(ancho / 2 - ic.displayWidth / 2);
  c.add([t, ic]);
  return c;
}

// ---------- Sistema visual (menús v3) ----------
// Colores de la interfaz: todo lo de menús sale de aquí para que se vea parejo.
export const UI = {
  tinta: 0x1c1542,        // fondo de barras y ventanas oscuras
  tinta2: 0x2b2266,
  papel: 0xffffff,        // cuerpo de ventanas y tarjetas
  papel2: 0xf4f1fc,       // fondo de filas dentro de ventanas
  linea: 0xe3ddf3,
  texto: '#1f1747', suave: '#6f6694', claro: '#ffffff',
  verde: 0x2fbf62, morado: 0x6a4be0, azul: 0x2f7fe0, naranja: 0xf27a2a, oro: 0xe9a810, rosa: 0xe0457f, turquesa: 0x139fb0, gris: 0x8a84a8, rojo: 0xf0435a,
  radio: 30,
};

// Botón: cara plana con un degradado suave, labio inferior y respuesta al toque
export function button(scene, x, y, w, h, label, color, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const R = Math.min(h / 2, opts.radio || 32);
  const lip = Math.max(6, Math.round(h * 0.075));
  const draw = (col) => {
    g.clear();
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(-w / 2 + 2, -h / 2 + lip + 4, w - 4, h, R);
    g.fillStyle(shade(col, -0.32), 1);
    g.fillRoundedRect(-w / 2, -h / 2 + lip, w, h, R);
    // cara en dos tonos: mitad de arriba un poco más clara (sin costuras)
    g.fillStyle(shade(col, 0.1), 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, R);
    g.fillStyle(col, 1);
    g.fillRoundedRect(-w / 2, 0, w, h / 2, { tl: 0, tr: 0, bl: R, br: R });
    g.lineStyle(3, 0xffffff, 0.22);
    g.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, Math.max(2, R - 2));
  };
  draw(color);
  c.add(g);
  const iconSize = opts.iconSize || Math.min(64, h * 0.62);
  const t = txt(scene, 0, -2, label, opts.size || 46, '#ffffff', { stroke: '#00000026', strokeW: 3 });
  c.add(t);
  let ic = null;
  if (opts.iconKey) {
    ic = icon(scene, 0, -2, opts.iconKey, iconSize);
    c.add(ic);
  }
  // icono y texto centrados juntos (se recalcula si cambia el texto, por el idioma)
  const acomodar = () => {
    if (!ic) return;
    const gap = 14, ancho = ic.displayWidth + gap + t.width * t.scaleX;
    ic.setX(-ancho / 2 + ic.displayWidth / 2);
    t.setX(-ancho / 2 + ic.displayWidth + gap + (t.width * t.scaleX) / 2);
  };
  // que el texto nunca se salga del botón
  const ajustar = () => {
    const libre = w - 36 - (ic ? ic.displayWidth + 14 : 0);
    t.setScale(t.width > libre ? libre / t.width : 1);
    acomodar();
  };
  ajustar();
  const setText = t.setText.bind(t);
  t.setText = (v) => { setText(v); ajustar(); return t; };
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h + lip), Phaser.Geom.Rectangle.Contains);
  let enabled = true;
  c.on('pointerdown', () => {
    if (!enabled) { sfx.error(); return; }
    sfx.click();
    scene.tweens.add({ targets: c, scale: 0.95, duration: 70, yoyo: true, onComplete: () => onClick && onClick() });
  });
  c.setEnabled = (v) => { enabled = v; draw(v ? color : 0x9a96b0); };
  c.label = t;
  return c;
}

// Marco de ventana: sombra, cuerpo blanco y una franja de color arriba. Sustituye los dos rectángulos de antes.
export function marco(g, x, y, w, h, color = UI.morado) {
  g.fillStyle(0x000000, 0.28);
  g.fillRoundedRect(x + 4, y + 18, w - 8, h, 46);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - 8, y - 8, w + 16, h + 16, 52);
  g.fillStyle(UI.papel, 1);
  g.fillRoundedRect(x, y, w, h, 44);
}

// Botón redondo de regresar (arriba a la izquierda en todas las pantallas)
export function backBtn(scene, onBack, x = 92, y = 110) {
  const c = scene.add.container(x, y).setDepth(60);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25); g.fillCircle(0, 6, 46);
  g.fillStyle(0xffffff, 1); g.fillCircle(0, 0, 46);
  g.lineStyle(11, UI.tinta, 1);
  g.beginPath(); g.moveTo(10, -20); g.lineTo(-12, 0); g.lineTo(10, 20); g.strokePath();
  c.add(g);
  c.setInteractive(new Phaser.Geom.Circle(0, 0, 56), Phaser.Geom.Circle.Contains);
  c.on('pointerdown', () => { sfx.click(); scene.tweens.add({ targets: c, scale: 0.9, duration: 70, yoyo: true, onComplete: onBack }); });
  return c;
}

// Barra superior oscura y translúcida, con título centrado (pantallas secundarias)
export function topBar(scene, title, opts = {}) {
  const h = opts.h || 210;
  const g = scene.add.graphics().setDepth(opts.depth ?? 40);
  g.fillStyle(UI.tinta, opts.alpha ?? 0.82);
  g.fillRect(0, 0, W, h);
  g.fillStyle(0x000000, 0.18);
  g.fillRect(0, h, W, 6);
  const t = title ? txt(scene, W / 2, 110, title, opts.size || 52, '#ffffff').setDepth((opts.depth ?? 40) + 1) : null;
  if (t && t.width > 560) t.setScale(560 / t.width);
  return { g, t, h };
}

// Globito de aviso: número (rojo) o texto corto como NUEVO
export function badge(scene, x, y, valor, color = UI.rojo) {
  const c = scene.add.container(x, y).setDepth(8);
  const s = String(valor);
  const t = txt(scene, 0, 0, s, s.length > 2 ? 24 : 30, '#ffffff', { weight: '800' });
  const w = Math.max(52, t.width + 30);
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1); g.fillRoundedRect(-w / 2 - 4, -30, w + 8, 60, 30);
  g.fillStyle(color, 1); g.fillRoundedRect(-w / 2, -26, w, 52, 26);
  c.add([g, t]);
  return c;
}

// Tarjeta de modo (menú principal): fondo blanco, icono, título y una línea de detalle
export function tile(scene, x, y, w, h, opts) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const col = opts.color || UI.morado;
  g.fillStyle(0x000000, 0.22); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 10, w - 6, h, 34);
  g.fillStyle(UI.papel, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 34);
  g.fillStyle(col, 1); g.fillRoundedRect(-w / 2, -h / 2, 116, h, { tl: 34, bl: 34, tr: 0, br: 0 });
  g.fillStyle(shade(col, 0.15), 1); g.fillRoundedRect(-w / 2, -h / 2, 116, h * 0.5, { tl: 34, bl: 0, tr: 0, br: 0 });
  c.add(g);
  if (opts.iconKey) c.add(icon(scene, -w / 2 + 58, 0, opts.iconKey, opts.iconSize || 78));
  if (opts.dibujo) c.add(opts.dibujo(scene, -w / 2 + 58, 0));
  const tx = -w / 2 + 140;
  const t1 = txt(scene, tx, opts.sub ? -20 : 0, opts.title, opts.size || 38, UI.texto).setOrigin(0, 0.5);
  const libre = w - 160;
  if (t1.width > libre) t1.setScale(libre / t1.width);
  c.add(t1);
  let t2 = null;
  if (opts.sub) {
    t2 = txt(scene, tx, 26, opts.sub, 25, UI.suave, { weight: '700' }).setOrigin(0, 0.5);
    if (t2.width > libre) t2.setScale(libre / t2.width);
    c.add(t2);
  }
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerdown', () => { sfx.click(); scene.tweens.add({ targets: c, scale: 0.96, duration: 70, yoyo: true, onComplete: opts.onClick }); });
  c.title = t1; c.sub = t2;
  return c;
}

// Iconos sencillos dibujados con código (para lo que todavía no tiene imagen)
export function dibujo(scene, tipo, x, y, s = 1) {
  const g = scene.add.graphics();
  g.setPosition(x, y).setScale(s);
  const blanco = 0xffffff;
  if (tipo === 'reloj') {
    g.fillStyle(blanco, 1); g.fillCircle(0, 4, 32);
    g.fillStyle(blanco, 1); g.fillRect(-8, -38, 16, 12); g.fillRoundedRect(-14, -44, 28, 9, 4);
    g.lineStyle(7, 0x139fb0, 1); g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -16); g.strokePath();
    g.beginPath(); g.moveTo(0, 4); g.lineTo(14, 12); g.strokePath();
    g.fillStyle(0x139fb0, 1); g.fillCircle(0, 4, 5);
  } else if (tipo === 'calendario') {
    g.fillStyle(blanco, 1); g.fillRoundedRect(-30, -26, 60, 56, 10);
    g.fillStyle(0xf0435a, 1); g.fillRoundedRect(-30, -26, 60, 18, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.fillStyle(blanco, 1); g.fillRect(-18, -36, 8, 16); g.fillRect(10, -36, 8, 16);
    g.fillStyle(0x6a4be0, 1);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) g.fillRoundedRect(-21 + k * 15, -2 + r * 14, 11, 10, 3);
  } else if (tipo === 'lista') {
    g.fillStyle(blanco, 1); g.fillRoundedRect(-28, -34, 56, 68, 10);
    g.lineStyle(6, 0x2f7fe0, 1);
    [-16, 0, 16].forEach((yy) => { g.beginPath(); g.moveTo(-16, yy); g.lineTo(-10, yy + 6); g.lineTo(-2, yy - 4); g.strokePath(); g.fillStyle(0xc8d4ea, 1); g.fillRect(4, yy - 3, 16, 6); });
  } else if (tipo === 'mapa') {
    g.fillStyle(blanco, 1);
    g.fillPoints([{ x: -34, y: -22 }, { x: -12, y: -30 }, { x: 12, y: -22 }, { x: 34, y: -30 }, { x: 34, y: 24 }, { x: 12, y: 32 }, { x: -12, y: 24 }, { x: -34, y: 32 }], true);
    g.lineStyle(5, 0x2fbf62, 1);
    g.beginPath(); g.moveTo(-22, 18); g.lineTo(-6, 0); g.lineTo(8, 10); g.lineTo(22, -12); g.strokePath();
    g.fillStyle(0xf0435a, 1); g.fillCircle(22, -14, 7);
  } else if (tipo === 'podio') {
    g.fillStyle(blanco, 1);
    g.fillRoundedRect(-12, -18, 24, 46, 4); g.fillRoundedRect(-38, -2, 24, 30, 4); g.fillRoundedRect(14, 6, 24, 22, 4);
    g.fillStyle(0xe9a810, 1); g.fillCircle(0, -30, 9);
  }
  return g;
}

// Barra de navegación de abajo (menú principal)
export function navBar(scene, items, y = H - 112) {
  const c = scene.add.container(0, y).setDepth(30);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.2); g.fillRoundedRect(24, -88, W - 48, 186, 48);
  g.fillStyle(UI.tinta, 0.94); g.fillRoundedRect(24, -96, W - 48, 186, 48);
  c.add(g);
  const paso = (W - 48) / items.length;
  items.forEach((it, i) => {
    const x = 24 + paso * (i + 0.5);
    const b = scene.add.container(x, -8);
    if (it.iconKey) b.add(icon(scene, 0, -24, it.iconKey, it.iconSize || 74));
    if (it.dibujo) b.add(dibujo(scene, it.dibujo, 0, -24, 1.05));
    const t = txt(scene, 0, 46, it.label, 25, it.apagado ? '#8f88b8' : '#ffffff', { weight: '700' });
    if (t.width > paso - 12) t.setScale((paso - 12) / t.width);
    b.add(t);
    if (it.apagado) b.list[0].setAlpha(0.55);
    if (it.badge) b.add(badge(scene, 40, -66, it.badge, it.badgeColor || UI.rojo));
    b.setInteractive(new Phaser.Geom.Rectangle(-paso / 2, -80, paso, 170), Phaser.Geom.Rectangle.Contains);
    b.on('pointerdown', () => { sfx.click(); scene.tweens.add({ targets: b, scale: 0.9, duration: 70, yoyo: true, onComplete: it.onClick }); });
    c.add(b);
  });
  return c;
}

// Mensaje corto arriba del tablero
export function toast(scene, str, y = 352, dur = 1600) {
  if (scene._toast) scene._toast.destroy();
  const c = scene.add.container(W / 2, y).setDepth(200);
  const t = txt(scene, 0, 0, str, 34, '#ffffff', { weight: '700' });
  const g = scene.add.graphics();
  g.fillStyle(UI.tinta, 0.94);
  g.fillRoundedRect(-t.width / 2 - 34, -34, t.width + 68, 68, 34);
  g.lineStyle(3, 0xffffff, 0.16);
  g.strokeRoundedRect(-t.width / 2 - 34, -34, t.width + 68, 68, 34);
  c.add([g, t]);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, y: y - 8, duration: 180 });
  if (dur > 0) scene.tweens.add({ targets: c, alpha: 0, delay: dur, duration: 300, onComplete: () => c.destroy() });
  scene._toast = c;
  return c;
}

export function floatText(scene, x, y, str, size, color, stroke = '#2a1450') {
  const t = txt(scene, x, y, str, size, color, { stroke, strokeW: Math.max(6, size / 9) }).setDepth(150).setScale(0.3);
  scene.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - 120, alpha: 0, delay: 600, duration: 500, onComplete: () => t.destroy() });
  return t;
}

export function chip(scene, x, y, w, iconKey, value) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(-w / 2, -36, w, 80, 40);
  g.fillStyle(UI.tinta, 0.9);
  g.fillRoundedRect(-w / 2, -40, w, 80, 40);
  g.lineStyle(3, 0xffffff, 0.14);
  g.strokeRoundedRect(-w / 2, -40, w, 80, 40);
  c.add(g);
  c.add(icon(scene, -w / 2 + 48, 0, iconKey, 58));
  const t = txt(scene, 26, 0, String(value), 40);
  c.add(t);
  c.setValue = (v) => {
    t.setText(String(v));
    scene.tweens.add({ targets: t, scale: 1.25, duration: 90, yoyo: true });
  };
  return c;
}

export function confetti(scene, x, y, n = 60) {
  const e = scene.add.particles(x, y, 'fx_square', {
    speed: { min: 400, max: 1100 }, angle: { min: 200, max: 340 }, gravityY: 1300,
    lifespan: 1600, scale: { start: 1.1, end: 0.4 }, rotate: { min: 0, max: 360 },
    tint: [0xff5a5f, 0xffd93d, 0x4d96ff, 0x6bcb77, 0xf15bb5, 0x9b5de5], emitting: false,
  }).setDepth(180);
  e.explode(n);
  scene.time.delayedCall(1800, () => e.destroy());
}

// Control segmentado (pestañas): la elegida en blanco, las demás transparentes
export function pestanasUI(scene, items, actual, cx, y, w, depth = 45) {
  const n = items.length, pw = w / n, h = 84;
  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(0x000000, 0.35); g.fillRoundedRect(cx - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 48);
  items.forEach((it, k) => {
    const x = cx - w / 2 + pw * (k + 0.5);
    const on = it.id === actual;
    if (on) { g.fillStyle(0xffffff, 1); g.fillRoundedRect(x - pw / 2 + 2, y - h / 2, pw - 4, h, 42); }
    const t = txt(scene, x, y, it.label, 30, on ? UI.texto : '#ffffff', { weight: '800' }).setDepth(depth + 1);
    if (t.width > pw - 24) t.setScale((pw - 24) / t.width);
    const z = scene.add.zone(x, y, pw, h).setInteractive().setDepth(depth + 2);
    z.on('pointerdown', () => { if (!on) { sfx.click(); it.ir(); } });
    if (it.n && !on) badge(scene, x + pw / 2 - 22, y - h / 2 + 2, it.n).setDepth(depth + 3).setScale(0.8);
  });
}
