import Phaser from 'phaser';
import { W, H } from '../config.js';
import { txt } from '../ui.js';
import { cargaRestante } from '../carga.js';

// Pantalla corta de «Cargando…» si alguien sale de la partida antes de que terminen de bajar las imágenes del resto del juego.
export default class Carga extends Phaser.Scene {
  constructor() { super('Carga'); }

  create({ next, data }) {
    this.cameras.main.setBackgroundColor('#1c1542');
    const t = txt(this, W / 2, H / 2 - 40, 'Cargando…', 52, '#ffffff');
    const g = this.add.graphics();
    const pinta = (p) => {
      g.clear();
      g.fillStyle(0xffffff, 0.15); g.fillRoundedRect(W / 2 - 300, H / 2 + 40, 600, 28, 14);
      g.fillStyle(0x2fbf62, 1); g.fillRoundedRect(W / 2 - 300, H / 2 + 40, Math.max(28, 600 * p), 28, 14);
    };
    pinta(0);
    cargaRestante((p) => this.sys.isActive() && pinta(p)).then(() => {
      t.setText('');
      this.scene.start(next, data);
    });
  }
}
