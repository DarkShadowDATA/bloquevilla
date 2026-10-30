import Phaser from 'phaser';
import { W, H } from '../config.js';
import { save } from '../save.js';
import { txt, background, icon, button } from '../ui.js';
import { verTop, PREMIO_RANKING } from '../ranking.js';
import { pedirApodo } from '../share.js';

export default class Ranking extends Phaser.Scene {
  constructor() { super('Ranking'); }

  create() {
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.75);
    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 });
    txt(this, W / 2, 230, 'Ranking semanal', 72, '#ffd93d', { stroke: '#3a1250', strokeW: 10 });
    txt(this, W / 2, 315, 'Contrarreloj 60 s · se reinicia cada lunes', 32, '#d8d0f0', { weight: '700' });
    // premios
    const g = this.add.graphics();
    g.fillStyle(0x0c0f30, 0.6); g.fillRoundedRect(120, 365, 840, 100, 50);
    ['🥇', '🥈', '🥉'].forEach((m, i) => {
      const x = 260 + i * 280;
      txt(this, x - 50, 415, m, 46, '#ffffff');
      txt(this, x + 30, 415, `+${PREMIO_RANKING[i]}`, 38, '#ffd93d');
      icon(this, x + 105, 415, 'ui_ladrillo', 42);
    });
    this.lista = this.add.container(0, 0);
    this.estado = txt(this, W / 2, 900, 'Cargando…', 40, '#ffffff', { weight: '700' });
    button(this, W / 2, 1720, 640, 140, 'Jugar Contrarreloj', 0x1f9aa8, () => this.scene.start('Game', { reto: false, modo: 'tiempo' }), { size: 50 });
    if (!save.apodo) {
      button(this, W / 2, 1560, 640, 100, 'Poner mi apodo', 0x7a4ad8, async () => { await pedirApodo(); this.scene.restart(); }, { size: 40 });
    }
    this.cargar();
  }

  async cargar() {
    let top;
    try { top = await verTop(); } catch (e) { this.estado.setText('Sin conexión. Intenta más tarde'); return; }
    if (!this.sys.isActive()) return;
    if (!top || !top.length) { this.estado.setText('¡Nadie ha jugado esta semana!\nSé el primero'); return; }
    this.estado.setVisible(false);
    const y0 = 540, alto = 88;
    top.forEach((t, i) => {
      const y = y0 + i * alto + (i >= 10 ? 30 : 0);
      const fila = this.add.container(W / 2, y);
      const bg = this.add.graphics();
      const color = t.soy_yo ? 0x7a4ad8 : t.lugar === 1 ? 0xb8862a : t.lugar === 2 ? 0x8a8aa8 : t.lugar === 3 ? 0x9a5a2a : 0x1c1e4e;
      bg.fillStyle(color, t.soy_yo || t.lugar <= 3 ? 0.95 : 0.8);
      bg.fillRoundedRect(-430, -38, 860, 76, 38);
      fila.add(bg);
      fila.add(txt(this, -370, 0, String(t.lugar), 40, '#ffffff'));
      fila.add(txt(this, -310, 0, t.apodo + (t.soy_yo ? ' (tú)' : ''), 38, '#ffffff', { weight: '700', ox: 0 }));
      fila.add(txt(this, 390, 0, Number(t.puntos).toLocaleString('es-MX'), 40, '#ffd93d', { ox: 1 }));
      fila.setAlpha(0).setX(W / 2 + 60);
      this.tweens.add({ targets: fila, alpha: 1, x: W / 2, delay: i * 60, duration: 280, ease: 'Cubic.Out' });
      this.lista.add(fila);
    });
    const yo = top.find((t) => t.soy_yo);
    if (!yo && save.apodo) txt(this, W / 2, y0 + top.length * alto + 40, 'Juega Contrarreloj para entrar al ranking', 32, '#d8d0f0', { weight: '700' });
  }
}
