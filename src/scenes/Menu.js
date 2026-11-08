import Phaser from 'phaser';
import { W, H, COLORS, HEX, BUILDINGS, DAILY, NOMBRE_TEMA } from '../config.js';
import { nube, loginUrl } from '../nube.js';
import { save, persist, isBuilt, dailyAvailable, dailyIndex, today } from '../save.js';
import { EVENTO, eventoActivo, diasRestantes } from '../evento.js';
import { retoNumero } from '../reto.js';
import { sfx } from '../sfx.js';
import { txt, background, icon, button, toast, confetti } from '../ui.js';
import { premioPendiente, cobrarPremio } from '../ranking.js';
import { multRegalo } from '../bonos.js';
import { misionesHoy, porCobrar, cobrar, abrirCofre, cofreListo, cumplida, textoMision, iconoMision, PREMIO_MISION, COFRE, faltaParaNuevas } from '../misiones.js';
import { POWERS } from '../powers.js';

export default class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    background(this, 'bg_menu', 'grad_menu');
    this.floatingBlocks();

    // Logo: imagen si existe, si no letras de colores
    if (this.textures.exists('logo')) {
      const lg = icon(this, W / 2, 390, 'logo', 860).setScale(0);
      const s = 860 / this.textures.get('logo').getSourceImage().width;
      this.tweens.add({ targets: lg, scale: s, duration: 600, ease: 'Back.Out' });
    } else {
      const word = 'Bloquevilla';
      const sizeL = 132;
      const widths = [...word].map((ch) => this.measure(ch, sizeL));
      let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2;
      [...word].forEach((ch, i) => {
        const col = '#' + HEX[COLORS[i % COLORS.length]].toString(16).padStart(6, '0');
        const t = txt(this, x + widths[i] / 2, 390, ch, sizeL, col, { stroke: '#1e1446', strokeW: 16 }).setScale(0);
        this.tweens.add({ targets: t, scale: 1, duration: 420, delay: i * 55, ease: 'Back.Out' });
        this.tweens.add({ targets: t, y: 375, duration: 900, delay: 800 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        x += widths[i];
      });
    }
    txt(this, W / 2, 545, 'Puzzle de bloques · reconstruye tu pueblo', 36, '#ffffff', { weight: '700', stroke: '#1e144688', strokeW: 6 });

    // Estadísticas
    const built = save.built.length;
    if (eventoActivo()) this.bannerEvento();
    else {
      // Pozo de la semana: premios en Shadow retirable
      const pb = button(this, W / 2, 720, 640, 110, '💰 Pozo de la semana', 0xd8a020, () => this.scene.start('Pozo'), { size: 44 });
      this.tweens.add({ targets: pb, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    this.statRow(890, [
      ['ui_trofeo', save.record.toLocaleString('es-MX')],
      ['ui_ladrillo', String(save.bricks)],
      ['ui_estrella', `${built}/${BUILDINGS.length}`],
    ]);

    if (save.partida) {
      const pts = (save.partida.score || 0).toLocaleString('es-MX');
      const cb = button(this, W / 2 - 110, 1040, 420, 150, 'Continuar', 0x5ac85a, () => this.scene.start('Game', { reto: false, modo: null }), { size: 60 });
      txt(this, W / 2 - 110, 1100, `Tu partida: ${pts} pts`, 24, '#ffffff', { weight: '700' });
      this.tweens.add({ targets: cb, scale: 1.04, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      button(this, W / 2 + 215, 1040, 200, 150, 'Nueva', 0x3c8a4a, () => {
        save.partida = null;
        persist();
        this.scene.start('Game', { reto: false, modo: null, nueva: true });
      }, { size: 40 });
    } else {
      button(this, W / 2, 1040, 640, 150, 'Jugar', 0x5ac85a, () => this.scene.start('Game', { reto: false, modo: null }), { size: 72 });
    }
    const hecho = save.reto.last === today();
    const rb = button(this, W / 2 - 165, 1182, 310, 104, hecho ? `Reto #${retoNumero(today())} ✓` : `Reto del día`,
      hecho ? 0x5a4a8a : 0x7a4ad8, () => this.scene.start('Game', { reto: true }), { size: 38 });
    const av = button(this, W / 2 + 165, 1182, 310, 104, 'Aventura', 0x2e9a5a, () => this.scene.start('Aventura'), { size: 40 });
    if (!(save.aventura.estrellas || []).some((e) => e > 0)) {
      const nva = txt(this, W / 2 + 290, 1138, '¡NUEVO!', 26, '#ffffff', { stroke: '#c8282a', strokeW: 8 }).setAngle(12).setDepth(5);
      this.tweens.add({ targets: [nva, av], scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
    }
    if (!hecho) this.tweens.add({ targets: rb, scale: 1.04, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const tb60 = button(this, W / 2 - 75, 1300, 490, 104, 'Contrarreloj 60 s', 0x1f9aa8, () => this.scene.start('Game', { reto: false, modo: 'tiempo' }), { size: 42 });
    if (!save.tiempo.partidas) {
      const nuevo = txt(this, W / 2 + 140, 1258, '¡NUEVO!', 28, '#ffffff', { stroke: '#c8282a', strokeW: 8 }).setAngle(12).setDepth(5);
      this.tweens.add({ targets: nuevo, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    } else if (save.tiempo.record) {
      tb60.label.setText(`60 s · récord ${save.tiempo.record.toLocaleString('es-MX')}`).setFontSize(36);
    }
    button(this, W / 2 - 165, 1418, 310, 104, 'Mi pueblo', 0xff8c2b, () => this.scene.start('Village'), { size: 40 });
    button(this, W / 2 + 245, 1300, 150, 104, '🏆', 0xd8a020, () => this.scene.start('Ranking'), { size: 52 });
    button(this, W / 2 + 165, 1418, 310, 104, '  Tienda', 0xd8a020, () => this.scene.start('Shop'), { size: 40, iconKey: 'ui_tienda' });
    if (!save.tienda.visto) {
      const nv = txt(this, W / 2 + 290, 1372, '¡NUEVO!', 26, '#ffffff', { stroke: '#c8282a', strokeW: 8 }).setAngle(12).setDepth(5);
      this.tweens.add({ targets: nv, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    }

    // Misiones diarias (izquierda) y Regalo diario (derecha)
    const M = misionesHoy();
    const hechas = M.lista.filter(cumplida).length;
    const pend = porCobrar();
    const mb = button(this, W / 2 - 165, 1540, 310, 104, `Misiones ${hechas}/3`, 0x3a7ad8, () => this.openMisiones(), { size: 38 });
    if (pend) {
      this.tweens.add({ targets: mb, scale: 1.05, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const bc = this.add.circle(W / 2 - 22, 1494, 26, 0xe83a3a).setStrokeStyle(5, 0xffffff).setDepth(6);
      const bt = txt(this, W / 2 - 22, 1494, String(pend), 30).setDepth(7);
      this.tweens.add({ targets: [bc, bt], scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    } else if (!save.misionesVistas) {
      const nv = txt(this, W / 2 - 40, 1494, '¡NUEVO!', 26, '#ffffff', { stroke: '#c8282a', strokeW: 8 }).setAngle(12).setDepth(5);
      this.tweens.add({ targets: nv, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    }
    if (dailyAvailable()) {
      const b = button(this, W / 2 + 165, 1540, 310, 104, ' Regalo', 0xd84a8a, () => this.openDaily(), { size: 40, iconKey: 'ui_regalo' });
      this.tweens.add({ targets: b, scale: 1.05, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else if (!isBuilt('panaderia')) {
      button(this, W / 2 + 165, 1540, 310, 104, 'Regalo 🔒', 0x6a5a7a, () => toast(this, 'Construye la Panadería para recibir regalos diarios', 1400, 2200), { size: 36 });
    } else {
      button(this, W / 2 + 165, 1540, 310, 104, 'Regalo ✓', 0x6a5a7a, () => toast(this, 'Vuelve mañana por tu regalo diario', 1400, 2000), { size: 36 });
    }

    // Ajustes
    this.toggle(960, 120, 'ui_sonido', save.sound, (v) => { save.sound = v; persist(); });
    this.cuenta();
    const temas = ['clasico'];
    if (isBuilt('pozo')) temas.push('agua');
    if (save.muertos.tema) temas.push('muertos');
    save.tienda.temas.forEach((t) => temas.push(t));
    if (temas.length > 1) {
      if (!temas.includes(save.theme)) save.theme = 'clasico';
      const nombre = { clasico: eventoActivo() ? 'Evento' : 'Clásico', agua: 'Agua', muertos: 'Día de Muertos', ...NOMBRE_TEMA };
      const label = () => `Bloques: ${nombre[save.theme]}`;
      const tb = button(this, W / 2, 1668, 480, 90, label(), 0x2c6ab0, () => {
        save.theme = temas[(temas.indexOf(save.theme) + 1) % temas.length];
        persist();
        tb.label.setText(label());
      }, { size: 34 });
    }
    premioPendiente().then((p) => {
      if (!p || !this.sys.isActive()) return;
      cobrarPremio(p);
      sfx.build();
      confetti(this, W / 2, 700, 90);
      toast(this, `¡Quedaste #${p.lugar} en el ranking de la semana pasada! +${p.premio} ladrillos`, 700, 3500);
    }).catch(() => {});
    txt(this, W / 2, H - 60, 'v1.4 · Tienda Shadow', 24, '#ffffffaa', { weight: '500' });
  }

  bannerEvento() {
    const pp = this.add.image(W / 2, 0, 'deco_papel_picado').setOrigin(0.5, 0);
    pp.setDisplaySize(W + 40, (W + 40) * (pp.height / pp.width));
    this.tweens.add({ targets: pp, angle: { from: -0.6, to: 0.6 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const m = this.add.image(W / 2, 710, 'evento_marco');
    const ratio = m.height / m.width;
    const h = Math.min(820 * ratio, 230);
    m.setDisplaySize(h / ratio, h);
    const dias = diasRestantes();
    txt(this, W / 2, 680, 'DÍA DE MUERTOS', 50, '#ffd23f', { stroke: '#3a1240', strokeW: 8 });
    const f = save.muertos.tema ? '¡Tema desbloqueado!' : `${save.muertos.flores}/${EVENTO.meta} flores`;
    txt(this, W / 2 + 26, 740, `${f} · ${dias === 1 ? 'último día' : `quedan ${dias} días`}`, 30, '#ffffff', { weight: '700', stroke: '#3a1240', strokeW: 6 });
    const t = txt(this, 0, 0, `${f} · ${dias === 1 ? 'último día' : `quedan ${dias} días`}`, 30, '#ffffff', { weight: '700' });
    const w = t.width; t.destroy();
    const fl = icon(this, W / 2 + 26 - w / 2 - 30, 740, 'ui_flor', 44);
    this.tweens.add({ targets: fl, angle: 360, duration: 6000, repeat: -1 });
  }

  measure(ch, size) {
    const t = txt(this, -999, -999, ch, size, '#fff', { stroke: '#000', strokeW: 16 });
    const w = t.width - 16;
    t.destroy();
    return w;
  }

  floatingBlocks() {
    for (let i = 0; i < 14; i++) {
      const key = 'block_' + COLORS[i % COLORS.length];
      const b = this.add.image(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(0, H), key).setAlpha(0.25);
      b.setDisplaySize(70, 70);
      b.angle = Phaser.Math.Between(-30, 30);
      this.tweens.add({ targets: b, y: b.y - 300, angle: b.angle + 40, duration: Phaser.Math.Between(6000, 11000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }

  statRow(y, items) {
    const g = this.add.graphics();
    g.fillStyle(0x0c0f30, 0.55);
    g.fillRoundedRect(110, y - 60, 860, 120, 60);
    items.forEach(([key, val], i) => {
      const x = 250 + i * 290;
      icon(this, x - 60, y, key, 62);
      txt(this, x + 30, y, val, 42);
    });
  }

  // Cuenta DarkShadow (arriba a la izquierda): guardado en la nube y Shadow. Dentro de itch no se muestra.
  cuenta() {
    if (!nube.on && !nube.can) return;
    const label = nube.on ? `☁️ ${nube.name}`.slice(0, 18) : '👤 Iniciar sesión';
    const b = button(this, 190, 120, 320, 84, label, nube.on ? 0x2c3070 : 0x6a3ab8, () => {
      if (nube.on) toast(this, 'Tu partida se guarda en tu cuenta DarkShadow', 900, 2200);
      else location.href = loginUrl();
    }, { size: nube.on ? 30 : 32 });
    b.label.setFontSize(Math.min(32, Math.floor(30 * 280 / Math.max(280, b.label.width))));
    if (save.fundador) {
      const f = txt(this, 190, 192, '👑 Fundador', 28, '#ffd93d', { stroke: '#3a1250', strokeW: 8 });
      this.tweens.add({ targets: f, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }

  toggle(x, y, key, on, cb) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x0c0f30, 0.55);
    g.fillCircle(0, 0, 58);
    const im = icon(this, 0, 0, key, 70).setAlpha(on ? 1 : 0.35);
    const slash = this.add.graphics();
    const drawSlash = (v) => { slash.clear(); if (!v) { slash.lineStyle(8, 0xff5a5f, 1); slash.lineBetween(-36, -36, 36, 36); } };
    drawSlash(on);
    c.add([g, im, slash]);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, 58), Phaser.Geom.Circle.Contains);
    let v = on;
    c.on('pointerdown', () => { v = !v; im.setAlpha(v ? 1 : 0.35); drawSlash(v); cb(v); sfx.click(); });
  }

  openMisiones() {
    if (!save.misionesVistas) { save.misionesVistas = true; persist(); }
    const M = misionesHoy();
    const layer = this.add.container(0, 0).setDepth(300);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setInteractive());
    const panel = this.add.container(W / 2, 960).setScale(0.3);
    layer.add(panel);
    this.tweens.add({ targets: panel, scale: 1, duration: 320, ease: 'Back.Out' });
    const g = this.add.graphics();
    g.fillStyle(0x1e4a8a, 1); g.fillRoundedRect(-460, -560, 920, 1130, 50);
    g.fillStyle(0xf2f7ff, 1); g.fillRoundedRect(-460, -570, 920, 1120, 50);
    panel.add(g);
    panel.add(txt(this, 0, -490, 'Misiones del día', 64, '#163a6e'));
    panel.add(txt(this, 0, -420, `Nuevas en ${faltaParaNuevas()}`, 30, '#5a7aa8', { weight: '700' }));
    const DIF = ['Fácil', 'Media', 'Difícil'];
    const DCOL = [0x4ab86a, 0xe8a020, 0xe04a4a];
    M.lista.forEach((m, i) => {
      const y = -280 + i * 215;
      const ok = cumplida(m);
      const card = this.add.graphics();
      card.fillStyle(m.cobrada ? 0xdfe6f0 : 0xffffff, 1); card.fillRoundedRect(-420, y - 90, 840, 180, 30);
      card.lineStyle(5, ok && !m.cobrada ? 0x4ab86a : 0xc8d4e6, 1); card.strokeRoundedRect(-420, y - 90, 840, 180, 30);
      card.fillStyle(DCOL[m.dif], 1); card.fillRoundedRect(-405, y - 75, 12, 150, 6);
      panel.add(card);
      panel.add(icon(this, -330, y, iconoMision(m), 86));
      panel.add(txt(this, -260, y - 50, DIF[m.dif], 26, Phaser.Display.Color.IntegerToColor(DCOL[m.dif]).rgba, { weight: '800' }).setOrigin(0, 0.5));
      const tm = txt(this, -260, y - 8, textoMision(m), 32, '#163a6e', { weight: '700' }).setOrigin(0, 0.5);
      if (tm.width > 440) tm.setScale(440 / tm.width);
      panel.add(tm);
      // barra de progreso
      const bar = this.add.graphics();
      bar.fillStyle(0xdde6f2, 1); bar.fillRoundedRect(-260, y + 38, 380, 26, 13);
      bar.fillStyle(ok ? 0x4ab86a : 0x3a7ad8, 1); bar.fillRoundedRect(-260, y + 38, Math.max(26, 380 * Math.min(1, m.p / m.n)), 26, 13);
      panel.add(bar);
      panel.add(txt(this, -70, y + 51, `${Math.min(m.p, m.n).toLocaleString('es-MX')} / ${m.n.toLocaleString('es-MX')}`, 22, '#163a6e', { weight: '800' }));
      const premio = PREMIO_MISION[m.dif];
      if (m.cobrada) {
        panel.add(txt(this, 300, y, '✓ Cobrada', 34, '#4a8a5a', { weight: '800' }));
      } else if (ok) {
        const b = button(this, 300, y, 210, 100, `+${premio}`, 0x4ab86a, () => {
          const n = cobrar(i);
          if (!n) return;
          sfx.build();
          confetti(this, W / 2, 700, 50);
          toast(this, `+${n} ladrillos`, 700, 1200);
          this.time.delayedCall(700, () => { layer.destroy(); this.openMisiones(); });
        }, { size: 40, iconKey: 'ui_ladrillo' });
        this.tweens.add({ targets: b, scale: 1.07, duration: 450, yoyo: true, repeat: -1 });
        panel.add(b);
      } else {
        panel.add(icon(this, 260, y, 'ui_ladrillo', 56));
        panel.add(txt(this, 330, y, `+${premio}`, 40, '#c8502a'));
      }
    });
    // Cofre por cumplir las 3
    const yc = 370;
    const cg = this.add.graphics();
    cg.fillStyle(M.cofre ? 0xdfe6f0 : 0xfff3c8, 1); cg.fillRoundedRect(-420, yc - 75, 840, 150, 30);
    cg.lineStyle(5, cofreListo() ? 0xe8a020 : 0xe6d8a8, 1); cg.strokeRoundedRect(-420, yc - 75, 840, 150, 30);
    panel.add(cg);
    panel.add(txt(this, -330, yc, '🎁', 72));
    panel.add(txt(this, -260, yc - 24, 'Cofre de las 3 misiones', 32, '#6a4a08', { weight: '800' }).setOrigin(0, 0.5));
    panel.add(txt(this, -260, yc + 22, `+${COFRE.ladrillos} ladrillos y un poder gratis`, 26, '#8a6a28', { weight: '700' }).setOrigin(0, 0.5));
    if (M.cofre) {
      panel.add(txt(this, 300, yc, '✓ Abierto', 34, '#4a8a5a', { weight: '800' }));
    } else if (cofreListo()) {
      const b = button(this, 300, yc, 210, 100, 'Abrir', 0xe8a020, () => {
        const r = abrirCofre();
        if (!r) return;
        sfx.build();
        confetti(this, W / 2, 700, 110);
        const pw = r.poder ? ` y ${POWERS[r.poder] ? POWERS[r.poder].name : r.poder} para tu próxima partida` : '';
        toast(this, `+${r.ladrillos} ladrillos${pw}`, 700, 2400);
        this.time.delayedCall(900, () => { layer.destroy(); this.openMisiones(); });
      }, { size: 40 });
      this.tweens.add({ targets: b, scale: 1.08, duration: 450, yoyo: true, repeat: -1 });
      panel.add(b);
    } else {
      panel.add(txt(this, 300, yc, `${M.lista.filter((m) => m.cobrada).length}/3`, 40, '#8a6a28'));
    }
    panel.add(button(this, 0, 495, 420, 100, 'Cerrar', 0x3a7ad8, () => this.scene.restart({ reto: false }), { size: 40 }));
  }

  openDaily() {
    const layer = this.add.container(0, 0).setDepth(300);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setInteractive());
    const panel = this.add.container(W / 2, 960).setScale(0.3);
    layer.add(panel);
    const g = this.add.graphics();
    g.fillStyle(0xa03a6a, 1); g.fillRoundedRect(-450, -420, 900, 850, 50);
    g.fillStyle(0xfff4fa, 1); g.fillRoundedRect(-450, -430, 900, 840, 50);
    panel.add(g);
    panel.add(txt(this, 0, -350, 'Regalo diario', 66, '#6a1e4a'));
    panel.add(txt(this, 0, -280, 'Entra cada día para que el regalo crezca', 30, '#9a6a88', { weight: '700' }));
    const idx = dailyIndex();
    DAILY.forEach((base, i) => {
      const amt = base * multRegalo();
      const row = i < 4 ? 0 : 1;
      const col = row === 0 ? i : i - 4;
      const perRow = row === 0 ? 4 : 3;
      const x = (col - (perRow - 1) / 2) * 200;
      const y = -140 + row * 220;
      const box = this.add.graphics();
      const cur = i === idx, past = i < idx;
      box.fillStyle(cur ? 0xffd23f : past ? 0xd8c8d8 : 0xffffff, 1);
      box.fillRoundedRect(x - 85, y - 95, 170, 190, 26);
      box.lineStyle(cur ? 8 : 4, cur ? 0xe08a14 : 0xe0c8dc, 1);
      box.strokeRoundedRect(x - 85, y - 95, 170, 190, 26);
      panel.add(box);
      panel.add(txt(this, x, y - 62, `Día ${i + 1}`, 28, '#6a1e4a', { weight: '700' }));
      panel.add(icon(this, x, y - 4, i === 6 ? 'pw_rayo' : 'ui_ladrillo', 70));
      panel.add(txt(this, x, y + 62, i === 6 ? `${amt} + Rayo` : String(amt), i === 6 ? 26 : 34, '#c8502a'));
    });
    panel.add(button(this, 0, 320, 560, 120, 'Reclamar', 0x5ac85a, () => {
      const amt = DAILY[idx] * multRegalo();
      save.bricks += amt;
      save.daily = { last: today(), streak: idx + 1 };
      if (idx === 6) save.pendingPower = 'rayo';
      persist();
      sfx.build();
      confetti(this, W / 2, 700, 80);
      toast(this, idx === 6 ? `+${amt} ladrillos y un Rayo para tu próxima partida` : `+${amt} ladrillos`, 700, 1800);
      this.time.delayedCall(1300, () => this.scene.restart({ reto: false }));
    }));
    this.tweens.add({ targets: panel, scale: 1, duration: 360, ease: 'Back.Out' });
  }
}
