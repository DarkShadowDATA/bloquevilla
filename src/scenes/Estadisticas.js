// Mis estadísticas: tercera pestaña junto a Logros y Colección. Solo lee el guardado (no cambia nada).
import Phaser from 'phaser';
import { W, H, BUILDINGS } from '../config.js';
import { save } from '../save.js';
import { txt, background, button } from '../ui.js';
import { pestanas } from './Logros.js';
import { LOGROS, totalMedallas } from '../logros.js';
import { porcentajeColeccion, tenidas, totalPiezas } from '../coleccion.js';
import { NIVELES, nivelesSuperados, estrellasTotales } from '../aventura.js';

const fmt = (n) => Math.round(n || 0).toLocaleString('es-MX');
function horas(seg) {
  const m = Math.floor((seg || 0) / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export function secciones() {
  const c = (save.logros && save.logros.c) || {};
  const est = save.aventura.estrellas || [];
  const jefes = NIVELES.map((n, i) => (n.t === 'jefe' ? i : -1)).filter((i) => i >= 0);
  const jefesVencidos = jefes.filter((i) => (est[i] || 0) > 0).length;
  const st = save.stats || {};
  return [
    ['🎮 Partidas', [
      ['Partidas jugadas', fmt(save.games)],
      ['Mejor puntaje', fmt(save.record)],
      ['Récord contrarreloj', fmt(save.tiempo && save.tiempo.record)],
      ['Mejor combo', c.combo ? `x${c.combo}` : '—'],
      ['Líneas limpiadas', fmt(c.lineas)],
      ['Piezas colocadas', fmt(st.piezas)],
      ['Tiempo jugando', horas(st.seg)],
      ['Bloques dorados', fmt(c.oro)],
    ]],
    ['💣 Peligros', [
      ['Bombas desactivadas', fmt(c.bombas)],
      ['Hielo roto', fmt(c.hielo)],
    ]],
    ['🗺️ Aventura', [
      ['Niveles superados', `${nivelesSuperados()}/${NIVELES.length}`],
      ['Estrellas', `${estrellasTotales()}/${NIVELES.length * 3}`],
      ['Jefes vencidos', `${jefesVencidos}/${jefes.length}`],
      ['Racha reto del día', `${fmt(save.reto && save.reto.racha)} días`],
    ]],
    ['🏘️ Pueblo', [
      ['Edificios', `${(save.built || []).length}/${BUILDINGS.length}`],
      ['Cofres de misiones', fmt(c.cofres)],
      ['Medallas', `${totalMedallas()}/${LOGROS.length * 3}`],
      ['Colección', `${porcentajeColeccion()}% · ${tenidas()}/${totalPiezas()}`],
    ]],
  ];
}

export default class Estadisticas extends Phaser.Scene {
  constructor() { super('Estadisticas'); }

  create() {
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.78);
    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 });
    pestanas(this, 'estadisticas');

    let y = 300;
    const TW = 478, TH = 104;
    secciones().forEach(([titulo, filas]) => {
      txt(this, 50, y, titulo, 34, '#ffd93d', { stroke: '#120c30', strokeW: 6 }).setOrigin(0, 0.5);
      y += 44;
      filas.forEach(([label, valor], i) => {
        const x = 40 + (i % 2) * (TW + 44);
        const ty = y + Math.floor(i / 2) * (TH + 14);
        const g = this.add.graphics();
        g.fillStyle(0xf6f2ff, 1); g.fillRoundedRect(x, ty, TW, TH, 24);
        const v = txt(this, x + 26, ty + 38, valor, 42, '#2a1a5e').setOrigin(0, 0.5);
        if (v.width > TW - 44) v.setScale((TW - 44) / v.width);
        txt(this, x + 26, ty + 80, label, 24, '#7a6a9a', { weight: '700' }).setOrigin(0, 0.5);
      });
      y += Math.ceil(filas.length / 2) * (TH + 14) + 22;
    });
    txt(this, W / 2, Math.min(y + 10, 1880), 'Las piezas y el tiempo se cuentan desde noviembre de 2026.', 24, '#b8b0d8', { weight: '700' });
  }
}
