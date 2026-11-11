// Guía «Cómo se juega»: tarjetas con una mini demostración animada que se repite.
// Salen solas la primera vez que aparece cada cosa (y no se vuelven a mostrar); en Ajustes se pueden ver todas otra vez.
import Phaser from 'phaser';
import { W, H } from './config.js';
import { save, persist } from './save.js';
import { sfx } from './sfx.js';
import { txt, button } from './ui.js';

// Demo: tablero chico (R×C) con bloques iniciales y «rondas»: cada ronda agrega bloques, coloca una pieza y limpia líneas.
// Letras de bloques: r o y g b p = colores, gold, bomba, hielo, hueco, cadv (↕), cadh (↔), tierra
export const GUIA = [
  { id: 'basico', titulo: 'Cómo jugar', emoji: '🧱',
    texto: 'Arrastra las piezas al tablero. Llena una fila o una columna completa y se limpia. Si limpias varias seguidas haces COMBO y ganas más puntos.',
    demo: { R: 4, C: 5, cs: 104, y: -20,
      inicio: [[3, 0, 'r'], [3, 1, 'o'], [3, 2, 'y'], [0, 4, 'b'], [1, 4, 'p']],
      rondas: [
        { antes: 'Arrastra la pieza…', pieza: [[3, 3, 'g'], [3, 4, 'g']], filas: [3], despues: '¡Fila completa! Se limpia' },
        { antes: 'Una columna también cuenta', pieza: [[2, 4, 'p'], [3, 4, 'p']], cols: [4], despues: '¡COMBO! Sigue limpiando', golpe: 2 },
      ] } },
  { id: 'bomba', titulo: '¡Bomba!', emoji: '💣',
    texto: 'El número baja 1 con cada pieza que pones. Limpia su fila o columna antes de que llegue a 0, o explota y se acaba la partida. Desactivarla da ladrillos.',
    demo: { R: 3, C: 5, bomba: 3,
      inicio: [[1, 0, 'r'], [1, 1, 'o'], [1, 2, 'bomba'], [1, 3, 'y']],
      rondas: [
        { antes: 'Cada pieza le baja 1…', pieza: [[0, 0, 'b'], [0, 1, 'b']] },
        { antes: '¡Completa su fila!', pieza: [[1, 4, 'g']], filas: [1], despues: '¡DESACTIVADA!', flota: [1, 2, '+ladrillos'] },
      ] } },
  { id: 'hielo', titulo: 'Hielo', emoji: '🧊',
    texto: 'El hielo aguanta 2 líneas: la primera lo agrieta y la segunda lo rompe. Mientras tanto ocupa su casilla.',
    demo: { R: 3, C: 5,
      inicio: [[1, 0, 'r'], [1, 1, 'hielo'], [1, 2, 'y'], [1, 3, 'b']],
      rondas: [
        { antes: '1.ª línea…', pieza: [[1, 4, 'g']], filas: [1], despues: 'Se agrietó (1 de 2)' },
        { add: [[1, 0, 'o'], [1, 2, 'p'], [1, 3, 'r']], antes: '2.ª línea…', pieza: [[1, 4, 'y']], filas: [1], despues: '¡Roto!' },
      ] } },
  { id: 'oro', titulo: 'Bloque dorado', emoji: '✨',
    texto: 'A veces una pieza trae un bloque dorado. Limpia la línea donde quedó y ganas ladrillos extra para tu pueblo.',
    demo: { R: 3, C: 5,
      inicio: [[1, 0, 'r'], [1, 1, 'o'], [1, 2, 'y']],
      rondas: [
        { antes: 'Pon la pieza con oro…', pieza: [[1, 3, 'gold'], [1, 4, 'b']], filas: [1], despues: '¡ORO!', flota: [1, 3, '+ladrillos'] },
      ] } },
  { id: 'cadena', titulo: 'Cadenas', emoji: '⛓️',
    texto: 'Un bloque encadenado solo se rompe en su dirección: la cadena acostada cuando completas su FILA y la cadena parada cuando completas su COLUMNA.',
    demo: { R: 3, C: 5,
      inicio: [[1, 0, 'r'], [1, 1, 'o'], [1, 2, 'cadv'], [1, 3, 'y']],
      rondas: [
        { antes: 'Cadena parada + fila…', pieza: [[1, 4, 'g']], filas: [1], despues: 'No se rompe con la fila' },
        { antes: 'Completa su columna', pieza: [[0, 2, 'b'], [2, 2, 'b']], cols: [2], despues: '¡Ahora sí!' },
      ] } },
  { id: 'hueco', titulo: 'Huecos', emoji: '🕳️',
    texto: 'En un hueco no cabe nada, pero la fila o columna se completa sin él. El hueco se queda ahí todo el nivel.',
    demo: { R: 3, C: 5,
      inicio: [[1, 0, 'r'], [1, 1, 'hueco'], [1, 2, 'y'], [1, 3, 'b']],
      rondas: [
        { antes: 'Llena lo demás…', pieza: [[1, 4, 'g']], filas: [1], despues: '¡Cuenta como completa!' },
      ] } },
  { id: 'raras', titulo: 'Piezas raras', emoji: '🔷',
    texto: 'En algunos niveles salen piezas especiales: cruces, U, esquinas grandes y diagonales. Las diagonales dejan espacios entre sus bloques.',
    demo: { raras: true } },
  { id: 'jefe', titulo: '¡Jefe!', emoji: '👹',
    texto: 'Cada línea le quita 1 de vida y los combos le quitan más. Cada pocas piezas te lanza bloques (tierra, cadenas, hielo o bombas). Gánale antes de quedarte sin espacio.',
    demo: { R: 3, C: 5, jefe: 6, y: 90, cs: 100,
      inicio: [[2, 0, 'r'], [2, 1, 'o'], [2, 2, 'y'], [1, 0, 'b'], [1, 1, 'p'], [1, 2, 'r']],
      rondas: [
        { antes: 'Te lanza tierra…', lanza: [[0, 4, 'tierra'], [1, 3, 'tierra']] },
        { antes: 'Limpia líneas…', pieza: [[2, 3, 'g'], [2, 4, 'g']], filas: [2], despues: '-1 ❤', golpe: 1 },
        { add: [[2, 0, 'o'], [2, 1, 'y'], [2, 2, 'p'], [2, 3, 'b']], antes: '¡Dos a la vez!', pieza: [[1, 4, 'r'], [2, 4, 'r']], filas: [1, 2], despues: '¡Combo! -2 ❤', golpe: 2 },
      ] } },
];

