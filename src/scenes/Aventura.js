import Phaser from 'phaser';
import { W, H } from '../config.js';
import { save } from '../save.js';
import { sfx } from '../sfx.js';
import { txt, background, icon, button, toast } from '../ui.js';
import { NIVELES, OBJ_ICONO, OBJ_TEXTO, desbloqueado, estrellasTotales } from '../aventura.js';

// Mapa de niveles: un camino en zigzag que sube; se desplaza con el dedo
const PASO = 210;

export default class Aventura extends Phaser.Scene {
  constructor() { super('Aventura'); }

  create() {
    background(this, 'bg_aventura', 'grad_sky');
    if (!this.textures.exists('bg_aventura')) this.add.rectangle(W / 2, H / 2, W, H, 0x2a6a3a, 0.35);
    this.mapa = this.add.container(0, 0);
    const n = NIVELES.length;
    const yBase = 1500;
    const pos = (i) => [W / 2 + Math.sin(i * 1.05) * 270, yBase - i * PASO];
    // camino
    const g = this.add.graphics();
    for (let i = 0; i < n - 1; i++) {
      const [x1, y1] = pos(i), [x2, y2] = pos(i + 1);
      for (let k = 1; k < 6; k++) {
        const t = k / 6;
        g.fillStyle(desbloqueado(i + 1) ? 0xfff2c8 : 0xffffff, desbloqueado(i + 1) ? 0.95 : 0.45);
        g.fillCircle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 9);
      }
    }
    this.mapa.add(g);
    const actual = Math.min(n - 1, save.aventura.estrellas.filter((e) => e > 0).length);
    NIVELES.forEach((def, i) => {
      const [x, y] = pos(i);
      const abierto = desbloqueado(i);
      const est = save.aventura.estrellas[i] || 0;
      const c = this.add.container(x, y);
      const key = this.textures.exists(abierto ? (i === actual ? 'nivel_actual' : 'nivel_abierto') : 'nivel_cerrado') ? (abierto ? (i === actual ? 'nivel_actual' : 'nivel_abierto') : 'nivel_cerrado') : null;
      if (key) {
        c.add(icon(this, 0, 0, key, 150));
      } else {
        const b = this.add.graphics();
        const col = !abierto ? 0x6a6a80 : i === actual ? 0xffb23f : est ? 0x5ac85a : 0x4a8ad8;
        b.fillStyle(0x000000, 0.25); b.fillCircle(4, 10, 66);
        b.fillStyle(col, 1); b.fillCircle(0, 0, 66);
        b.lineStyle(8, 0xffffff, 1); b.strokeCircle(0, 0, 66);
        c.add(b);
      }
      if (abierto) c.add(txt(this, 0, -4, String(i + 1), 56, '#ffffff', { stroke: '#2a1450', strokeW: 8 }));
      else c.add(icon(this, 0, 0, 'ui_candado', 70));
      if (abierto) c.add(icon(this, 62, 46, OBJ_ICONO[def.t], 46));
      [-44, 0, 44].forEach((sx, k) => {
        const st = icon(this, sx, 86 + (k === 1 ? 8 : 0), 'ui_estrella', 44);
        if (k >= est) st.setTint(0x555566).setAlpha(abierto ? 0.7 : 0.3);
        c.add(st);
      });
      c.setSize(150, 150).setInteractive();
      c.on('pointerup', (p) => {
        if (Math.abs(p.downY - p.upY) > 14) return;   // fue arrastre, no toque
        if (!abierto) { sfx.error(); toast(this, `Supera el nivel ${i} para abrir este`, 1660, 1600); return; }
        this.abrir(i);
      });
      if (i === actual) this.tweens.add({ targets: c, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.mapa.add(c);
    });
    // desplazamiento: centra el nivel actual
    this.minY = 0;
    this.maxY = (n - 1) * PASO - 900;
    this.mapa.y = Phaser.Math.Clamp(pos(actual)[1] < 900 ? 900 - pos(actual)[1] : 0, this.minY, this.maxY);
    let arrastre = null;
    this.input.on('pointerdown', (p) => { if (p.y > 260 && p.y < 1720) arrastre = { y: p.y, m: this.mapa.y }; });
    this.input.on('pointermove', (p) => { if (arrastre && p.isDown) this.mapa.y = Phaser.Math.Clamp(arrastre.m + (p.y - arrastre.y), this.minY, this.maxY); });
    this.input.on('pointerup', () => { arrastre = null; });
    this.input.on('wheel', (p, o, dx, dy) => { this.mapa.y = Phaser.Math.Clamp(this.mapa.y - dy, this.minY, this.maxY); });
    // barra superior
    const top = this.add.graphics().setDepth(50);
    top.fillStyle(0x120c30, 0.85); top.fillRect(0, 0, W, 250);
    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 }).setDepth(51);
    txt(this, W / 2, 105, 'Aventura', 70, '#ffd93d', { stroke: '#3a1250', strokeW: 10 }).setDepth(51);
    const totalEst = estrellasTotales();
    icon(this, 860, 110, 'ui_estrella', 60).setDepth(51);
    txt(this, 935, 110, `${totalEst}/${n * 3}`, 38, '#ffffff').setDepth(51);
    txt(this, W / 2, 195, 'Cumple el objetivo antes de que se acaben las piezas', 28, '#d8d0f0', { weight: '700' }).setDepth(51);
    if (save.aventura.estrellas.filter((e) => e > 0).length >= n) toast(this, '¡Completaste la Aventura! Pronto habrá más niveles', 1660, 3000);
  }

  abrir(i) {
    sfx.click();
    const def = NIVELES[i];
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    dim.on('pointerdown', () => layer.destroy());
    layer.add(dim);
    const panel = this.add.container(W / 2, 960).setScale(0.3);
    layer.add(panel);
    const g = this.add.graphics();
    g.fillStyle(0x6a3ab8, 1); g.fillRoundedRect(-400, -360, 800, 720, 50);
    g.fillStyle(0xfff7e8, 1); g.fillRoundedRect(-400, -370, 800, 710, 50);
    panel.add(g);
    panel.add(this.add.rectangle(0, 0, 800, 710).setInteractive());
    panel.add(txt(this, 0, -300, `Nivel ${i + 1}`, 70, '#46286e'));
    panel.add(txt(this, 0, -225, def.nombre, 38, '#8c7aa0', { weight: '700' }));
    panel.add(icon(this, 0, -100, OBJ_ICONO[def.t], 130));
    panel.add(txt(this, 0, 20, OBJ_TEXTO[def.t](def.n), 46, '#2a7a4a'));
    panel.add(txt(this, 0, 85, `con ${def.p} piezas o menos`, 34, '#8c7aa0', { weight: '700' }));
    panel.add(txt(this, 0, 140, '3 estrellas si te sobran muchas piezas', 28, '#8c7aa0', { weight: '600' }));
    panel.add(button(this, 0, 255, 560, 130, 'Jugar', 0x5ac85a, () => this.scene.start('Game', { reto: false, nivel: i }), { size: 60 }));
    this.tweens.add({ targets: panel, scale: 1, duration: 340, ease: 'Back.Out' });
  }
}
