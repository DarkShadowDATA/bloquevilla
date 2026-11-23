import Phaser from 'phaser';
import { W, H } from '../config.js';
import { save } from '../save.js';
import { nube, loginUrl } from '../nube.js';
import { txt, background, button, toast, backBtn, topBar, icon, UI } from '../ui.js';
import { verPozo, empezarPozo, PREMIO_SEMANAL } from '../pozo.js';

// Reto semanal (la escena se sigue llamando 'Pozo'): ranking de la semana con premios solo del juego para el top 10.
// Misma regla para todos: modo clásico sin poderes, 3 intentos al día, y el servidor vuelve a jugar cada partida.
export default class Pozo extends Phaser.Scene {
  constructor() { super('Pozo'); }

  create() {
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.78);
    backBtn(this, () => this.scene.start('Menu'));
    topBar(this, 'Reto semanal');
    icon(this, 905, 110, 'ui_trofeo', 80).setDepth(45);
    txt(this, W / 2, 272, 'La misma partida para todos · el top 10 gana ladrillos', 32, '#d8d0f0', { weight: '700' });
    const R = save.retoSemanal;
    if (R.top10) txt(this, W / 2, 318, `Tus podios: 🥇 ${R.oro} · 🥈 ${R.plata} · 🥉 ${R.bronce} · top 10: ${R.top10}`, 28, '#ffd93d', { weight: '700' });
    this.estado = txt(this, W / 2, 860, 'Cargando…', 40, '#ffffff', { weight: '700' });
    if (!nube.on) {
      this.estado.setText(nube.can ? 'Para jugar el Reto semanal inicia sesión\ncon tu cuenta DarkShadow' : 'El Reto semanal se juega en\nbloquevilla.darkshadow-studios.com');
      this.premios();
      if (nube.can) button(this, W / 2, 1100, 640, 130, 'Iniciar sesión', 0x6a3ab8, () => { location.href = loginUrl(); }, { size: 48 });
      this.reglas(1450);
      return;
    }
    this.cargar();
  }

  reglas(y) {
    txt(this, W / 2, y, 'Modo clásico sin poderes · 3 intentos al día · cuenta tu mejor partida\nEl servidor revisa cada partida · los premios se cobran solos el lunes', 28, '#b8b0d8', { weight: '600', align: 'center' });
  }

  // Premios del juego para el top 10 (ladrillos + medalla de podio)
  premios() {
    const g = this.add.graphics();
    g.fillStyle(UI.tinta, 0.85); g.fillRoundedRect(90, 370, 900, 150, 40);
    g.lineStyle(3, 0xffffff, 0.12); g.strokeRoundedRect(90, 370, 900, 150, 40);
    [['🥇', PREMIO_SEMANAL[0]], ['🥈', PREMIO_SEMANAL[1]], ['🥉', PREMIO_SEMANAL[2]], ['4º–10º', PREMIO_SEMANAL[3]]].forEach(([m, n], i) => {
      const x = 205 + i * 225;
      txt(this, x, 412, m, m.length > 2 ? 30 : 42, '#ffffff');
      const t = txt(this, x + 18, 470, `+${n}`, 36, '#ffd93d');
      icon(this, x + 18 - t.width / 2 - 30, 470, 'ui_ladrillo', 42);
    });
  }

  async cargar() {
    let d;
    try { d = await verPozo(); } catch (e) { this.estado.setText(e.message || 'Sin conexión. Intenta más tarde'); return; }
    if (!this.sys.isActive()) return;
    if (!d || !Array.isArray(d.top)) { this.estado.setText('Sin conexión. Intenta más tarde'); return; }
    d.best = Number(d.best) || 0;
    this.estado.setVisible(false);
    this.premios();
    const horas = Math.max(0, Math.round((new Date(d.endsAt).getTime() - Date.now()) / 3600e3));
    txt(this, W / 2, 565, `Termina en ${horas >= 24 ? `${Math.floor(horas / 24)} d ${horas % 24} h` : `${horas} h`} · tu mejor: ${d.best.toLocaleString('es-MX')}${d.rank ? ` (#${d.rank})` : ''}`, 32, '#ffffff', { weight: '700' });
    // top 10
    const y0 = 650, alto = 74;
    if (!d.top.length) txt(this, W / 2, 900, '¡Nadie ha jugado esta semana!\nSé el primero', 40, '#ffffff', { weight: '700', align: 'center' });
    d.top.forEach((t, i) => {
      const y = y0 + i * alto, fila = this.add.container(W / 2, y), bg = this.add.graphics();
      const color = t.me ? 0x7a4ad8 : t.rank <= 3 ? 0xb8862a : UI.tinta2;
      bg.fillStyle(color, t.me || t.rank <= 3 ? 0.9 : 0.85); bg.fillRoundedRect(-430, -32, 860, 64, 32);
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
