import Phaser from 'phaser';
import { W, H } from '../config.js';
import { save } from '../save.js';
import { nube, loginUrl } from '../nube.js';
import { txt, background, button, toast } from '../ui.js';
import { verPozo, empezarPozo, usd } from '../pozo.js';

// Pozo de la semana: premios en Shadow retirable (USDT/USDC) para el top 5. Misma regla para todos: modo clásico sin poderes,
// 3 intentos al día, y el servidor vuelve a jugar cada partida para validar el puntaje.
export default class Pozo extends Phaser.Scene {
  constructor() { super('Pozo'); }

  create() {
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.78);
    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 });
    txt(this, W / 2, 230, '💰 Pozo de la semana', 70, '#ffd93d', { stroke: '#3a1250', strokeW: 10 });
    txt(this, W / 2, 312, 'Premios en Shadow que puedes cambiar a USDT o USDC', 32, '#d8d0f0', { weight: '700' });
    this.estado = txt(this, W / 2, 860, 'Cargando…', 40, '#ffffff', { weight: '700' });
    if (!nube.on) {
      this.estado.setText(nube.can ? 'Para jugar el Pozo inicia sesión\ncon tu cuenta DarkShadow' : 'El Pozo se juega en\nbloquevilla.darkshadow-studios.com');
      if (nube.can) button(this, W / 2, 1100, 640, 130, 'Iniciar sesión', 0x6a3ab8, () => { location.href = loginUrl(); }, { size: 48 });
      this.reglas(1450);
      return;
    }
    this.cargar();
  }

  reglas(y) {
    txt(this, W / 2, y, 'Modo clásico sin poderes · 3 intentos al día · gana tu mejor partida\nEl servidor revisa cada partida · premios cada lunes al top 5', 28, '#b8b0d8', { weight: '600', align: 'center' });
  }

  async cargar() {
    let d;
    try { d = await verPozo(); } catch (e) { this.estado.setText(e.message || 'Sin conexión. Intenta más tarde'); return; }
    if (!this.sys.isActive()) return;
    this.estado.setVisible(false);
    // premios del top 5
    const g = this.add.graphics();
    g.fillStyle(0x0c0f30, 0.65); g.fillRoundedRect(90, 370, 900, 150, 40);
    ['🥇', '🥈', '🥉', '4º', '5º'].forEach((m, i) => {
      const x = 180 + i * 180, s = d.prizes[i] || 0;
      txt(this, x, 410, m, 40, '#ffffff');
      txt(this, x, 458, `${s} 💠`, 34, '#ffd93d');
      txt(this, x, 496, `${usd(s)} USD`, 22, '#b8b0d8', { weight: '700' });
    });
    const horas = Math.max(0, Math.round((new Date(d.endsAt).getTime() - Date.now()) / 3600e3));
    txt(this, W / 2, 565, `Termina en ${horas >= 24 ? `${Math.floor(horas / 24)} d ${horas % 24} h` : `${horas} h`} · tu mejor: ${d.best.toLocaleString('es-MX')}${d.rank ? ` (#${d.rank})` : ''}`, 32, '#ffffff', { weight: '700' });
    // top 10
    const y0 = 650, alto = 74;
    if (!d.top.length) txt(this, W / 2, 900, '¡Nadie ha jugado esta semana!\nSé el primero', 40, '#ffffff', { weight: '700', align: 'center' });
    d.top.forEach((t, i) => {
      const y = y0 + i * alto, fila = this.add.container(W / 2, y), bg = this.add.graphics();
      const color = t.me ? 0x7a4ad8 : t.rank <= 5 ? 0xb8862a : 0x1c1e4e;
      bg.fillStyle(color, t.me || t.rank <= 5 ? 0.9 : 0.8); bg.fillRoundedRect(-430, -32, 860, 64, 32);
      fila.add(bg);
      fila.add(txt(this, -370, 0, String(t.rank), 34, '#ffffff'));
      fila.add(txt(this, -310, 0, t.name + (t.me ? ' (tú)' : ''), 32, '#ffffff', { weight: '700', ox: 0 }));
      fila.add(txt(this, 390, 0, Number(t.score).toLocaleString('es-MX'), 34, '#ffd93d', { ox: 1 }));
    });
    const left = d.attemptsLeft;
    const b = button(this, W / 2, 1520, 700, 140, left > 0 ? `Jugar (${left} ${left === 1 ? 'intento' : 'intentos'} hoy)` : 'Sin intentos: vuelve mañana', left > 0 ? 0xd8a020 : 0x5a5a7a, async () => {
      if (left <= 0 || this.empezando) return;
      this.empezando = true;
      try { const a = await empezarPozo(); this.scene.start('Game', { pozo: { attemptId: a.attemptId, seed: a.seed } }); }
      catch (e) { this.empezando = false; toast(this, e.message, 1300, 2600); }
    }, { size: 46 });
    if (left <= 0) b.setAlpha(0.8);
    this.reglas(1680);
    if (!save.apodo) txt(this, W / 2, 1780, 'Tip: pon tu apodo en el Ranking para salir con tu nombre', 26, '#d8d0f0', { weight: '600' });
  }
}
