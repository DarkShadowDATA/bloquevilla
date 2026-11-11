// Pantalla de Logros: 10 logros × 3 medallas (bronce, plata, oro), su progreso y el botón para cobrar cada medalla.
import Phaser from 'phaser';
import { W, H } from '../config.js';
import { save, persist } from '../save.js';
import { txt, background, icon, button, toast, confetti } from '../ui.js';
import { sfx } from '../sfx.js';
import { nuevos, premioListo } from '../coleccion.js';
import { LOGROS, PREMIO_MEDALLA, progreso, alcanzadas, cobradas, cobrarLogro, porcentaje, totalMedallas } from '../logros.js';

const COL = [0xcd7f45, 0xc8d0dc, 0xf2c230];       // bronce, plata, oro
const NOMBRE = ['Bronce', 'Plata', 'Oro'];

// Medalla: usa la imagen medalla_<tipo> si existe; si no, la dibuja con código
export function medalla(scene, x, y, k, size, gris = false) {
  const key = ['medalla_bronce', 'medalla_plata', 'medalla_oro'][k];
  if (scene.textures.exists(key)) {
    const im = icon(scene, x, y, key, size * 0.72);
    if (gris) im.setTintFill(0x3a3454).setAlpha(0.6);
    return im;
  }
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const col = gris ? 0x4a4a5e : COL[k];
  const r = size * 0.36;
  g.fillStyle(gris ? 0x3a3a4e : 0xd8443c, 1); g.fillTriangle(-r * 0.7, -r * 0.4, -r * 0.1, -r * 0.4, -r * 0.6, -r * 1.45);
  g.fillStyle(gris ? 0x3a3a4e : 0x3a7ad8, 1); g.fillTriangle(r * 0.7, -r * 0.4, r * 0.1, -r * 0.4, r * 0.6, -r * 1.45);
  g.fillStyle(Phaser.Display.Color.IntegerToColor(col).darken(30).color, 1); g.fillCircle(0, r * 0.15, r);
  g.fillStyle(col, 1); g.fillCircle(0, r * 0.1, r * 0.86);
  g.fillStyle(0xffffff, gris ? 0.1 : 0.45); g.fillCircle(-r * 0.3, -r * 0.2, r * 0.25);
  c.add(g);
  if (!gris) c.add(txt(scene, 0, r * 0.12, '★', size * 0.36, '#ffffff', { stroke: '#00000044', strokeW: 4 }));
  return c;
}

// Pestañas de arriba: Logros y Colección (la meta de 100 % del juego)
export function pestanas(scene, actual) {
  const P = [['logros', '🏅 Logros', 'Logros'], ['coleccion', '📖 Colección', 'Coleccion'], ['estadisticas', '📊 Datos', 'Estadisticas']];
  P.forEach(([id, label, escena], k) => {
    const x = W / 2 + 60 + (k - 1) * 290;
    const on = id === actual;
    const b = button(scene, x, 205, 276, 88, label, on ? 0xd8a020 : 0x3a3070, () => { if (!on) scene.scene.start(escena); }, { size: 30 });
    if (!on) b.setAlpha(0.85);
    // número rojo en la pestaña de al lado si hay algo nuevo
    const n = id === 'coleccion' ? nuevos().length + (premioListo() ? 1 : 0) : 0;
    if (n && !on) {
      scene.add.circle(x + 126, 168, 22, 0xe83a3a).setStrokeStyle(4, 0xffffff).setDepth(6);
      txt(scene, x + 126, 168, String(n), 26).setDepth(7);
    }
  });
}

export default class Logros extends Phaser.Scene {
  constructor() { super('Logros'); }

  create() {
    if (!save.logrosVistos) { save.logrosVistos = true; persist(); }
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.78);
    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 });
    pestanas(this, 'logros');
    // barra de % total
    const pct = porcentaje();
    const g = this.add.graphics();
    g.fillStyle(0x0c0f30, 0.7); g.fillRoundedRect(140, 268, 800, 46, 23);
    g.fillStyle(0xf2c230, 1); if (pct) g.fillRoundedRect(144, 272, Math.max(38, 792 * pct / 100), 38, 19);
    txt(this, W / 2, 291, `${pct}% · ${totalMedallas()}/30 medallas`, 28, '#ffffff', { stroke: '#120c30', strokeW: 6 });

    LOGROS.forEach((L, i) => {
      const y = 400 + i * 138;
      const al = alcanzadas(L), co = cobradas(L);
      const card = this.add.graphics();
      card.fillStyle(0xf6f2ff, 1); card.fillRoundedRect(40, y - 62, W - 80, 124, 26);
      if (al > co) { card.lineStyle(6, 0x4ab86a, 1); card.strokeRoundedRect(40, y - 62, W - 80, 124, 26); }
      icon(this, 110, y, L.icono, 74);
      txt(this, 170, y - 30, L.nombre, 34, '#2a1a5e').setOrigin(0, 0.5);
      // siguiente meta (o la última si ya tiene las 3)
      const meta = L.metas[Math.min(al, 2)];
      const t = txt(this, 170, y + 6, al >= 3 ? `${L.texto(L.metas[2])} ✓` : L.texto(meta), 24, '#6a5a8a', { weight: '700' }).setOrigin(0, 0.5);
      if (t.width > 420) t.setScale(420 / t.width);
      const p = Math.min(progreso(L), meta);
      const bar = this.add.graphics();
      bar.fillStyle(0xdcd4ee, 1); bar.fillRoundedRect(170, y + 30, 330, 18, 9);
      bar.fillStyle(al >= 3 ? 0xf2c230 : 0x7a4ad8, 1); bar.fillRoundedRect(170, y + 30, Math.max(18, 330 * (al >= 3 ? 1 : p / meta)), 18, 9);
      txt(this, 520, y + 39, al >= 3 ? '¡Completo!' : `${p.toLocaleString('es-MX')}/${meta.toLocaleString('es-MX')}`, 20, '#6a5a8a', { weight: '800' }).setOrigin(0, 0.5);
      // 3 medallas
      [0, 1, 2].forEach((k) => medalla(this, 690 + k * 72, y, k, 70, k >= al));
      if (al > co) {
        const b = button(this, 955, y, 170, 92, `+${PREMIO_MEDALLA[co]}`, 0x4ab86a, () => {
          const n = cobrarLogro(L);
          if (!n) return;
          sfx.build(); confetti(this, 955, y, 40);
          toast(this, `${L.nombre} · ${NOMBRE[co]}: +${n} ladrillos`, 1820, 1500);
          this.time.delayedCall(500, () => this.scene.restart());
        }, { size: 34, iconKey: 'ui_ladrillo' });
        this.tweens.add({ targets: b, scale: 1.06, duration: 450, yoyo: true, repeat: -1 });
      } else {
        txt(this, 955, y, al >= 3 ? '🏆' : `${co}/3`, al >= 3 ? 52 : 32, '#8a7ab0');
      }
    });
    txt(this, W / 2, 1810, `Premios: ${PREMIO_MEDALLA.join(', ')} ladrillos por bronce, plata y oro`, 26, '#c8c0e8', { weight: '700' });
  }
}
