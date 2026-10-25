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
export function button(scene, x, y, w, h, label, color, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (col) => {
    g.clear();
    g.fillStyle(shade(col, -0.35), 1);
    g.fillRoundedRect(-w / 2, -h / 2 + 10, w, h, Math.min(h / 2, 40));
    g.fillStyle(col, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(h / 2, 40));
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(-w / 2 + 16, -h / 2 + 8, w - 32, h * 0.22, h * 0.1);
  };
  draw(color);
  c.add(g);
  const t = txt(scene, opts.iconKey ? 22 : 0, 0, label, opts.size || 46, '#ffffff', { stroke: '#00000033', strokeW: 4 });
  c.add(t);
  if (opts.iconKey) c.add(icon(scene, -w / 2 + 56, 0, opts.iconKey, 64));
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h + 10), Phaser.Geom.Rectangle.Contains);
  let enabled = true;
  c.on('pointerdown', () => {
    if (!enabled) { sfx.error(); return; }
    sfx.click();
    scene.tweens.add({ targets: c, scale: 0.93, duration: 70, yoyo: true, onComplete: () => onClick && onClick() });
  });
  c.setEnabled = (v) => { enabled = v; draw(v ? color : 0x777788); };
  c.label = t;
  return c;
}

// Mensaje corto arriba del tablero
export function toast(scene, str, y = 352, dur = 1600) {
  if (scene._toast) scene._toast.destroy();
  const c = scene.add.container(W / 2, y).setDepth(200);
  const t = txt(scene, 0, 0, str, 34, '#ffffff', { weight: '700' });
  const g = scene.add.graphics();
  g.fillStyle(0x0a0a1e, 0.85);
  g.fillRoundedRect(-t.width / 2 - 34, -34, t.width + 68, 68, 34);
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
  g.fillStyle(0x0c0f30, 0.6);
  g.fillRoundedRect(-w / 2, -40, w, 80, 40);
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