const TEX = { r: 'block_red', o: 'block_orange', y: 'block_yellow', g: 'block_green', b: 'block_blue', p: 'block_purple', gold: 'block_gold' };
const tex = (t) => TEX[t] || 'blk_' + t;

// Corre la demo dentro de «cont» (centrado en 0,0). Se repite hasta que «cont» se destruya.
function demo(scene, cont, D, cap) {
  let vivo = true;
  cont.once('destroy', () => { vivo = false; });
  const later = (ms, fn) => scene.time.delayedCall(ms, () => { if (vivo) fn(); });
  if (D.raras) { demoRaras(scene, cont, later, cap); return; }
  const CS = D.cs || 116, R = D.R, C = D.C;
  const ox = -C * CS / 2, oy = (D.y || 0) - R * CS / 2;
  const g = scene.add.graphics();
  g.fillStyle(0x0e1238, 1); g.fillRoundedRect(ox - 14, oy - 14, C * CS + 28, R * CS + 28, 24);
  g.fillStyle(0x262c66, 1);
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) g.fillRoundedRect(ox + c * CS + 4, oy + r * CS + 4, CS - 8, CS - 8, 12);
  cont.add(g);
  const pos = (r, c) => ({ x: ox + c * CS + CS / 2, y: oy + r * CS + CS / 2 });
  let est = {}, spr = {}, bombaN = 0, bombaTxt = null, vida = 0, vidaG = null, vidaT = null, jefeIm = null;
  const k = (r, c) => r * 100 + c;
  const quita = (r, c) => { const s = spr[k(r, c)]; if (s) s.destroy(); delete spr[k(r, c)]; delete est[k(r, c)]; };
  const pon = (r, c, t, pop) => {
    quita(r, c);
    const { x, y } = pos(r, c);
    const im = scene.add.image(x, y, tex(t)).setDisplaySize(CS - 4, CS - 4);
    cont.add(im);
    est[k(r, c)] = t; spr[k(r, c)] = im;
    if (pop) { const s = im.scaleX; im.setScale(s * 0.6); scene.tweens.add({ targets: im, scaleX: s, scaleY: s, duration: 200, ease: 'Back.Out' }); }
    if (t === 'bomba') {
      bombaTxt = txt(scene, x + 22, y + 24, String(bombaN), 40, '#ffffff', { stroke: '#3a0614', strokeW: 8 });
      cont.add(bombaTxt);
    }
  };
  const flota = (x, y, s, col = '#ffe14a') => {
    const t = txt(scene, x, y, s, 44, col, { stroke: '#2a1206', strokeW: 9 });
    cont.add(t);
    scene.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 1100, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  };
  const pintaVida = () => {
    if (!vidaG) return;
    vidaG.clear();
    vidaG.fillStyle(0x3a0a20, 1); vidaG.fillRoundedRect(-150, oy - 70, 300, 30, 15);
    vidaG.fillStyle(0xff4a6a, 1); if (vida > 0) vidaG.fillRoundedRect(-146, oy - 66, 292 * vida / D.jefe, 22, 11);
    vidaT.setText(`❤ ${vida}/${D.jefe}`);
  };
  if (D.jefe) {
    const key = scene.textures.exists('jefe_topo') ? 'jefe_topo' : 'jefe_generico';
    jefeIm = scene.add.image(0, oy - 170, key);
    jefeIm.setScale(Math.min(170 / jefeIm.width, 170 / jefeIm.height));
    vidaG = scene.add.graphics();
    vidaT = txt(scene, 0, oy - 55, '', 24, '#ffffff', { stroke: '#3a0a20', strokeW: 6 });
    cont.add([jefeIm, vidaG, vidaT]);
    scene.tweens.add({ targets: jefeIm, angle: { from: -4, to: 4 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  const limpiar = (ro) => {
    const filas = ro.filas || [], cols = ro.cols || [];
    const celdas = new Set();
    filas.forEach((r) => { for (let c = 0; c < C; c++) celdas.add(k(r, c)); });
    cols.forEach((c) => { for (let r = 0; r < R; r++) celdas.add(k(r, c)); });
    // destello de las líneas
    filas.forEach((r) => { const f = scene.add.rectangle(0, pos(r, 0).y, C * CS, CS, 0xffffff, 0.6); cont.add(f); scene.tweens.add({ targets: f, alpha: 0, duration: 380, onComplete: () => f.destroy() }); });
    cols.forEach((c) => { const f = scene.add.rectangle(pos(0, c).x, oy + R * CS / 2, CS, R * CS, 0xffffff, 0.6); cont.add(f); scene.tweens.add({ targets: f, alpha: 0, duration: 380, onComplete: () => f.destroy() }); });
    celdas.forEach((key) => {
      const r = Math.floor(key / 100), c = key % 100, t = est[key], im = spr[key];
      if (!t || t === 'hueco') return;
      if ((t === 'cadv' && !cols.includes(c)) || (t === 'cadh' && !filas.includes(r))) {
        scene.tweens.add({ targets: im, angle: { from: -10, to: 10 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => im.setAngle(0) });
        return;
      }
      if (t === 'hielo') { im.setTexture(tex('hielo2')).setDisplaySize(CS - 4, CS - 4); est[key] = 'hielo2'; return; }
      if (t === 'bomba' && bombaTxt) { bombaTxt.destroy(); bombaTxt = null; }
      delete spr[key]; delete est[key];
      scene.tweens.add({ targets: im, scale: im.scale * 1.3, alpha: 0, duration: 260, onComplete: () => im.destroy() });
    });
    sfx.clear(ro.golpe || 1);
  };
  const ronda = (i) => {
    if (i >= D.rondas.length) { later(1300, inicio); return; }
    const ro = D.rondas[i];
    (ro.add || []).forEach(([r, c, t]) => pon(r, c, t, true));
    if (ro.antes) cap.setText(ro.antes);
    if (ro.lanza) {
      ro.lanza.forEach(([r, c, t], n) => later(400 + n * 250, () => {
        const { x, y } = pos(r, c);
        const im = scene.add.image(0, oy - 170, tex(t)).setDisplaySize(CS - 4, CS - 4);
        cont.add(im);
        scene.tweens.add({ targets: im, x, y, duration: 380, ease: 'Quad.In', onComplete: () => { im.destroy(); if (vivo) { pon(r, c, t, true); sfx.place(); } } });
      }));
      later(1700, () => ronda(i + 1));
      return;
    }
    // la pieza sube desde abajo y cae en su lugar
    later(800, () => {
      const ims = ro.pieza.map(([r, c, t]) => {
        const { x, y } = pos(r, c);
        const im = scene.add.image(x, y + 260, tex(t)).setDisplaySize(CS - 4, CS - 4).setAlpha(0.95);
        cont.add(im);
        scene.tweens.add({ targets: im, y, duration: 450, ease: 'Cubic.Out' });
        return im;
      });
      later(500, () => {
        ims.forEach((im) => im.destroy());
        ro.pieza.forEach(([r, c, t]) => pon(r, c, t, false));
        sfx.place();
        if (bombaTxt && bombaN > 1) { bombaN -= 1; bombaTxt.setText(String(bombaN)); scene.tweens.add({ targets: bombaTxt, scale: 1.4, duration: 120, yoyo: true }); sfx.alarma(); }
        if (!ro.filas && !ro.cols) { later(900, () => ronda(i + 1)); return; }
        later(250, () => {
          limpiar(ro);
          if (ro.despues) cap.setText(ro.despues);
          if (ro.flota) { const { x, y } = pos(ro.flota[0], ro.flota[1]); flota(x, y - 20, ro.flota[2]); sfx.coin(); }
          if (ro.golpe && jefeIm && D.jefe) {
            vida = Math.max(0, vida - ro.golpe); pintaVida();
            flota(120, oy - 170, `-${ro.golpe} ❤`, '#ff6a7a');
            scene.tweens.add({ targets: jefeIm, x: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => jefeIm.setX(0) });
          }
          later(1400, () => ronda(i + 1));
        });
      });
    });
  };
  const inicio = () => {
    Object.keys(spr).forEach((key) => spr[key].destroy());
    est = {}; spr = {};
    if (bombaTxt) { bombaTxt.destroy(); bombaTxt = null; }
    bombaN = D.bomba || 0;
    vida = D.jefe || 0; pintaVida();
    D.inicio.forEach(([r, c, t]) => pon(r, c, t, false));
    ronda(0);
  };
  inicio();
}

// Piezas raras: van apareciendo una tras otra
function demoRaras(scene, cont, later, cap) {
  const FORMAS = [
    ['Cruz', [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], 'block_purple'],
    ['U', [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], 'block_orange'],
    ['Esquina grande', [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], 'block_blue'],
    ['Diagonal', [[0, 0], [1, 1], [2, 2]], 'block_green'],
  ];
  const CS = 74;
  let n = 0, grupo = null;
  const sig = () => {
    if (grupo) grupo.destroy();
    const [nombre, celdas, key] = FORMAS[n % FORMAS.length];
    grupo = scene.add.container(0, -10);
    cont.add(grupo);
    celdas.forEach(([r, c]) => grupo.add(scene.add.image((c - 1) * CS, (r - 1) * CS, key).setDisplaySize(CS - 4, CS - 4)));
    grupo.setScale(0.3);
    scene.tweens.add({ targets: grupo, scale: 1, angle: { from: -90, to: 0 }, duration: 380, ease: 'Back.Out' });
    cap.setText(nombre);
    sfx.pick();
    n++;
    later(1500, sig);
  };
  sig();
}

// Muestra una tarjeta. «auto» = salió sola en la partida (se marca como vista). Devuelve la capa.
export function mostrarGuia(scene, id, { auto = false, alCerrar = null } = {}) {
  const G = GUIA.find((x) => x.id === id);
  if (!G) return null;
  if (auto) {
    save.guia = save.guia || { vistos: [] };
    if (!save.guia.vistos.includes(id)) save.guia.vistos.push(id);
    persist();
  }
  if (scene.cancelDrag) scene.cancelDrag();
  const layer = scene.add.container(0, 0).setDepth(400);
  layer.add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
  const panel = scene.add.container(W / 2, 930).setScale(0.3);
  layer.add(panel);
  scene.tweens.add({ targets: panel, scale: 1, duration: 300, ease: 'Back.Out' });
  const g = scene.add.graphics();
  g.fillStyle(0x3a2a7a, 1); g.fillRoundedRect(-470, -600, 940, 1210, 50);
  g.fillStyle(0xf6f2ff, 1); g.fillRoundedRect(-470, -610, 940, 1200, 50);
  panel.add(g);
  panel.add(txt(scene, 0, -535, `${G.emoji} ${G.titulo}`, 62, '#2a1a5e'));
  const zona = scene.add.container(0, -170);
  panel.add(zona);
  const cap = txt(scene, 0, 110, '', 40, '#3a7ad8');
  panel.add(cap);
  demo(scene, zona, G.demo, cap);
  panel.add(txt(scene, 0, 255, G.texto, 32, '#4a3a6e', { weight: '700', wrap: 820 }));
  const cerrar = () => {
    scene.tweens.add({ targets: panel, scale: 0.3, alpha: 0, duration: 180, onComplete: () => { layer.destroy(true); if (alCerrar) alCerrar(); } });
  };
  panel.add(button(scene, 0, 480, 460, 110, '¡Entendido!', 0x4ab86a, cerrar, { size: 44 }));
  return layer;
}

// Lista de todas las tarjetas (desde Ajustes)
export function abrirListaGuia(scene) {
  const layer = scene.add.container(0, 0).setDepth(350);
  layer.add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
  const g = scene.add.graphics();
  g.fillStyle(0x3a2a7a, 1); g.fillRoundedRect(70, 330, 940, 1260, 50);
  g.fillStyle(0xf6f2ff, 1); g.fillRoundedRect(70, 320, 940, 1250, 50);
  layer.add(g);
  layer.add(txt(scene, W / 2, 400, '📘 Cómo se juega', 58, '#2a1a5e'));
  GUIA.forEach((G, i) => {
    const x = W / 2 + (i % 2 ? 215 : -215), y = 540 + Math.floor(i / 2) * 170;
    layer.add(button(scene, x, y, 400, 130, `${G.emoji} ${G.titulo}`, 0x3a7ad8, () => mostrarGuia(scene, G.id), { size: 36 }));
  });
  layer.add(button(scene, W / 2, 1460, 420, 104, 'Listo', 0x4ab86a, () => layer.destroy(true), { size: 42 }));
  return layer;
}

export const guiaVista = (id) => !!(save.guia && save.guia.vistos && save.guia.vistos.includes(id));
void Phaser;
