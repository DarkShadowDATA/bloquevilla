import Phaser from 'phaser';
import { W, H } from './config.js';
import Boot from './scenes/Boot.js';
import Menu from './scenes/Menu.js';
import Game from './scenes/Game.js';
import Village from './scenes/Village.js';
import { sfx } from './sfx.js';

// Modo captura (?capture): el juego avanza cuadro por cuadro para grabar videos.
const CAPTURE = location.search.includes('capture');

function setupCapture(game) {
  window.__capture = true;
  window.__capTime = 0;
  window.__sfxLog = [];
  const begin = () => {
    game.loop.sleep();
    window.__capReady = true;
  };
  if (game.isBooted) begin(); else game.events.once('ready', begin);
  // Avanza n cuadros de dt milisegundos
  window.__step = (n = 1, dt = 1000 / 30) => {
    for (let i = 0; i < n; i++) {
      window.__capTime += dt;
      window.__stepping = true;
      game.step(window.__capTime + 1000, dt);
      window.__stepping = false;
    }
    return window.__capTime;
  };
  window.__frame = (q = 0.92) => game.canvas.toDataURL('image/jpeg', q);
}

async function start() {
  // Espera la fuente (máximo 1.5 s) para que el texto no cambie de golpe
  try {
    await Promise.race([
      Promise.all([document.fonts.load('800 40px Poppins'), document.fonts.load('700 40px Poppins')]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch (e) { /* sin fuentes web: usa la del sistema */ }

  const game = new Phaser.Game({
    type: location.search.includes('canvas') ? Phaser.CANVAS : Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#161c4e',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 1 },
    scene: [Boot, Menu, Game, Village],
    render: { preserveDrawingBuffer: CAPTURE },
  });
  if (CAPTURE) setupCapture(game);
  window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
  window.__game = game;
}

start();
