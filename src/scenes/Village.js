import Phaser from 'phaser';
import { W, H, BUILDINGS, DECO_POS } from '../config.js';
import { save, persist, isBuilt } from '../save.js';
import { eventoActivo } from '../evento.js';
import { sfx, vibe } from '../sfx.js';
import { txt, background, icon, button, toast, chip, confetti } from '../ui.js';
import { track } from '../stats.js';

// Posiciones alineadas con los 6 terrenos del fondo bg_village (suelo = parte baja del edificio)
const PLOTS = [[245, 750], [840, 770], [245, 1140], [840, 1160], [245, 1550], [845, 1570]];
const BSIZE = 300;

export default class Village extends Phaser.Scene {
  constructor() { super('Village'); }

  create() {
    background(this, 'bg_village', 'grad_sky');
    if (!this.textures.exists('bg_village')) this.drawScenery();
    if (eventoActivo()) this.decorarMuertos();

    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 }).setDepth(50);
    this.brickChip = chip(this, 905, 110, 230, 'ui_ladrillo', save.bricks).setDepth(50);
    this.progress = this.add.graphics().setDepth(50);
    this.progressText = txt(this, W / 2, 215, '', 38, '#ffffff', { stroke: '#1e3a5a', strokeW: 8 }).setDepth(50);
    this.drawProgress();

    this.plots = BUILDINGS.map((b, i) => this.makePlot(b, i));
    this.decoraciones();
    button(this, 650, 1790, 540, 130, 'Jugar', 0x5ac85a, () => this.scene.start('Game', { reto: false }), { size: 60 }).setDepth(50);
    button(this, 205, 1790, 290, 130, '  Decorar', 0xd8a020, () => this.scene.start('Shop', { tab: 'deco' }), { size: 38, iconKey: 'ui_tienda' }).setDepth(50);

    if (save.built.length === BUILDINGS.length) {
      toast(this, '¡Zona 1 completa! La zona 2 llega pronto', 330, 3000);
    } else if (save.built.length === 0) {
      toast(this, 'Toca la Casa para empezar a reconstruir', 330, 2600);
    }
  }

  decorarMuertos() {
    // noche de Día de Muertos: cielo morado, papel picado, ofrenda y velas
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a3a, 0.42).setDepth(1);
    [W * 0.25, W * 0.75].forEach((x, i) => {
      const pp = this.add.image(x, 300, 'deco_papel_picado').setOrigin(0.5, 0).setDepth(2);
      pp.setDisplaySize(W / 2 + 30, (W / 2 + 30) * (pp.height / pp.width));
      this.tweens.add({ targets: pp, angle: { from: -1, to: 1 }, duration: 2000 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });
    const of = this.add.image(545, 1010, 'deco_ofrenda').setOrigin(0.5, 1).setDepth(9);
    of.setDisplaySize(270, 270 * (of.height / of.width));
    [[470, 1080], [620, 1090], [500, 1420], [600, 1440], [520, 1700], [580, 1690], [545, 760]].forEach(([x, y], i) => {
      const glow = this.add.circle(x, y, 26, 0xffa63a, 0.35).setDepth(8);
      const c = this.add.circle(x, y, 8, 0xffe08a, 1).setDepth(8);
      this.tweens.add({ targets: [glow, c], alpha: { from: 1, to: 0.55 }, scale: { from: 1, to: 1.15 }, duration: 380 + i * 60, yoyo: true, repeat: -1 });
    });
    this.add.particles(0, 0, 'fx_dot', {
      x: { min: 0, max: W }, y: -20, lifespan: 9000, speedY: { min: 40, max: 90 }, speedX: { min: -30, max: 30 },
      scale: { start: 0.5, end: 0.3 }, tint: [0xff9a0f, 0xffc21f, 0xff6a00], frequency: 450, alpha: 0.85,
    }).setDepth(3);
  }

  // Lo comprado en la tienda (árboles, farolas, jardines, banderines, fuente)
  decoraciones(ids = save.tienda.deco, anim = false) {
    const KEY = { arboles: 'deco_arbol', farolas: 'deco_farola', flores: 'deco_flores', banderines: 'deco_banderines', fuente: 'deco_fuente' };
    const noche = eventoActivo();
    ids.forEach((id) => {
      (DECO_POS[id] || []).forEach(([x, y, size], k) => {
        const im = this.add.image(x, y, KEY[id]).setOrigin(0.5, 1);
        im.setScale(size / Math.max(im.width, im.height));
        if (anim) {
          const s0 = im.scaleX;
          im.setScale(s0 * 0.05);
          this.tweens.add({ targets: im, scale: s0, delay: k * 110, duration: 420, ease: 'Back.Out' });
          this.time.delayedCall(k * 110 + 150, () => confetti(this, x, y - size * 0.6, 14));
        }
        im.setDepth(y < 1000 ? 6 : y < 1400 ? 8 : 10.5);
        if (id === 'banderines') {
          im.setOrigin(0.5, 0).setDepth(5);
          this.tweens.add({ targets: im, angle: { from: -1.2, to: 1.2 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        }
        if (id === 'arboles') this.tweens.add({ targets: im, angle: { from: -1.5, to: 1.5 }, duration: 2200 + k * 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        if (id === 'farolas' && noche) {
          const glow = this.add.circle(x, y - im.displayHeight * 0.84, im.displayWidth * 0.6, 0xffd76a, 0.35).setDepth(im.depth);
          this.tweens.add({ targets: glow, alpha: { from: 0.45, to: 0.2 }, duration: 900 + k * 120, yoyo: true, repeat: -1 });
        }
        if (id === 'fuente') {
          this.add.particles(x, y - im.displayHeight * 0.85, 'fx_dot', {
            speed: { min: 60, max: 140 }, angle: { min: 240, max: 300 }, gravityY: 300, lifespan: 700,
            scale: { start: 0.45, end: 0.1 }, tint: [0xbfeaff, 0x8fd8ff, 0xffffff], frequency: 60, alpha: 0.9,
          }).setDepth(im.depth + 0.1);
        }
      });
    });
    if (anim) { sfx.build(); vibe(40); }
  }

  drawScenery() {
    const g = this.add.graphics();
    g.fillStyle(0xfff0a0, 1); g.fillCircle(880, 420, 80);
    g.fillStyle(0xffffff, 0.95);
    [[180, 420, 1], [560, 360, 0.8]].forEach(([x, y, s]) => {
      g.fillCircle(x, y, 50 * s); g.fillCircle(x + 55 * s, y - 20 * s, 62 * s); g.fillCircle(x + 115 * s, y, 48 * s);
    });
    g.fillStyle(0x8ccd6e, 1); g.fillEllipse(260, 760, 1100, 500);
    g.fillStyle(0x7dc35f, 1); g.fillEllipse(860, 790, 1100, 520);
    g.fillStyle(0x6eb955, 1); g.fillRect(0, 880, W, H - 880);
    g.fillStyle(0xe1c896, 1);
    g.fillPoints([{ x: 470, y: H }, { x: 610, y: H }, { x: 570, y: 700 }, { x: 510, y: 700 }], true);
  }

  drawProgress() {
    const n = save.built.length;
    this.progress.clear();
    this.progress.fillStyle(0x0c0f30, 0.55);
    this.progress.fillRoundedRect(140, 255, 800, 34, 17);
    this.progress.fillStyle(0x6edc6e, 1);
    if (n) this.progress.fillRoundedRect(140, 255, (800 * n) / BUILDINGS.length, 34, 17);
    this.progressText.setText(`Pueblo restaurado ${n}/${BUILDINGS.length}`);
  }

  nextId() {
    const b = BUILDINGS.find((x) => !isBuilt(x.id));
    return b ? b.id : null;
  }

  makePlot(b, i) {
    const [x, gy] = PLOTS[i];
    const c = this.add.container(x, gy).setDepth(10 - Math.floor(i / 2));
    c.setInteractive(new Phaser.Geom.Rectangle(-180, -BSIZE, 360, BSIZE + 80), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => this.onPlot(b, i));
    this.renderPlot(c, b);
    return c;
  }

  renderPlot(c, b) {
    c.removeAll(true);
    this.tweens.killTweensOf(c);
    c.setScale(1);
    const built = isBuilt(b.id);
    const next = this.nextId() === b.id;
    const im = this.add.image(0, 0, built ? 'bld_' + b.id : 'bld_' + b.id + '_ruina').setOrigin(0.5, 1);
    im.setDisplaySize(BSIZE, BSIZE * (im.height / im.width));
    if (!built && !next) im.setTint(0x9a9aa8);
    c.add(im);
    const g = this.add.graphics();
    const label = built ? b.name : next ? `${b.name} · ${b.cost}` : b.name;
    const t = txt(this, next ? -16 : 0, 40, label, 32, '#ffffff', { weight: '800' });
    const w = t.width + (next ? 100 : 50);
    g.fillStyle(built ? 0x2a8a4a : next ? 0xd2642a : 0x3a3a5a, 0.92);
    g.fillRoundedRect(-w / 2, 12, w, 56, 28);
    c.add(g);
    c.add(t);
    if (next) {
      c.add(icon(this, t.x + t.width / 2 + 32, 40, 'ui_ladrillo', 42));
      this.tweens.add({ targets: c, scale: 1.04, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else if (!built) {
      c.add(icon(this, 0, -140, 'ui_candado', 80));
    }
  }

  onPlot(b, i) {
    sfx.click();
    if (isBuilt(b.id)) { toast(this, `${b.name}: ${b.unlock}`, 330); return; }
    if (this.nextId() !== b.id) {
      const nb = BUILDINGS.find((x) => x.id === this.nextId());
      toast(this, `Primero reconstruye la ${nb.name}`, 330);
      return;
    }
    this.openBuild(b, i);
  }

  openBuild(b, i) {
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    dim.on('pointerdown', () => layer.destroy());
    layer.add(dim);
    const panel = this.add.container(W / 2, 980).setScale(0.3);
    layer.add(panel);
    const g = this.add.graphics();
    g.fillStyle(0xaa5a1e, 1); g.fillRoundedRect(-420, -480, 840, 960, 50);
    g.fillStyle(0xfff7e8, 1); g.fillRoundedRect(-420, -490, 840, 950, 50);
    panel.add(g);
    panel.add(this.add.rectangle(0, 0, 840, 950).setInteractive());
    panel.add(txt(this, 0, -420, b.name, 70, '#46286e'));
    const ruinImg = this.add.image(0, -60, 'bld_' + b.id + '_ruina').setOrigin(0.5, 1);
    ruinImg.setDisplaySize(300, 300 * (ruinImg.height / ruinImg.width));
    panel.add(ruinImg);
    panel.add(txt(this, 0, 10, 'Desbloquea:', 32, '#8c7aa0', { weight: '700' }));
    panel.add(txt(this, 0, 62, b.unlock, 40, '#2a7a4a', { wrap: 700 }));
    panel.add(icon(this, -110, 160, 'ui_ladrillo', 76));
    panel.add(txt(this, 40, 160, `${b.cost}`, 64, '#c8502a'));
    const ok = save.bricks >= b.cost;
    if (ok) {
      panel.add(button(this, 0, 320, 600, 130, 'Reconstruir', 0x5ac85a, () => {
        layer.destroy();
        this.build(b, i);
      }, { size: 52 }));
    } else {
      panel.add(txt(this, 0, 255, `Te faltan ${b.cost - save.bricks} ladrillos`, 38, '#c84a4a'));
      panel.add(button(this, 0, 360, 600, 120, 'Jugar para ganar más', 0xff8c2b, () => this.scene.start('Game', { reto: false }), { size: 42 }));
    }
    this.tweens.add({ targets: panel, scale: 1, duration: 340, ease: 'Back.Out' });
  }

  build(b, i) {
    save.bricks -= b.cost;
    save.built.push(b.id);
    persist();
    track('construir', { id: b.id, n: save.built.length });
    this.brickChip.setValue(save.bricks);
    const c = this.plots[i];
    const [x, gy] = PLOTS[i];
    sfx.build();
    vibe(60);
    // ladrillos que vuelan a la obra
    for (let k = 0; k < 8; k++) {
      const br = icon(this, 840, 110, 'ui_ladrillo', 50).setDepth(250);
      this.tweens.add({ targets: br, x: x + Phaser.Math.Between(-80, 80), y: gy - 120, delay: k * 50, duration: 450, ease: 'Cubic.In', onComplete: () => br.destroy() });
    }
    const dust = this.add.particles(x, gy - 30, 'fx_dot', {
      speed: { min: 80, max: 260 }, angle: { min: 180, max: 360 }, lifespan: 800,
      scale: { start: 1.6, end: 0 }, tint: [0xd8c8a8, 0xc0b090], emitting: false,
    }).setDepth(240);
    this.time.delayedCall(450, () => {
      dust.explode(30);
      this.renderPlot(c, b);
      const im = c.list[0];
      const sx = im.scaleX, sy = im.scaleY;
      im.setScale(sx, 0.05);
      this.tweens.add({ targets: im, scaleY: sy, duration: 520, ease: 'Back.Out' });
      this.time.delayedCall(450, () => {
        confetti(this, x, gy - 200, 70);
        this.cameras.main.shake(160, 0.004);
        this.drawProgress();
        toast(this, `¡Desbloqueaste: ${b.unlock}!`, 330, 2400);
        this.plots.forEach((p, j) => { if (j !== i) this.renderPlot(p, BUILDINGS[j]); });
      });
    });
  }
}
