// Ventana de Ajustes (se abre con el engrane del menú): volumen de sonidos y música, vibración y estadísticas.
import Phaser from 'phaser';
import { W, H, VERSION } from './config.js';
import { save, persist } from './save.js';
import { sfx, vibe } from './sfx.js';
import { musica } from './musica.js';
import { txt, button } from './ui.js';

const PUEDE_VIBRAR = typeof navigator !== 'undefined' && !!navigator.vibrate;

// Barra de 5 niveles (0 apagado … 4 fuerte): se toca el nivel que quieras
function barra(scene, panel, y, etiqueta, valor, alCambiar) {
  panel.add(txt(scene, -380, y - 58, etiqueta, 40, '#2a1a5e').setOrigin(0, 0.5));
  const estado = txt(scene, 380, y - 58, '', 30, '#6a5a8a', { weight: '700' }).setOrigin(1, 0.5);
  panel.add(estado);
  const g = scene.add.graphics();
  panel.add(g);
  let v = valor;
  const pinta = () => {
    g.clear();
    for (let i = 0; i <= 4; i++) {
      const x = -380 + i * 156, on = i <= v && v > 0;
      const alto = 34 + i * 12;
      g.fillStyle(i === 0 ? (v === 0 ? 0xe04a4a : 0xd6d0ea) : on ? 0x4ab86a : 0xd6d0ea, 1);
      g.fillRoundedRect(x, y + 40 - alto, 136, alto, 14);
    }
    estado.setText(v === 0 ? 'Apagado' : ['', 'Bajo', 'Medio', 'Normal', 'Fuerte'][v]);
  };
  pinta();
  // icono de silencio sobre la primera casilla
  panel.add(txt(scene, -312, y + 16, '🔇', 30));
  const zona = scene.add.zone(0, y + 10, 800, 90).setInteractive();
  panel.add(zona);
  zona.on('pointerdown', (p) => {
    const lx = (p.x - W / 2) / panel.scale + 380;
    v = Phaser.Math.Clamp(Math.floor(lx / 156), 0, 4);
    pinta();
    alCambiar(v);
  });
}

function interruptor(scene, panel, y, etiqueta, valor, alCambiar, nota) {
  panel.add(txt(scene, -380, y, etiqueta, 40, '#2a1a5e').setOrigin(0, 0.5));
  if (nota) panel.add(txt(scene, -380, y + 44, nota, 24, '#8a7aa8', { weight: '700' }).setOrigin(0, 0.5));
  const g = scene.add.graphics();
  const t = txt(scene, 0, 0, '', 30);
  panel.add([g, t]);
  let v = valor;
  const pinta = () => {
    g.clear();
    g.fillStyle(v ? 0x4ab86a : 0xb8b0d0, 1); g.fillRoundedRect(220, y - 40, 160, 80, 40);
    g.fillStyle(0xffffff, 1); g.fillCircle(v ? 340 : 260, y, 32);
    t.setText(v ? 'Sí' : 'No').setPosition(v ? 268 : 330, y);
  };
  pinta();
  const zona = scene.add.zone(300, y, 200, 100).setInteractive();
  panel.add(zona);
  zona.on('pointerdown', () => { v = !v; pinta(); alCambiar(v); });
}

export function abrirAjustes(scene) {
  const layer = scene.add.container(0, 0).setDepth(300);
  layer.add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setInteractive());
  const panel = scene.add.container(W / 2, 930).setScale(0.3);
  layer.add(panel);
  scene.tweens.add({ targets: panel, scale: 1, duration: 300, ease: 'Back.Out' });
  const g = scene.add.graphics();
  g.fillStyle(0x3a2a7a, 1); g.fillRoundedRect(-460, -560, 920, 1130, 50);
  g.fillStyle(0xf6f2ff, 1); g.fillRoundedRect(-460, -570, 920, 1120, 50);
  panel.add(g);
  panel.add(txt(scene, 0, -490, 'Ajustes', 64, '#2a1a5e'));

  barra(scene, panel, -330, '🔊 Sonidos', save.sound === false ? 0 : save.volSfx ?? 3, (v) => {
    save.volSfx = v; save.sound = v > 0; persist(); sfx.click();
  });
  barra(scene, panel, -140, '🎵 Música', save.volMus ?? 2, (v) => { save.volMus = v; persist(); musica.actualizar(); });
  interruptor(scene, panel, 30, '📳 Vibración', save.vibe !== false, (v) => { save.vibe = v; persist(); if (v) vibe(60); sfx.click(); },
    PUEDE_VIBRAR ? null : 'Tu celular o navegador no permite vibrar');

  const cerrar = () => {
    scene.tweens.add({ targets: panel, scale: 0.3, alpha: 0, duration: 180, onComplete: () => layer.destroy() });
  };
  panel.add(button(scene, 0, 200, 600, 104, '📊 Mis estadísticas', 0x3a7ad8, () => { layer.destroy(); scene.scene.start('Estadisticas'); }, { size: 38 }));
  panel.add(button(scene, 0, 350, 420, 104, 'Listo', 0x4ab86a, cerrar, { size: 42 }));
  panel.add(txt(scene, 0, 480, `Bloquevilla v${VERSION} · DarkShadow Studios`, 26, '#8a7aa8', { weight: '700' }));
  return layer;
}
