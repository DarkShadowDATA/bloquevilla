import Phaser from 'phaser';
import { W, H, COLORS, HEX, BUILDINGS, DAILY } from '../config.js';
import { save, persist, isBuilt, dailyAvailable, dailyIndex, today } from '../save.js';
import { EVENTO, eventoActivo, diasRestantes } from '../evento.js';
import { retoNumero } from '../reto.js';
import { sfx } from '../sfx.js';
import { txt, background, icon, button, toast, confetti } from '../ui.js';

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

    this.statRow(890, [
      ['ui_trofeo', save.record.toLocaleString('es-MX')],
      ['ui_ladrillo', String(save.bricks)],
      ['ui_estrella', `${built}/${BUILDINGS.length}`],
    ]);

    button(this, W / 2, 1040, 640, 150, 'Jugar', 0x5ac85a, () => this.scene.start('Game', { reto: false, modo: null }), { size: 72 });
    const hecho = save.reto.last === today();
    const rb = button(this, W / 2, 1182, 640, 104, hecho ? `Reto #${retoNumero(today())} · ¡Superado!` : `Reto del día #${retoNumero(today())}`,
      hecho ? 0x5a4a8a : 0x7a4ad8, () => this.scene.start('Game', { reto: true }), { size: 42 });
    if (!hecho) this.tweens.add({ targets: rb, scale: 1.04, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const tb60 = button(this, W / 2, 1300, 640, 104, 'Contrarreloj 60 s', 0x1f9aa8, () => this.scene.start('Game', { reto: false, modo: 'tiempo' }), { size: 42 });
    if (!save.tiempo.partidas) {
      const nuevo = txt(this, W / 2 + 300, 1258, '¡NUEVO!', 28, '#ffffff', { stroke: '#c8282a', strokeW: 8 }).setAngle(12).setDepth(5);
      this.tweens.add({ targets: nuevo, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    } else if (save.tiempo.record) {
      tb60.label.setText(`Contrarreloj · récord ${save.tiempo.record.toLocaleString('es-MX')}`).setFontSize(36);
    }
    button(this, W / 2 - 165, 1418, 310, 104, 'Mi pueblo', 0xff8c2b, () => this.scene.start('Village'), { size: 40 });
    button(this, W / 2 + 165, 1418, 310, 104, '  Tienda', 0xd8a020, () => this.scene.start('Shop'), { size: 40, iconKey: 'ui_tienda' });
    if (!save.tienda.visto) {
      const nv = txt(this, W / 2 + 290, 1372, '¡NUEVO!', 26, '#ffffff', { stroke: '#c8282a', strokeW: 8 }).setAngle(12).setDepth(5);
      this.tweens.add({ targets: nv, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    }

    if (dailyAvailable()) {
      const b = button(this, W / 2, 1540, 640, 112, '  Regalo diario', 0xd84a8a, () => this.openDaily(), { size: 42, iconKey: 'ui_regalo' });
      this.tweens.add({ targets: b, scale: 1.05, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else if (!isBuilt('panaderia')) {
      txt(this, W / 2, 1540, 'Construye la Panadería para recibir regalos diarios', 30, '#ffffff', { weight: '700', wrap: 760, stroke: '#1e144688', strokeW: 6 });
    } else {
      txt(this, W / 2, 1540, 'Vuelve mañana por tu regalo diario', 30, '#ffffff', { weight: '700', stroke: '#1e144688', strokeW: 6 });
    }

    // Ajustes
    this.toggle(960, 120, 'ui_sonido', save.sound, (v) => { save.sound = v; persist(); });
    const temas = ['clasico'];
    if (isBuilt('pozo')) temas.push('agua');
    if (save.muertos.tema) temas.push('muertos');
    save.tienda.temas.forEach((t) => temas.push(t));
    if (temas.length > 1) {
      if (!temas.includes(save.theme)) save.theme = 'clasico';
      const nombre = { clasico: eventoActivo() ? 'Evento' : 'Clásico', agua: 'Agua', muertos: 'Día de Muertos', neon: 'Neón', caramelo: 'Caramelo' };
      const label = () => `Bloques: ${nombre[save.theme]}`;
      const tb = button(this, W / 2, 1668, 480, 90, label(), 0x2c6ab0, () => {
        save.theme = temas[(temas.indexOf(save.theme) + 1) % temas.length];
        persist();
        tb.label.setText(label());
      }, { size: 34 });
    }
    txt(this, W / 2, H - 60, 'v0.5 · Tienda', 24, '#ffffffaa', { weight: '500' });
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
    DAILY.forEach((amt, i) => {
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
      const amt = DAILY[idx];
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
