// Álbum de colección: temas de bloques y decoraciones. Lo tuyo se ve a color; lo que falta, en gris con cómo se consigue.
import Phaser from 'phaser';
import { W, H, COLORS, DECO_POS } from '../config.js';
import { save, persist } from '../save.js';
import { txt, background, icon, button, toast, confetti } from '../ui.js';
import { sfx } from '../sfx.js';
import { pestanas } from './Logros.js';
import { PIEZAS, SECCIONES, PREMIO_COLECCION, tenidas, totalPiezas, porcentajeColeccion, premioListo, cobrarPremio, nuevos, marcarVistos } from '../coleccion.js';

const DECO_KEY = { arboles: 'deco_arbol', farolas: 'deco_farola', flores: 'deco_flores', banderines: 'deco_banderines', fuente: 'deco_fuente', globo: 'deco_globo', estatua: 'deco_estatua', copa: 'deco_copa' };
const blockKey = (tema, k) => {
  const c = COLORS[k % COLORS.length];
  if (tema === 'clasico') return 'block_' + c;
  if (tema === 'agua') return 'water_' + ((k % 3) + 1);
  if (tema === 'muertos') return 'muertos_' + ((k % 4) + 1);
  return `${tema}_${c}`;
};
const CW = 236, CH = 262, GAP = 18, TOP = 380;

export default class Coleccion extends Phaser.Scene {
  constructor() { super('Coleccion'); }

  create() {
    const recien = nuevos().map((p) => p.id);   // para marcar ¡NUEVO! esta vez
    marcarVistos();
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.78);

    // contenido que se desplaza
    this.lista = this.add.container(0, 0);
    let y = TOP;
    SECCIONES.forEach(([sec, titulo]) => {
      const items = PIEZAS.filter((p) => p.seccion === sec);
      if (!items.length) return;
      this.lista.add(txt(this, 60, y + 22, titulo, 32, sec === 'temas' || sec === 'pueblo' ? '#ffd93d' : '#b8a8e0').setOrigin(0, 0.5));
      y += 62;
      items.forEach((p, i) => {
        const x = 60 + CW / 2 + (i % 4) * (CW + GAP);
        const cy = y + Math.floor(i / 4) * (CH + GAP) + CH / 2;
        this.carta(p, x, cy, recien.includes(p.id));
      });
      y += Math.ceil(items.length / 4) * (CH + GAP) + 20;
    });
    const alto = y + (premioListo() ? 150 : 40);   // espacio para el botón del premio
    this.minY = Math.min(0, H - alto);

