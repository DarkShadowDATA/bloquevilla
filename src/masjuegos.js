// «Más juegos de DarkShadow»: ventanita con tarjetas de los otros juegos PÚBLICOS del estudio.
// Cada tarjeta abre su juego con ?src=bloquevilla&campana=cruce (así web_events mide cuántos pasan de un juego a otro).
// Solo en el menú y en las pantallas de fin de partida o de nivel; nunca a media partida.
// Quien llegó por un anuncio no ve el botón hasta terminar su primera partida o nivel (que se concentre en la primera pieza).
// Nada de juegos privados o en pausa (Tierras del Umbral, Ruta Loca, ¡Jálale!, El Valle…).
import Phaser from 'phaser';
import { W, H } from './config.js';
import { txt, button, marco, UI } from './ui.js';
import { save } from './save.js';
import { track, esAnuncio } from './stats.js';
import { sfx } from './sfx.js';

const Q = '?src=bloquevilla&campana=cruce';
export const URL_ESTUDIO = 'https://darkshadow-studios.com/' + Q;
const JUEGOS = [
  { id: 'pinatazo', nombre: 'Piñatazo', tipo: 'Fusión de dulces', desc: 'Junta dulces iguales hasta formar piñatas y reviéntalas.', url: 'https://pinatazo.darkshadow-studios.com/' + Q, color: 0xe0457f },
  { id: 'leyendas', nombre: 'Noche de Leyendas', tipo: 'Acción y leyendas de México', desc: 'Elige a tu cazador y sobrevive a la noche.', url: 'https://leyendas.darkshadow-studios.com/' + Q, color: 0x7a4ad8 },
  { id: 'ahino', nombre: '¡Ahí No!', tipo: 'Plataformas troll', desc: 'Solo es llegar a la puerta… si la calle te deja.', url: 'https://ahino.darkshadow-studios.com/' + Q, color: 0xf27a2a },
  { id: 'mutantes', nombre: 'Mutantes del Wasteland', tipo: 'Estrategia y evolución', desc: 'Forma tu equipo de mutantes y defiende tu refugio.', url: 'https://mutantes.darkshadow-studios.com/' + Q, color: 0x2fa05a },
  { id: 'mecabestias', nombre: 'MecaBestias', tipo: 'Para computadora · demo gratis', desc: 'Pilota tu bestia mecánica y doma a las salvajes.', url: 'https://mecabestias.darkshadow-studios.com/' + Q, color: 0xd88a1a, soloCompu: true },
];