    // cabecera fija
    this.add.rectangle(W / 2, (TOP - 24) / 2, W, TOP - 24, 0x000000, 0.001).setInteractive().setDepth(20);   // tapa los toques bajo la cabecera
    const hdr = this.add.graphics().setDepth(20);
    hdr.fillStyle(0x120c30, 1); hdr.fillRect(0, 0, W, TOP - 24);
    hdr.fillGradientStyle(0x120c30, 0x120c30, 0x120c30, 0x120c30, 1, 1, 0, 0); hdr.fillRect(0, TOP - 24, W, 30);
    const top = this.add.container(0, 0).setDepth(21);
    top.add(button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 }));
    const antes = this.children.list.length;
    pestanas(this, 'coleccion');
    this.children.list.slice(antes).forEach((o) => o.setDepth(Math.max(22, o.depth + 21)));
    const pct = porcentajeColeccion();
    const g = this.add.graphics().setDepth(22);
    g.fillStyle(0x0c0f30, 0.9); g.fillRoundedRect(140, 268, 800, 46, 23);
    g.fillStyle(0x5ac8e8, 1); if (pct) g.fillRoundedRect(144, 272, Math.max(38, 792 * pct / 100), 38, 19);
    txt(this, W / 2, 291, `${pct}% · ${tenidas()}/${totalPiezas()} piezas`, 28, '#ffffff', { stroke: '#120c30', strokeW: 6 }).setDepth(23);
    if (premioListo()) {
      const b = button(this, W / 2, 1810, 640, 100, `🎁 100%: +${PREMIO_COLECCION} ladrillos`, 0x4ab86a, () => {
        const pr = cobrarPremio();
        if (!pr) return;
        sfx.build(); confetti(this, W / 2, 900, 120);
        toast(this, `¡Colección completa! +${pr} ladrillos y la insignia 📖`, 1660, 2800);
        this.time.delayedCall(900, () => this.scene.restart());
      }, { size: 36 }).setDepth(30);
      this.tweens.add({ targets: b, scale: 1.05, duration: 500, yoyo: true, repeat: -1 });
    } else if (save.coleccion.premio) {
      txt(this, W / 2, 343, '📖 Coleccionista: ¡tienes todo!', 26, '#9ae6a0', { weight: '800' }).setDepth(23);
    } else {
      txt(this, W / 2, 343, `Completa el 100% y gana ${PREMIO_COLECCION} ladrillos y la insignia 📖`, 24, '#c8c0e8', { weight: '700' }).setDepth(23);
    }

    // desplazar arrastrando o con la rueda
    let y0 = null, l0 = 0, movido = false;
    this.input.on('pointerdown', (p) => { y0 = p.y; l0 = this.lista.y; movido = false; });
    this.input.on('pointermove', (p) => {
      if (y0 === null || !p.isDown) return;
      if (Math.abs(p.y - y0) > 12) movido = true;
      if (movido) this.lista.y = Phaser.Math.Clamp(l0 + p.y - y0, this.minY, 0);
    });
    this.input.on('pointerup', () => { y0 = null; });
    this.input.on('wheel', (p, o, dx, dy) => { this.lista.y = Phaser.Math.Clamp(this.lista.y - dy, this.minY, 0); });
    this.movido = () => movido;
  }

  carta(p, x, y, esNuevo) {
    const tiene = p.tiene();
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-CW / 2 + 4, -CH / 2 + 8, CW, CH, 28);
    g.fillStyle(tiene ? 0xfff7e8 : 0x4a4268, 1); g.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 28);
    if (p.exclusivo) { g.lineStyle(6, 0xf2c230, 1); g.strokeRoundedRect(-CW / 2 + 3, -CH / 2 + 3, CW - 6, CH - 6, 26); }
    c.add(g);
    // imagen
    if (p.tipo === 'tema') {
      [0, 1, 2, 3].forEach((k) => {
        const key = blockKey(p.id, k * 2 + 1);
        if (!this.textures.exists(key)) return;
        const im = this.add.image(-48 + (k % 2) * 96, -84 + Math.floor(k / 2) * 92, key).setDisplaySize(90, 90);
        if (!tiene) im.setTint(0x6a6488).setAlpha(0.75);
        c.add(im);
      });
    } else if (this.textures.exists(DECO_KEY[p.id])) {
      const im = this.add.image(0, -40, DECO_KEY[p.id]);
      im.setScale(Math.min(180 / im.width, 150 / im.height));
      if (!tiene) im.setTintFill(0x2a2440).setAlpha(0.8);
      c.add(im);
    }
    const n = txt(this, 0, 64, p.nombre, 28, tiene ? '#46286e' : '#ffffff');
    if (n.width > CW - 24) n.setScale((CW - 24) / n.width);
    c.add(n);
    if (tiene) {
      const usando = p.tipo === 'tema' && save.theme === p.id;
      c.add(txt(this, 0, 104, usando ? '✓ En uso' : '✓ Tuyo', 24, '#2a9a4a', { weight: '800' }));
    } else {
      c.add(txt(this, 0, 104, p.como, 19, '#d8d0f0', { weight: '700', wrap: CW - 30 }));
    }
    if (esNuevo) {
      const nv = txt(this, CW / 2 - 40, -CH / 2 + 6, '¡NUEVO!', 22, '#ffffff', { stroke: '#c8282a', strokeW: 7 }).setAngle(12);
      c.add(nv);
      this.tweens.add({ targets: nv, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    }
    // tocar: usar el tema, ir a la tienda o recordar cómo se consigue
    const zona = this.add.rectangle(0, 0, CW, CH, 0xffffff, 0).setInteractive({ useHandCursor: true });
    c.add(zona);
    zona.on('pointerup', () => {
      if (this.movido()) return;
      if (tiene && p.tipo === 'tema') {
        save.theme = p.id; persist(); sfx.power();
        toast(this, `Tema ${p.nombre} puesto`, 1700, 1600);
        this.scene.restart();
      } else if (tiene) {
        const zonaPueblo = DECO_POS[p.id] ? 1 : 3;
        this.scene.start('Village', { zona: zonaPueblo });
      } else if (p.tienda) {
        this.scene.start('Shop', { tab: p.tienda });
      } else {
        toast(this, p.como, 1700, 2200);
      }
    });
    this.lista.add(c);
  }
}