const enCompu = () => {
  try { return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && !matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
};
export const juegosVisibles = () => JUEGOS.filter((j) => !j.soloCompu || enCompu());

/** ¿Se puede mostrar el botón? Quien llegó por anuncio, solo después de terminar su primera partida o nivel. */
export function puedeMostrar() {
  if (window.__capture) return false;
  const anuncio = esAnuncio() || /_ads$/.test(save.llegada || '');
  return !anuncio || (save.games || 0) > 0 || ((save.aventura && save.aventura.estrellas) || []).some((x) => x > 0);
}

// Abre el link en una pestaña nueva (dentro de itch siempre); si el navegador lo bloquea y no estamos en un marco, en la misma.
function ir(url, juego) {
  track('compartir', { tipo: 'cruce', juego });
  let w = null;
  try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (e) { /* bloqueado */ }
  let enMarco = true;
  try { enMarco = window.top !== window.self; } catch (e) { /* itch */ }
  if (!w && !enMarco) location.href = url;
}

/** Botón «Más juegos de DarkShadow» (si se puede mostrar). Devuelve el botón o null. */
export function botonMasJuegos(scene, x, y, w = 520, h = 84, size = 32) {
  if (!puedeMostrar()) return null;
  const b = button(scene, x, y, w, h, '🎮 Más juegos de DarkShadow', UI.tinta2, () => abrirMasJuegos(scene), { size });
  return b;
}

/** La ventanita con las tarjetas. */
export function abrirMasJuegos(scene) {
  track('compartir', { tipo: 'cruce_ver' });
  const lista = juegosVisibles();
  const layer = scene.add.container(0, 0).setDepth(600);
  layer.add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
  const CH = 250, GAP = 22;
  const alto = 230 + lista.length * (CH + GAP) - GAP + 210;
  const top = Math.max(60, (H - alto) / 2);
  const panel = scene.add.container(W / 2, top + alto / 2).setScale(0.4);
  layer.add(panel);
  const g = scene.add.graphics();
  marco(g, -470, -alto / 2, 940, alto, UI.morado);
  panel.add(g);
  panel.add(txt(scene, 0, -alto / 2 + 80, 'Más juegos de DarkShadow', 54, UI.texto));
  panel.add(txt(scene, 0, -alto / 2 + 145, 'Gratis y sin descargar · los hago yo solo', 30, UI.suave, { weight: '700' }));
  lista.forEach((j, i) => {
    const y = -alto / 2 + 230 + i * (CH + GAP) + CH / 2;
    const c = scene.add.container(0, y);
    const cg = scene.add.graphics();
    cg.fillStyle(UI.papel2, 1); cg.fillRoundedRect(-430, -CH / 2, 860, CH, 34);
    cg.lineStyle(4, j.color, 1); cg.strokeRoundedRect(-430, -CH / 2, 860, CH, 34);
    c.add(cg);
    // imagen del juego con esquinas redondas (máscara)
    const ix = -430 + 18, iw = 315, ih = CH - 36;
    if (scene.textures.exists('mj_' + j.id)) {
      const im = scene.add.image(ix + iw / 2, 0, 'mj_' + j.id).setDisplaySize(iw, ih);
      c.add(im);
    } else {
      const ph = scene.add.graphics(); ph.fillStyle(j.color, 1); ph.fillRoundedRect(ix, -ih / 2, iw, ih, 24); c.add(ph);
    }
    const tx = ix + iw + 26;
    const t1 = txt(scene, tx, -CH / 2 + 46, j.nombre, 38, UI.texto, { ox: 0 });
    if (t1.width > 470) t1.setScale(470 / t1.width);
    c.add(t1);
    c.add(txt(scene, tx, -CH / 2 + 88, j.tipo, 24, Phaser.Display.Color.IntegerToColor(j.color).rgba, { ox: 0, weight: '800' }));
    c.add(txt(scene, tx, -CH / 2 + 112, j.desc, 25, UI.suave, { ox: 0, oy: 0, weight: '700', wrap: 470, align: 'left' }));
    // «Jugar ›»
    const pg = scene.add.graphics();
    pg.fillStyle(j.color, 1); pg.fillRoundedRect(tx, CH / 2 - 70, 190, 52, 26);
    c.add(pg);
    c.add(txt(scene, tx + 95, CH / 2 - 44, 'Jugar ›', 28, '#ffffff'));
    // toda la tarjeta se toca; el link se abre en el mismo toque (si no, Safari bloquea la pestaña nueva)
    c.setSize(860, CH).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { c.setScale(0.97); });
    c.on('pointerout', () => { c.setScale(1); });
    c.on('pointerup', () => { c.setScale(1); sfx.click(); ir(j.url, j.id); });
    panel.add(c);
  });
  const yb = alto / 2 - 150;   // pie: link al estudio y Cerrar, dentro de la ventana
  const todos = txt(scene, 0, yb - 2, 'Ver todo en darkshadow-studios.com', 28, '#5a46c8', { weight: '800' });
  todos.setInteractive({ useHandCursor: true }).on('pointerup', () => ir(URL_ESTUDIO, 'estudio'));
  panel.add(todos);
  const cerrar = button(scene, 0, yb + 80, 320, 76, 'Cerrar', UI.gris, () => layer.destroy(), { size: 32 });
  panel.add(cerrar);
  scene.tweens.add({ targets: panel, scale: 1, duration: 300, ease: 'Back.Out' });
  return layer;
}
