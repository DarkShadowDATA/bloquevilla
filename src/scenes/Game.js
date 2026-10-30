import Phaser from 'phaser';
import {
  W, H, N, CELL, BX, BY, TRAY_Y, SLOTS, TRAY_CELL, COLORS, HEX, SCORE, BRICKS,
  COMBO_GRACE, LINES_PER_OFFER, MAX_POWERS, BUILDINGS, TIEMPO, ORO, PELIGRO,
} from '../config.js';
import { size, canPlace, anyFit, makeTray, findLines, rotate } from '../pieces.js';
import { save, persist, isBuilt, today, ayer } from '../save.js';
import { generarReto, RETO_PREMIO } from '../reto.js';
import { EVENTO, eventoActivo, sumarFlores, temaBloques } from '../evento.js';
import { sfx, vibe } from '../sfx.js';
import { POWERS, RARITY, rollOffer } from '../powers.js';
import { txt, background, icon, button, toast, floatText, chip, confetti } from '../ui.js';
import { track } from '../stats.js';

export default class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  create(data) {
    this.reto = data && data.reto === true ? generarReto(today()) : null;
    this.tiempo = !this.reto && !!data && data.modo === 'tiempo';
    this.tiempoRest = TIEMPO.dur;
    this.tiempoOn = false;
    this.tiempoTick = null;
    this.atorado = false;
    this.summaryShown = false;
    this.bombas = {};          // casilla (r*N+c) -> jugadas que le quedan
    this.bombaTxt = {};
    this.bombasNuevas = new Set();
    this.tickPendiente = false;
    this.bombasDesactivadas = 0;
    this.causa = '';
    this.t0 = this.time.now;
    this.hintTiempo = null;
    this.timerBar = null;
    this.timerText = null;
    // La escena se reutiliza entre partidas: borra referencias a objetos de la partida anterior
    this.comboText = null;
    this.comboFrame = null;
    this.tema = null;
    this.stuckHint = null;
    this.endBtn = null;
    this.modeHint = null;
    this.retoText = null;
    this.florChip = null;
    this.board = Array.from({ length: N }, () => Array(N).fill(null));
    this.sprites = Array.from({ length: N }, () => Array(N).fill(null));
    this.score = 0;
    this.runBricks = 0;
    this.combo = 0;
    this.miss = 0;
    this.linesTotal = 0;
    this.nextOffer = LINES_PER_OFFER;
    this.offerPending = false;
    this.powers = [];
    this.doubleBricks = false;
    this.undoSnap = null;
    this.busy = false;
    this.over = false;
    this.mode = null;
    this.drag = null;
    this.pieces = [];

    background(this, 'bg_game', 'grad_game');
    this.evento = eventoActivo();
    if (this.evento) {
      // papel picado arriba del tablero
      [W * 0.25, W * 0.75].forEach((x, i) => {
        const pp = this.add.image(x, 0, 'deco_papel_picado').setOrigin(0.5, 0).setAlpha(0.8);
        pp.setDisplaySize(W / 2 + 20, (W / 2 + 20) * (pp.height / pp.width));
        this.tweens.add({ targets: pp, angle: { from: -1, to: 1 }, duration: 1700 + i * 250, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      });
    }
    this.buildHud();
    this.buildBoard();
    this.buildTray();
    if (!this.reto && !this.tiempo) this.buildPowersBar();
    else this.powerSlots = [];

    this.fx = {};
    COLORS.forEach((c) => {
      this.fx[c] = this.add.particles(0, 0, 'fx_square', {
        lifespan: 750, speed: { min: 250, max: 780 }, angle: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0 }, gravityY: 1500, rotate: { min: 0, max: 360 },
        tint: [HEX[c], 0xffffff], emitting: false,
      }).setDepth(30);
    });
    this.petalos = this.add.particles(0, 0, 'fx_dot', {
      lifespan: 1400, speed: { min: 120, max: 520 }, angle: { min: 200, max: 340 }, gravityY: 520,
      scale: { start: 0.9, end: 0.3 }, tint: [0xff9a0f, 0xffc21f, 0xff6a00, 0xff5fa8], emitting: false,
    }).setDepth(32);
    this.sparks = this.add.particles(0, 0, 'fx_star', {
      lifespan: 700, speed: { min: 80, max: 360 }, scale: { start: 1.2, end: 0 },
      tint: [0xffe680, 0xffffff], emitting: false,
    }).setDepth(31);

    // Combos que escalan: fuego desde x4, arcoíris desde x6
    const edge = new Phaser.Geom.Rectangle(BX - 22, BY - 22, N * CELL + 44, N * CELL + 44);
    const flame = (tint) => this.add.particles(0, 0, 'fx_dot', {
      emitZone: { type: 'edge', source: edge, quantity: 140 },
      lifespan: { min: 450, max: 950 }, speedY: { min: -380, max: -120 }, speedX: { min: -60, max: 60 },
      scale: { start: 2.0, end: 0.1 }, alpha: { start: 0.85, end: 0 }, tint, blendMode: 'ADD',
      frequency: 8, quantity: 3, emitting: false,
    }).setDepth(3);
    this.fire = flame([0xff4e1f, 0xff9a2e, 0xffd84a]);
    this.rainbow = flame([0xff5a5f, 0xffa62b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0x9b5de5, 0xf15bb5]);
    this.comboFrame = this.add.graphics().setDepth(4);
    this.time.addEvent({ delay: 600, loop: true, callback: () => this.brilloOro() });

    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);

    // Guarda la partida al salir (celular suspendido, cambio de app, pestaña cerrada o ir al menú)
    const guardar = () => this.guardarPartida();
    const alOcultar = () => { if (document.visibilityState === 'hidden') guardar(); };
    document.addEventListener('visibilitychange', alOcultar);
    window.addEventListener('pagehide', guardar);
    this.events.once('shutdown', () => {
      guardar();
      document.removeEventListener('visibilitychange', alOcultar);
      window.removeEventListener('pagehide', guardar);
    });

    // ¿Hay una partida a medias? Se retoma tal cual
    const p = save.partida;
    if (!this.reto && !this.tiempo && !window.__capture && p && p.v === 1 && !(data && data.nueva)) {
      this.reanudar(p);
      return;
    }
    if (!this.reto && !this.tiempo && save.partida) { save.partida = null; persist(); }

    if (save.pendingPower && !this.reto && !this.tiempo) {
      this.powers.push(save.pendingPower);
      save.pendingPower = null;
      persist();
    }
    // Poderes comprados en la tienda para esta partida
    if (!this.reto && !this.tiempo && save.proximos.length) {
      const n0 = this.powers.length;
      while (this.powers.length < MAX_POWERS && save.proximos.length) this.powers.push(save.proximos.shift());
      persist();
      if (this.powers.length > n0) this.time.delayedCall(500, () => toast(this, `Traes ${this.powers.length - n0 === 1 ? 'un poder' : 'dos poderes'} de la tienda`, 352, 2200));
    }
    if (this.reto) {
      this.iniciarReto();
      return;
    }
    this.renderPowers();
    this.newTray(true);
    if (this.tiempo) { this.iniciarTiempo(); return; }
    this.guardarPartida();

    if (save.games === 0) {
      this.time.delayedCall(500, () => toast(this, 'Arrastra una pieza al tablero', 352, 2600));
    }
  }

  // ---------- Construcción de la pantalla ----------
  buildHud() {
    button(this, 120, 215, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 });
    this.scoreText = txt(this, W / 2, 205, '0', 88, '#ffffff', { stroke: '#141432', strokeW: 10 });
    this.recordText = txt(this, W / 2, 285, this.tiempo ? `Récord 60 s: ${save.tiempo.record.toLocaleString('es-MX')}` : `Récord ${save.record.toLocaleString('es-MX')}`, 28, '#b8b8e0', { weight: '700' });
    this.brickChip = chip(this, 905, 215, 230, 'ui_ladrillo', save.bricks);
    if (this.evento) {
      this.florChip = chip(this, 905, 305, 230, 'ui_flor', save.muertos.tema ? save.muertos.flores : `${save.muertos.flores}/${EVENTO.meta}`);
      this.florChip.setScale(0.8);
    }
  }

  buildBoard() {
    const g = this.add.graphics();
    g.fillStyle(0x0e1238, 0.9);
    g.fillRoundedRect(BX - 22, BY - 22, N * CELL + 44, N * CELL + 44, 34);
    g.fillStyle(0x262c66, 1);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g.fillRoundedRect(BX + c * CELL + 5, BY + r * CELL + 5, CELL - 10, CELL - 10, 14);
    this.modeFrame = this.add.graphics().setDepth(4);
    this.ghost = this.add.graphics().setDepth(6);
    this.add.zone(BX, BY, N * CELL, N * CELL).setOrigin(0).setInteractive().on('pointerdown', (p) => this.onBoardTap(p));
  }

  buildTray() {
    const g = this.add.graphics();
    g.fillStyle(0x0e1238, 0.7);
    g.fillRoundedRect(60, 1320, 960, 300, 36);
  }

  buildPowersBar() {
    txt(this, W / 2, 1655, 'PODERES · duran esta partida', 26, '#a8a8d8', { weight: '700' });
    this.powerSlots = [430, 650].map((x, i) => {
      const c = this.add.container(x, 1785);
      c.setInteractive(new Phaser.Geom.Rectangle(-90, -90, 180, 180), Phaser.Geom.Rectangle.Contains);
      c.on('pointerdown', () => this.activatePower(i));
      return c;
    });
  }

  renderPowers() {
    this.powerSlots.forEach((c, i) => {
      c.removeAll(true);
      const id = this.powers[i];
      const g = this.add.graphics();
      if (!id) {
        g.lineStyle(4, 0x5a5e9a, 1);
        g.strokeRoundedRect(-80, -80, 160, 160, 28);
        c.add(g);
        c.add(txt(this, 0, 0, '+', 60, '#5a5e9a'));
        return;
      }
      const rar = RARITY[POWERS[id].rarity];
      const active = this.mode && this.mode.index === i;
      g.fillStyle(active ? 0xfff2b0 : 0x1a1e4e, 1);
      g.fillRoundedRect(-80, -80, 160, 160, 28);
      g.lineStyle(active ? 10 : 6, active ? 0xffd23f : rar.color, 1);
      g.strokeRoundedRect(-80, -80, 160, 160, 28);
      c.add(g);
      c.add(icon(this, 0, -14, 'pw_' + id, 104));
      c.add(txt(this, 0, 56, POWERS[id].name, POWERS[id].name.length > 10 ? 18 : 24, active ? '#3c2a00' : '#ffffff', { weight: '700' }));
      if (active) this.tweens.add({ targets: c, scale: 1.06, duration: 300, yoyo: true, repeat: -1 });
      else { this.tweens.killTweensOf(c); c.setScale(1); }
    });
  }

  blockTex(color) {
    if (color === 'gold') return 'block_gold';
    if (color === 'hielo' || color === 'hielo2' || color === 'bomba') return 'blk_' + color;
    const tema = this.tema || (this.tema = temaBloques(isBuilt('pozo')));
    if (tema === 'agua') return 'water_' + ((COLORS.indexOf(color) % 3) + 1);
    if (tema === 'muertos') return 'muertos_' + ((COLORS.indexOf(color) % 4) + 1);
    if (tema === 'neon' || tema === 'caramelo') return tema + '_' + color;
    return 'block_' + color;
  }

  cellXY(r, c) {
    return { x: BX + c * CELL + CELL / 2, y: BY + r * CELL + CELL / 2 };
  }

  addBlock(r, c, color, pop) {
    const { x, y } = this.cellXY(r, c);
    const im = this.add.image(x, y, this.blockTex(color)).setDisplaySize(CELL, CELL).setDepth(10);
    const s = im.scaleX;
    if (pop) {
      im.setScale(s * 0.7);
      this.tweens.add({ targets: im, scaleX: s, scaleY: s, duration: 220, ease: 'Back.Out' });
    }
    this.sprites[r][c] = im;
    if (color === 'bomba') this.dibujarBomba(r, c);
  }

  // ---------- Piezas ----------
  makePiece(def, slot, animate) {
    const { rows, cols } = size(def.cells);
    const c = this.add.container(SLOTS[slot], TRAY_Y).setDepth(20);
    def.cells.forEach(([r, cc], k) => {
      const im = this.add.image((cc - (cols - 1) / 2) * TRAY_CELL, (r - (rows - 1) / 2) * TRAY_CELL, this.blockTex(k === def.gold ? 'gold' : def.color));
      im.setDisplaySize(TRAY_CELL, TRAY_CELL);
      c.add(im);
    });
    const piece = { cells: def.cells, color: def.color, gold: def.gold, rows, cols, c, slot, used: false };
    c.setInteractive(new Phaser.Geom.Rectangle(-150, -105, 300, 210), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', (p) => this.startDrag(piece, p));
    if (animate) {
      c.x += 900;
      this.tweens.add({ targets: c, x: SLOTS[slot], duration: 380, delay: slot * 70, ease: 'Back.Out' });
    }
    return piece;
  }

  newTray(animate) {
    if (this.reto) {
      if (this.pieces.length && this.pieces.every((p) => p.used)) this.time.delayedCall(700, () => this.finReto());
      return;
    }
    this.pieces.forEach((p) => p.c && p.c.destroy());
    this.spawnPeligros();
    const defs = makeTray(this.board);
    if (Math.random() < ORO.chance) {
      const d = defs[Math.floor(Math.random() * defs.length)];
      d.gold = Math.floor(Math.random() * d.cells.length);
      if (!save.oroVisto && !window.__capture) {
        save.oroVisto = true;
        persist();
        this.time.delayedCall(2800, () => toast(this, '¡Bloque DORADO! Limpia su línea para ganar ladrillos extra', this.tiempo ? 1655 : 352, 2800));
      }
    }
    this.pieces = defs.map((d, i) => this.makePiece(d, i, animate));
  }

  // Brillos de vez en cuando sobre los bloques dorados del tablero
  brilloOro() {
    const list = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (this.board[r][c] === 'gold') list.push([r, c]);
    if (!list.length || !this.sparks) return;
    const [r, c] = list[Math.floor(Math.random() * list.length)];
    const { x, y } = this.cellXY(r, c);
    this.sparks.explode(2, x + Phaser.Math.Between(-30, 30), y + Phaser.Math.Between(-30, 30));
  }

  premioOro(oros) {
    const n = oros.length;
    oros.forEach(([r, c], i) => {
      const { x, y } = this.cellXY(r, c);
      this.time.delayedCall(i * 90, () => {
        this.sparks.explode(16, x, y);
        this.fx.yellow.explode(10, x, y);
      });
    });
    const { x, y } = this.cellXY(oros[0][0], oros[0][1]);
    this.addScore(ORO.puntos * n);
    this.addBricks(ORO.ladrillos * n, x, y);
    this.time.delayedCall(260, () => {
      floatText(this, W / 2, BY + 120, `¡ORO! +${ORO.ladrillos * n}`, 90, '#ffe14a', '#7a3d00');
      this.cameras.main.flash(140, 255, 220, 90);
      sfx.coin();
      this.time.delayedCall(120, () => sfx.coin());
    });
  }

  startDrag(piece, p) {
    if (this.busy || this.over || piece.used) return;
    if (this.tiempo && !this.tiempoOn) this.arrancarTiempo();
    if (this.mode) {
      if (this.mode.id === 'girar') this.applyGirar(piece);
      return;
    }
    this.drag = { piece, offY: (piece.rows * CELL) / 2 + 110 };
    piece.c.setDepth(40);
    this.tweens.killTweensOf(piece.c);
    this.tweens.add({ targets: piece.c, scale: CELL / TRAY_CELL, duration: 120, ease: 'Back.Out' });
    sfx.pick();
    this.onMove(p);
  }

  targetFor(piece) {
    const tlx = piece.c.x - (piece.cols * CELL) / 2;
    const tly = piece.c.y - (piece.rows * CELL) / 2;
    const c = Math.round((tlx - BX) / CELL);
    const r = Math.round((tly - BY) / CELL);
    return canPlace(this.board, piece.cells, r, c) ? { r, c } : null;
  }

  onMove(p) {
    if (!this.drag) return;
    const pc = this.drag.piece;
    pc.c.x = p.x;
    pc.c.y = p.y - this.drag.offY;
    const t = this.targetFor(pc);
    this.ghost.clear();
    if (!t) return;
    // sombra de la pieza
    this.ghost.fillStyle(HEX[pc.color], 0.35);
    pc.cells.forEach(([dr, dc]) => this.ghost.fillRoundedRect(BX + (t.c + dc) * CELL + 5, BY + (t.r + dr) * CELL + 5, CELL - 10, CELL - 10, 14));
    // líneas que se limpiarían
    const sim = this.board.map((row) => [...row]);
    pc.cells.forEach(([dr, dc]) => { sim[t.r + dr][t.c + dc] = pc.color; });
    const { rows, cols } = findLines(sim);
    this.ghost.fillStyle(0xffffff, 0.22);
    rows.forEach((r) => this.ghost.fillRoundedRect(BX, BY + r * CELL, N * CELL, CELL, 16));
    cols.forEach((c) => this.ghost.fillRoundedRect(BX + c * CELL, BY, CELL, N * CELL, 16));
  }

  onUp() {
    if (!this.drag) return;
    const pc = this.drag.piece;
    this.drag = null;
    this.ghost.clear();
    const t = this.over ? null : this.targetFor(pc);
    if (t) {
      this.place(pc, t.r, t.c);
    } else {
      sfx.back();
      pc.c.setDepth(20);
      this.tweens.add({ targets: pc.c, x: SLOTS[pc.slot], y: TRAY_Y, scale: 1, duration: 220, ease: 'Cubic.Out' });
    }
  }

  // ---------- Jugada ----------
  snapshot() {
    this.undoSnap = {
      board: this.board.map((r) => [...r]),
      pieces: this.pieces.map((p) => ({ cells: (p.cells || []).map((x) => [...x]), color: p.color, gold: p.gold, used: p.used })),
      score: this.score, runBricks: this.runBricks, combo: this.combo, miss: this.miss,
      linesTotal: this.linesTotal, nextOffer: this.nextOffer, bombas: { ...this.bombas },
    };
  }

  place(pc, r, c) {
    this.snapshot();
    this.tickPendiente = true;
    pc.used = true;
    this.atorado = false;
    pc.c.destroy();
    pc.c = null;
    pc.cells.forEach(([dr, dc], k) => {
      const col = k === pc.gold ? 'gold' : pc.color;
      this.board[r + dr][c + dc] = col;
      this.addBlock(r + dr, c + dc, col, true);
    });
    this.addScore(pc.cells.length * SCORE.perCell);
    sfx.place();
    vibe(12);

    const { rows, cols } = findLines(this.board);
    const n = rows.length + cols.length;
    if (n > 0) {
      this.combo += 1;
      this.miss = 0;
    } else {
      this.miss += 1;
      if (this.miss >= COMBO_GRACE) this.combo = 0;
    }
    this.updateComboText();

    const allUsed = this.pieces.every((p) => p.used);
    if (n > 0) {
      this.busy = true;
      const wait = this.resolveLines(rows, cols, n);
      if (allUsed) this.time.delayedCall(200, () => this.newTray(true));
      this.time.delayedCall(wait, () => this.afterMove());
    } else {
      if (allUsed) this.newTray(true);
      this.afterMove();
    }
  }

  resolveLines(rows, cols, n) {
    const map = new Map();
    rows.forEach((r) => { for (let c = 0; c < N; c++) map.set(r * N + c, [r, c]); });
    cols.forEach((c) => { for (let r = 0; r < N; r++) map.set(r * N + c, [r, c]); });
    const cells = [...map.values()];

    const base = SCORE.lines[Math.min(n, 3)] + Math.max(0, n - 3) * SCORE.extraLine;
    const pts = base * Math.max(1, this.combo);
    const bricks = BRICKS.lines[Math.min(n, 3)]; // los combos multiplican puntos, no ladrillos

    // centro de lo que se limpia, para los textos
    const cx = cells.reduce((a, [, c]) => a + c, 0) / cells.length;
    const cy = cells.reduce((a, [r]) => a + r, 0) / cells.length;
    const { x, y } = this.cellXY(cy, cx);

    const oros = cells.filter(([r, c]) => this.board[r][c] === 'gold');
    this.clearCells(cells, 14, true);
    this.addScore(pts);
    if (oros.length) this.premioOro(oros);
    this.addBricks(bricks, x, y);
    sfx.clear(this.combo);
    vibe(n > 1 ? 40 : 20);

    const label = n >= 3 ? `¡x${n} LÍNEAS!` : n === 2 ? '¡DOBLE!' : '¡Línea!';
    floatText(this, Phaser.Math.Clamp(x, 220, 860), y - 40, label, n >= 2 ? 84 : 70, '#ffffff');
    floatText(this, Phaser.Math.Clamp(x + 180, 300, 960), y + 50, `+${pts}`, 56, '#ffd93d', '#4a2008');

    if (this.combo >= 2) {
      this.cameras.main.shake(200, 0.004 * Math.min(this.combo, 5));
      this.comboBanner(this.combo);
      sfx.combo(this.combo);
    } else if (n >= 2) {
      this.cameras.main.shake(150, 0.004);
    }

    this.linesTotal += n;
    if (this.tiempo && this.tiempoOn) this.sumarTiempo(n * TIEMPO.porLinea, x, y);
    if (this.evento) this.ganarFlores(n, x, y);
    if (this.reto && this.retoText) this.retoText.setText(`Líneas: ${Math.min(this.linesTotal, this.reto.meta)} / ${this.reto.meta}`);
    while (this.linesTotal >= this.nextOffer) {
      this.offerPending = true;
      this.nextOffer += LINES_PER_OFFER;
    }

    if (this.board.every((row) => row.every((v) => !v))) {
      this.time.delayedCall(350, () => {
        floatText(this, W / 2, 860, '¡TABLERO LIMPIO!', 90, '#7ef0ff');
        this.cameras.main.flash(220, 200, 255, 255);
        this.cameras.main.shake(300, 0.01);
        const ring = this.add.circle(W / 2, BY + (N * CELL) / 2, 40).setStrokeStyle(16, 0x7ef0ff).setDepth(170);
        this.tweens.add({ targets: ring, scale: 14, alpha: 0, duration: 700, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
        this.sparks.explode(40, W / 2, BY + (N * CELL) / 2);
        sfx.build();
        this.addScore(SCORE.empty);
        this.addBricks(BRICKS.empty, W / 2, 860);
        confetti(this, W / 2, 900, 70);
      });
    }
    return 430;
  }

  clearCells(cells, stagger = 14, porLinea = false) {
    const desactivadas = [];
    cells.forEach(([r, c], i) => {
      const color = this.board[r][c];
      const im = this.sprites[r][c];
      // El hielo entero solo se agrieta con una línea; los poderes lo rompen de una vez
      if (porLinea && color === 'hielo') {
        this.board[r][c] = 'hielo2';
        if (im) {
          this.time.delayedCall(80 + i * stagger, () => {
            im.setTexture(this.blockTex('hielo2')).setDisplaySize(CELL, CELL);
            this.fx.blue.explode(10, im.x, im.y);
            sfx.crack();
          });
        }
        return;
      }
      if (color === 'bomba') {
        const k = r * N + c;
        delete this.bombas[k];
        if (this.bombaTxt[k]) { this.bombaTxt[k].destroy(); delete this.bombaTxt[k]; }
        desactivadas.push([r, c]);
      }
      this.board[r][c] = null;
      this.sprites[r][c] = null;
      if (!im) return;
      im.setTintFill(0xffffff);
      im.setDepth(12);
      this.tweens.add({
        targets: im, scaleX: 0, scaleY: 0, angle: 25, delay: 80 + i * stagger, duration: 220, ease: 'Back.In',
        onStart: () => { const fc = { gold: 'yellow', hielo: 'blue', hielo2: 'blue', bomba: 'red' }[color] || color; if (fc && this.fx[fc]) this.fx[fc].explode(9, im.x, im.y); },
        onComplete: () => im.destroy(),
      });
    });
    desactivadas.forEach(([r, c]) => this.desactivarBomba(r, c));
  }

  comboBanner(n) {
    let label = `¡COMBO x${n}!`, color = '#ffd93d', stroke = '#781e3c', size = 128;
    if (n >= 6) { label = `¡IMPARABLE x${n}!`; color = '#ffffff'; stroke = '#6a1fc4'; size = 104; }
    else if (n >= 4) { label = `¡EN LLAMAS x${n}!`; color = '#ffd23f'; stroke = '#b3260f'; size = 108; }
    if (n === 4 || n === 6) {
      this.cameras.main.flash(160, 255, n === 6 ? 255 : 200, n === 6 ? 255 : 120);
      sfx.power();
    }
    const t = txt(this, W / 2, 860, label, size, color, { stroke, strokeW: 14 }).setDepth(160).setScale(0.2);
    this.tweens.add({ targets: t, scale: 1, duration: 320, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, scale: 1.15, delay: 900, duration: 400, onComplete: () => t.destroy() });
    this.sparks.explode(18, W / 2, 860);
  }

  updateComboText() {
    if (!this.comboText) this.comboText = txt(this, W / 2, this.tiempo ? 1790 : 345, '', 30, '#ffd93d', { weight: '800' }).setDepth(50);
    this.comboText.setText(this.combo >= 2 && !this.reto ? `Combo x${this.combo} activo` : '');
    if (this.fire) {
      this.fire.emitting = this.combo >= 4 && this.combo < 6;
      this.rainbow.emitting = this.combo >= 6;
    }
  }

  update(time, delta) {
    // En modo grabación el reloj solo avanza con los cuadros grabados
    if (this.tiempo && (!window.__capture || window.__stepping)) this.updateTiempo(delta);
    if (!this.comboFrame) return;
    this.comboFrame.clear();
    if (this.combo >= 4 && !this.over) {
      const col = this.combo >= 6 ? Phaser.Display.Color.HSVToRGB((time / 900) % 1, 0.75, 1).color : 0xff8a2b;
      const a = 0.7 + 0.3 * Math.sin(time / 90);
      this.comboFrame.lineStyle(10, col, a);
      this.comboFrame.strokeRoundedRect(BX - 28, BY - 28, N * CELL + 56, N * CELL + 56, 38);
    }
  }

  ganarFlores(n, x, y) {
    const nuevo = sumarFlores(n);
    this.petalos.explode(14 + n * 8, x, y);
    for (let i = 0; i < Math.min(n, 4); i++) {
      const f = icon(this, x, y, 'ui_flor', 56).setDepth(171);
      this.tweens.add({
        targets: f, x: 830, y: 305, angle: 360, delay: 120 + i * 70, duration: 650, ease: 'Cubic.In',
        onComplete: () => {
          f.destroy();
          if (i === 0 && this.florChip) this.florChip.setValue(save.muertos.tema ? save.muertos.flores : `${Math.min(save.muertos.flores, EVENTO.meta)}/${EVENTO.meta}`);
        },
      });
    }
    if (nuevo) {
      this.time.delayedCall(900, () => {
        sfx.build();
        confetti(this, W / 2, 700, 90);
        this.petalos.explode(60, W / 2, 500);
        toast(this, '¡Desbloqueaste el tema Día de Muertos para siempre!', 352, 3200);
      });
    }
  }

  addScore(n) {
    this.score += n;
    this.scoreText.setText(this.score.toLocaleString('es-MX'));
    if (n > 20) this.tweens.add({ targets: this.scoreText, scale: 1.12, duration: 100, yoyo: true });
  }

  addBricks(n, x, y, premio = false) {
    if (n <= 0) return;
    if (this.reto && !premio) return; // en el reto solo se gana el premio final
    if (this.doubleBricks) n *= 2;
    this.runBricks += n;
    save.bricks += n;
    persist();
    // ladrillos que vuelan al contador
    for (let i = 0; i < Math.min(n, 6); i++) {
      const b = icon(this, x ?? W / 2, y ?? H / 2, 'ui_ladrillo', 54).setDepth(170);
      this.tweens.add({
        targets: b, x: 840, y: 215, delay: i * 60, duration: 600, ease: 'Cubic.In',
        onComplete: () => { b.destroy(); if (i === 0) { this.brickChip.setValue(save.bricks); sfx.coin(); } },
      });
    }
  }

  afterMove() {
    this.busy = false;
    if (this.tickPendiente) {
      this.tickPendiente = false;
      if (this.tickBombas()) return;
    }
    this.guardarPartida();
    if (this.offerPending) {
      this.offerPending = false;
      if (this.powers.length < MAX_POWERS) {
        this.showOffer();
        return;
      }
      this.addBricks(2, W / 2, 1785);
      toast(this, 'Poderes llenos: +2 ladrillos');
    }
    this.checkStuck();
  }

  checkStuck() {
    if (this.over) return;
    const rem = this.pieces.filter((p) => !p.used);
    if (!rem.length) return;
    if (rem.some((p) => anyFit(this.board, p.cells))) {
      if (this.stuckHint) { this.stuckHint.destroy(); this.stuckHint = null; }
      if (this.endBtn) { this.endBtn.destroy(); this.endBtn = null; }
      return;
    }
    if (this.reto) { this.finReto(); return; }
    if (this.tiempo) {
      // En contrarreloj no se pierde por trabarse: piezas nuevas a cambio de tiempo
      if (this.atorado) { this.gameOver('¡Sin espacio!'); return; }
      this.atorado = true;
      this.sumarTiempo(-TIEMPO.castigo, W / 2, TRAY_Y - 120);
      this.newTray(true);
      toast(this, `¡Piezas nuevas! -${TIEMPO.castigo / 1000} s`, 1655, 1400);
      sfx.error();
      this.time.delayedCall(450, () => this.checkStuck());
      return;
    }
    // ¿Algún poder guardado puede sacarte de aquí?
    const ayuda = this.powers.some((id) => {
      if (id === 'doble') return false;
      if (id === 'girar') return rem.some((p) => [1, 2, 3].some((k) => {
        let c = p.cells; for (let i = 0; i < k; i++) c = rotate(c);
        return anyFit(this.board, c);
      }));
      return true;
    });
    if (ayuda) {
      if (!this.stuckHint) this.stuckHint = toast(this, '¡Sin espacio! Usa un poder', 352, 0);
      this.powerSlots.forEach((s) => this.tweens.add({ targets: s, angle: 6, duration: 80, yoyo: true, repeat: 3 }));
      if (!this.endBtn) this.endBtn = button(this, 900, 1785, 220, 90, 'Terminar', 0x8a5a6a, () => { this.endBtn.destroy(); this.endBtn = null; this.gameOver(); }, { size: 32 });
      return;
    }
    this.gameOver();
  }

  // ---------- Poderes ----------
  showOffer() {
    this.busy = true;
    this.offerOpen = true;
    this.guardarPartida();
    // window.__forceOffer solo se usa al grabar videos
    const ids = (window.__capture && window.__forceOffer) || rollOffer();
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    layer.add(dim);
    const title = txt(this, W / 2, 560, '¡Elige un poder!', 86, '#ffffff', { stroke: '#46146e', strokeW: 10 }).setScale(0.2);
    layer.add(title);
    this.tweens.add({ targets: title, scale: 1, duration: 320, ease: 'Back.Out' });
    layer.add(txt(this, W / 2, 650, 'Dura solo esta partida', 34, '#d0c0f0', { weight: '700' }));
    sfx.power();
    let chosen = false;
    const cards = ids.map((id, i) => {
      const card = this.makeCard(id);
      card.setPosition(220 + i * 320, H + 320);
      card.scaleX = 0.01;
      layer.add(card);
      this.tweens.add({ targets: card, y: 980, duration: 420, delay: i * 120, ease: 'Back.Out' });
      this.tweens.add({ targets: card, scaleX: 1, duration: 260, delay: 260 + i * 120 });
      card.on('pointerdown', () => {
        if (chosen) return;
        chosen = true;
        sfx.power();
        vibe(30);
        this.sparks.explode(20, card.x, card.y);
        this.tweens.add({ targets: card, scale: 1.12, duration: 200, ease: 'Back.Out' });
        cards.forEach((o) => { if (o !== card) this.tweens.add({ targets: o, alpha: 0.25, duration: 200 }); });
        this.time.delayedCall(650, () => {
          layer.destroy();
          this.powers.push(id);
          this.offerOpen = false;
          this.renderPowers();
          this.busy = false;
          this.checkStuck();
        });
      });
      return card;
    });
    this._offerCards = cards;
  }

  makeCard(id) {
    const def = POWERS[id];
    const rar = RARITY[def.rarity];
    const c = this.add.container(0, 0);
    const bg = this.add.image(0, 0, 'card_' + def.rarity).setDisplaySize(290, 416);
    c.add(bg);
    const pill = this.add.graphics();
    pill.fillStyle(rar.color, 1);
    pill.fillRoundedRect(-70, -170, 140, 40, 20);
    c.add(pill);
    c.add(txt(this, 0, -150, rar.name, 24, '#ffffff'));
    c.add(icon(this, 0, -50, 'pw_' + id, 140));
    c.add(txt(this, 0, 62, def.name, def.name.length > 12 ? 28 : 34, '#3c1e50', { wrap: 210 }));
    c.add(txt(this, 0, 132, def.desc, 22, '#6e5a78', { weight: '500', wrap: 200 }));
    c.setInteractive(new Phaser.Geom.Rectangle(-145, -208, 290, 416), Phaser.Geom.Rectangle.Contains);
    return c;
  }

  activatePower(i) {
    if (this.busy || this.over || this.drag) return;
    const id = this.powers[i];
    if (!id) return;
    if (this.mode) {
      const same = this.mode.index === i;
      this.cancelMode();
      if (same) return;
    }
    const def = POWERS[id];
    if (def.target === 'none') {
      if (this.applyInstant(id) !== false) this.consume(i);
      return;
    }
    this.mode = { id, index: i, target: def.target };
    sfx.click();
    if (this.stuckHint) { this.stuckHint.destroy(); this.stuckHint = null; }
    this.modeHint = toast(this, def.hint, 352, 0);
    this.modeFrame.clear();
    if (def.target === 'cell') {
      this.modeFrame.lineStyle(8, 0xffd23f, 1);
      this.modeFrame.strokeRoundedRect(BX - 22, BY - 22, N * CELL + 44, N * CELL + 44, 34);
    }
    this.renderPowers();
  }

  cancelMode() {
    this.mode = null;
    this.modeFrame.clear();
    if (this.modeHint) { this.modeHint.destroy(); this.modeHint = null; }
    this.renderPowers();
  }

  consume(i) {
    this.time.delayedCall(350, () => this.guardarPartida());
    this.powers.splice(i, 1);
    if (this.mode) this.cancelMode();
    this.renderPowers();
    sfx.power();
    this.time.delayedCall(300, () => this.checkStuck());
  }

  replaceTray(defs) {
    this.pieces.forEach((p) => p.c && p.c.destroy());
    this.pieces = defs.map((d, i) => this.makePiece(d, i, true));
  }

  applyInstant(id) {
    if (id === 'cambio') {
      this.newTray(true);
      toast(this, '¡Piezas nuevas!');
    } else if (id === 'comodin') {
      this.replaceTray([0, 1, 2].map(() => ({ cells: [[0, 0]], color: COLORS[Math.floor(Math.random() * COLORS.length)] })));
      toast(this, '¡3 bloques sueltos!');
    } else if (id === 'deshacer') {
      if (!this.undoSnap) { toast(this, 'No hay jugada que deshacer'); sfx.error(); return false; }
      this.restore(this.undoSnap);
      this.undoSnap = null;
      toast(this, 'Jugada deshecha');
    } else if (id === 'doble') {
      if (this.doubleBricks) { toast(this, 'Ya está activo'); return false; }
      this.doubleBricks = true;
      this.brickChip.list[0].clear().fillStyle(0xb47814, 0.9).fillRoundedRect(-115, -40, 230, 80, 40);
      toast(this, '¡x2 ladrillos el resto de la partida!');
    } else if (id === 'segunda') {
      const rows = [...Array(N).keys()]
        .map((r) => ({ r, n: this.board[r].filter((v) => v).length }))
        .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
      if (!rows.length) { toast(this, 'El tablero ya está vacío'); return false; }
      const cells = [];
      rows.forEach(({ r }) => { for (let c = 0; c < N; c++) if (this.board[r][c]) cells.push([r, c]); });
      this.clearCells(cells, 10);
      this.cameras.main.shake(250, 0.006);
      confetti(this, W / 2, 900, 50);
      toast(this, '¡Segunda oportunidad!');
    }
    return true;
  }

  applyGirar(piece) {
    const i = this.mode.index;
    const defs = { cells: rotate(piece.cells), color: piece.color };
    piece.c.destroy();
    const np = this.makePiece(defs, piece.slot, false);
    np.c.angle = -90;
    this.tweens.add({ targets: np.c, angle: 0, duration: 260, ease: 'Back.Out' });
    this.pieces[this.pieces.indexOf(piece)] = np;
    this.consume(i);
  }

  onBoardTap(p) {
    if (!this.mode || this.mode.target !== 'cell' || this.busy) return;
    const c = Math.floor((p.x - BX) / CELL);
    const r = Math.floor((p.y - BY) / CELL);
    if (r < 0 || c < 0 || r >= N || c >= N) return;
    const { id, index } = this.mode;
    let cells = [];
    if (id === 'martillo') {
      if (!this.board[r][c]) { toast(this, 'Toca un bloque, no un espacio vacío'); sfx.error(); return; }
      cells = [[r, c]];
      this.cameras.main.shake(120, 0.004);
    } else if (id === 'bomba') {
      for (let rr = r - 1; rr <= r + 1; rr++) for (let cc = c - 1; cc <= c + 1; cc++) {
        if (rr >= 0 && cc >= 0 && rr < N && cc < N && this.board[rr][cc]) cells.push([rr, cc]);
      }
      sfx.boom();
      this.cameras.main.shake(300, 0.012);
      const { x, y } = this.cellXY(r, c);
      this.sparks.explode(26, x, y);
    } else if (id === 'rayo') {
      for (let k = 0; k < N; k++) {
        if (this.board[r][k]) cells.push([r, k]);
        if (k !== r && this.board[k][c]) cells.push([k, c]);
      }
      sfx.boom();
      this.cameras.main.flash(180, 255, 240, 160);
      this.cameras.main.shake(220, 0.008);
    }
    this.clearCells(cells, 8);
    this.addScore(cells.length * 10);
    vibe(40);
    this.consume(index);
  }

  restore(s) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (this.sprites[r][c]) this.sprites[r][c].destroy();
      this.sprites[r][c] = null;
    }
    Object.values(this.bombaTxt).forEach((t) => t.destroy());
    this.bombaTxt = {};
    this.bombas = { ...(s.bombas || {}) };
    this.board = s.board.map((r) => [...r]);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (this.board[r][c]) this.addBlock(r, c, this.board[r][c], false);
    this.pieces.forEach((p) => p.c && p.c.destroy());
    this.pieces = s.pieces.map((d, i) => (d.used ? { used: true, c: null } : this.makePiece(d, i, false)));
    const diff = this.runBricks - s.runBricks;
    save.bricks -= diff;
    persist();
    this.brickChip.setValue(save.bricks);
    this.runBricks = s.runBricks;
    this.score = s.score;
    this.addScore(0);
    this.combo = s.combo;
    this.miss = s.miss;
    this.linesTotal = s.linesTotal;
    this.nextOffer = s.nextOffer;
    this.updateComboText();
  }

  // ---------- Bloques peligrosos ----------
  dibujarBomba(r, c) {
    const k = r * N + c;
    if (this.bombas[k] == null) this.bombas[k] = PELIGRO.bomba.turnos;
    if (this.bombaTxt[k]) this.bombaTxt[k].destroy();
    const { x, y } = this.cellXY(r, c);
    const t = txt(this, x + 22, y + 24, String(this.bombas[k]), 46, '#ffffff', { stroke: '#3a0614', strokeW: 9 }).setDepth(14);
    this.bombaTxt[k] = t;
    this.pintarBomba(k);
  }

  pintarBomba(k) {
    const t = this.bombaTxt[k];
    if (!t) return;
    const n = this.bombas[k];
    t.setText(String(n));
    this.tweens.killTweensOf(t);
    t.setScale(1);
    if (n <= 2) {
      t.setColor('#ff5a5a');
      this.tweens.add({ targets: t, scale: 1.35, duration: 260, yoyo: true, repeat: -1 });
    } else t.setColor('#ffffff');
  }

  spawnPeligros() {
    if (this.reto || this.tiempo || this.over || this.linesTotal < PELIGRO.desdeLineas) return;
    const libres = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (this.board[r][c]) continue;
      const enFila = this.board[r].filter(Boolean).length;
      const enCol = this.board.filter((row) => row[c]).length;
      if (enFila < N - 2 && enCol < N - 2) libres.push([r, c]);
    }
    Phaser.Utils.Array.Shuffle(libres);
    let aviso = null;
    if (!Object.keys(this.bombas).length && libres.length && Math.random() < PELIGRO.bomba.chance) {
      const [r, c] = libres.pop();
      const k = r * N + c;
      this.board[r][c] = 'bomba';
      this.bombas[k] = PELIGRO.bomba.turnos;
      this.bombasNuevas.add(k);
      this.addBlock(r, c, 'bomba', true);
      this.cameras.main.shake(120, 0.003);
      sfx.alarma();
      if (!save.peligros.bomba) aviso = ['bomba', '¡BOMBA! Limpia su línea antes del 0'];
    }
    const hielos = this.board.flat().filter((v) => v === 'hielo' || v === 'hielo2').length;
    if (hielos < PELIGRO.hielo.max && libres.length && Math.random() < PELIGRO.hielo.chance) {
      const n = Math.min(libres.length, Math.random() < 0.5 ? 1 : 2);
      for (let i = 0; i < n; i++) {
        const [r, c] = libres.pop();
        this.board[r][c] = 'hielo';
        this.addBlock(r, c, 'hielo', true);
      }
      sfx.crack();
      if (!aviso && !save.peligros.hielo) aviso = ['hielo', 'HIELO: se rompe con 2 líneas'];
    }
    if (aviso && !window.__capture) {
      save.peligros[aviso[0]] = true;
      persist();
      this.time.delayedCall(450, () => toast(this, aviso[1], 352, 3000));
    }
  }

  // Cada pieza colocada acerca las bombas a 0. Devuelve true si una explotó.
  tickBombas() {
    let boom = null;
    Object.keys(this.bombas).forEach((key) => {
      const k = Number(key);
      if (this.bombasNuevas.has(k)) return;
      this.bombas[k] -= 1;
      this.pintarBomba(k);
      if (this.bombas[k] <= 2 && this.bombas[k] > 0) { sfx.alarma(); vibe(30); }
      if (this.bombas[k] <= 0 && !boom) boom = k;
    });
    this.bombasNuevas.clear();
    if (boom == null) return false;
    this.explotar(Math.floor(boom / N), boom % N);
    return true;
  }

  explotar(r, c) {
    this.busy = true;
    this.causa = 'bomba';
    const { x, y } = this.cellXY(r, c);
    sfx.boom();
    vibe(200);
    this.cameras.main.flash(260, 255, 80, 60);
    this.cameras.main.shake(600, 0.025);
    this.fx.red.explode(40, x, y);
    this.fx.orange.explode(40, x, y);
    this.sparks.explode(40, x, y);
    const ring = this.add.circle(x, y, 40).setStrokeStyle(20, 0xff7a2b).setDepth(170);
    this.tweens.add({ targets: ring, scale: 12, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
    floatText(this, W / 2, 860, '¡BOOM!', 150, '#ffd23f', '#7a1206');
    this.time.delayedCall(900, () => this.gameOver('¡Explotó la bomba!'));
  }

  desactivarBomba(r, c) {
    const { x, y } = this.cellXY(r, c);
    this.bombasDesactivadas += 1;
    this.addScore(PELIGRO.bomba.puntos);
    this.addBricks(PELIGRO.bomba.ladrillos, x, y);
    this.time.delayedCall(200, () => {
      this.sparks.explode(30, x, y);
      confetti(this, x, y, 30);
      floatText(this, W / 2, BY + 230, `¡DESACTIVADA! +${PELIGRO.bomba.ladrillos}`, 80, '#7ef0a0', '#0e3a1e');
      sfx.coin();
      this.time.delayedCall(120, () => sfx.build());
    });
  }

  // ---------- Partida guardada ----------
  guardarPartida() {
    if (this.reto || this.tiempo || this.over || window.__capture || !this.pieces.length) return;
    save.partida = {
      v: 1,
      at: Date.now(),
      board: this.board.map((r) => [...r]),
      pieces: this.pieces.map((p) => (p.used ? { used: true } : { cells: p.cells, color: p.color, gold: p.gold, used: false })),
      score: this.score,
      runBricks: this.runBricks,
      combo: this.combo,
      miss: this.miss,
      linesTotal: this.linesTotal,
      nextOffer: this.nextOffer,
      powers: this.powers.slice(),
      doubleBricks: this.doubleBricks,
      offerPending: this.offerPending || !!this.offerOpen,
      bombas: { ...this.bombas },
    };
    persist();
  }

  reanudar(p) {
    this.bombas = { ...(p.bombas || {}) };
    p.board.forEach((row, r) => row.forEach((col, c) => {
      if (col) { this.board[r][c] = col; this.addBlock(r, c, col, false); }
    }));
    this.score = p.score || 0;
    this.addScore(0);
    this.runBricks = p.runBricks || 0;
    this.combo = p.combo || 0;
    this.miss = p.miss || 0;
    this.linesTotal = p.linesTotal || 0;
    this.nextOffer = p.nextOffer || LINES_PER_OFFER;
    this.powers = (p.powers || []).slice(0, MAX_POWERS);
    if (p.doubleBricks) {
      this.doubleBricks = true;
      this.brickChip.list[0].clear().fillStyle(0xb47814, 0.9).fillRoundedRect(-115, -40, 230, 80, 40);
    }
    this.renderPowers();
    this.updateComboText();
    if (!p.pieces || p.pieces.every((d) => d.used)) this.newTray(true);
    else this.pieces = p.pieces.map((d, i) => (d.used ? { used: true, c: null } : this.makePiece({ cells: d.cells, color: d.color, gold: d.gold }, i, true)));
    this.offerPending = !!p.offerPending;
    this.time.delayedCall(350, () => toast(this, '¡Partida recuperada! Sigue donde te quedaste', 352, 2200));
    this.time.delayedCall(700, () => this.afterMove());
  }

  // ---------- Contrarreloj ----------
  iniciarTiempo() {
    this.nextOffer = 99999;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x0c0f30, 0.8);
    g.fillRoundedRect(BX - 22, 352, N * CELL + 44, 30, 15);
    this.timerBar = this.add.graphics().setDepth(6);
    this.timerText = txt(this, W / 2, 345, '', 40, '#ffffff', { stroke: '#141432', strokeW: 8 }).setDepth(7);
    this.drawTimer();
    txt(this, W / 2, 1720, 'Cada línea suma +1 s · Si te trabas: piezas nuevas -3 s', 28, '#b8b8e0', { weight: '700' });
    this.hintTiempo = txt(this, W / 2, 1790, 'El reloj arranca al mover la primera pieza', 32, '#ffd93d', { weight: '800' });
    this.tweens.add({ targets: this.hintTiempo, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
    this.time.delayedCall(400, () => toast(this, '¡Haz todos los puntos que puedas en 60 s!', 1655, 2600));
  }

  arrancarTiempo() {
    this.tiempoOn = true;
    if (this.hintTiempo) { this.hintTiempo.destroy(); this.hintTiempo = null; }
  }

  sumarTiempo(ms, x, y) {
    this.tiempoRest = Math.max(0, this.tiempoRest + ms);
    const s = Math.round(ms / 1000);
    floatText(this, Phaser.Math.Clamp(x - 200, 200, 880), y + 10, `${s > 0 ? '+' : ''}${s} s`, 60, s > 0 ? '#7ef0a0' : '#ff7a7a', '#14321e');
    if (this.timerText) this.tweens.add({ targets: this.timerText, scale: 1.35, duration: 120, yoyo: true });
    this.drawTimer();
  }

  updateTiempo(delta) {
    if (!this.tiempoOn || this.over) return;
    this.tiempoRest -= delta;
    const seg = Math.ceil(this.tiempoRest / 1000);
    if (this.tiempoRest <= TIEMPO.alerta && seg !== this.tiempoTick && seg > 0) {
      this.tiempoTick = seg;
      sfx.tick();
      this.tweens.add({ targets: this.timerText, scale: 1.3, duration: 110, yoyo: true });
    }
    if (this.tiempoRest <= 0) {
      this.tiempoRest = 0;
      this.drawTimer();
      this.cameras.main.flash(200, 255, 120, 120);
      floatText(this, W / 2, 860, '¡TIEMPO!', 130, '#ffffff', '#b3260f');
      this.gameOver('¡Se acabó el tiempo!');
      return;
    }
    this.drawTimer();
  }

  drawTimer() {
    if (!this.timerBar) return;
    const k = Phaser.Math.Clamp(this.tiempoRest / TIEMPO.dur, 0, 1);
    const alerta = this.tiempoRest <= TIEMPO.alerta;
    this.timerBar.clear();
    this.timerBar.fillStyle(alerta ? 0xff4e4e : k < 0.5 ? 0xffc23d : 0x5ad86a, 1);
    const w = (N * CELL + 36) * k;
    if (w > 4) this.timerBar.fillRoundedRect(BX - 18, 356, w, 22, 11);
    const s = Math.ceil(this.tiempoRest / 1000);
    this.timerText.setText(`${s} s`).setColor(alerta ? '#ff7a7a' : '#ffffff');
  }

  cancelDrag() {
    if (!this.drag) return;
    const pc = this.drag.piece;
    this.drag = null;
    this.ghost.clear();
    if (pc.c) {
      pc.c.setDepth(20);
      this.tweens.add({ targets: pc.c, x: SLOTS[pc.slot], y: TRAY_Y, scale: 1, duration: 220, ease: 'Cubic.Out' });
    }
  }

  // ---------- Reto del día ----------
  iniciarReto() {
    const R = this.reto;
    this.nextOffer = 9999;
    this.recordText.setText(`RETO DEL DÍA #${R.numero}`).setColor('#ffd93d');
    this.retoText = txt(this, W / 2, 345, `Líneas: 0 / ${R.meta}`, 34, '#ffffff', { weight: '800' }).setDepth(50);
    R.board.forEach((row, r) => row.forEach((col, c) => {
      if (col) { this.board[r][c] = col; this.addBlock(r, c, col, false); }
    }));
    this.pieces = R.piezas.map((d, i) => this.makePiece({ cells: d.cells.map((x) => [...x]), color: d.color }, i, true));
    txt(this, W / 2, 1690, `Limpia ${R.meta} líneas usando estas 3 piezas`, 38, '#ffffff', { weight: '800' });
    txt(this, W / 2, 1750, 'Las piezas no se repiten: piensa bien dónde va cada una', 28, '#b8b8e0', { weight: '600' });
    const hecho = save.reto.last === today();
    txt(this, W / 2, 1820, hecho ? 'Ya ganaste el premio de hoy: juega por diversión' : `Premio: ${RETO_PREMIO} ladrillos`, 30, hecho ? '#9ad09a' : '#ffd93d', { weight: '700' });
    this.time.delayedCall(450, () => toast(this, `Reto #${R.numero}: limpia ${R.meta} líneas con 3 piezas`, 352, 2400));
  }

  finReto() {
    if (this.over) return;
    this.over = true;
    this.busy = true;
    const R = this.reto;
    const ok = this.linesTotal >= R.meta;
    let premio = 0;
    if (ok && save.reto.last !== today()) {
      save.reto.racha = save.reto.last === ayer() ? save.reto.racha + 1 : 1;
      save.reto.last = today();
      premio = RETO_PREMIO;
      persist();
      this.addBricks(premio, W / 2, 900, true);
    }
    track('reto', { numero: R.numero, ok, lineas: this.linesTotal, premio: premio > 0 });
    if (ok) { sfx.build(); confetti(this, W / 2, 600, 90); } else sfx.over();
    this.time.delayedCall(ok ? 900 : 600, () => this.resumenReto(ok, premio));
  }

  resumenReto(ok, premio) {
    const R = this.reto;
    const layer = this.add.container(0, 0).setDepth(300);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive());
    const panel = this.add.container(W / 2, 930).setScale(0.3);
    layer.add(panel);
    const g = this.add.graphics();
    g.fillStyle(0x6a3ab8, 1); g.fillRoundedRect(-420, -400, 840, 820, 50);
    g.fillStyle(0xfff7e8, 1); g.fillRoundedRect(-420, -410, 840, 810, 50);
    panel.add(g);
    panel.add(txt(this, 0, -330, ok ? `¡Reto #${R.numero} superado!` : '¡Casi!', 62, '#46286e'));
    panel.add(txt(this, 0, -235, `Limpiaste ${Math.min(this.linesTotal, R.meta)} de ${R.meta} líneas`, 40, ok ? '#2a9a4a' : '#c84a4a'));
    if (premio) {
      const bt = txt(this, 45, -140, `+${premio} ladrillos`, 50, '#c8502a');
      panel.add(bt);
      panel.add(icon(this, 45 - bt.width / 2 - 55, -140, 'ui_ladrillo', 80));
      panel.add(txt(this, 0, -55, `Racha: ${save.reto.racha} ${save.reto.racha === 1 ? 'día' : 'días'} seguidos`, 38, '#e0901a'));
    } else if (ok) {
      panel.add(txt(this, 0, -120, 'Ya habías ganado el premio de hoy', 34, '#8c7aa0', { weight: '700' }));
    } else {
      panel.add(txt(this, 0, -120, 'Hay una forma de lograrlo. ¡Inténtalo otra vez!', 32, '#8c7aa0', { weight: '700', wrap: 700 }));
    }
    panel.add(txt(this, 0, 30, 'Mañana hay un reto nuevo', 32, '#8c7aa0', { weight: '600' }));
    if (ok) {
      panel.add(button(this, 0, 170, 600, 120, 'Jugar partida', 0x5ac85a, () => this.scene.start('Game', { reto: false, modo: null })));
    } else {
      panel.add(button(this, 0, 170, 600, 120, 'Reintentar', 0x5ac85a, () => this.scene.restart({ reto: true })));
    }
    panel.add(button(this, 0, 310, 600, 110, 'Menú', 0x6a3ab8, () => this.scene.start('Menu'), { size: 42 }));
    this.tweens.add({ targets: panel, scale: 1, duration: 380, ease: 'Back.Out' });
  }

  // ---------- Fin de partida ----------
  gameOver(titulo) {
    if (this.over && this.summaryShown) return;
    this.over = true;
    this.summaryShown = true;
    this.cancelDrag();
    this.combo = 0;
    this.updateComboText();
    this.busy = true;
    const endBricks = Math.floor(this.score / (this.evento ? EVENTO.divisorBono : BRICKS.endPer));
    if (endBricks > 0) this.addBricks(endBricks, W / 2, 900);
    const recordPrev = this.tiempo ? save.tiempo.record : save.record;
    const newRecord = this.score > recordPrev;
    track('partida', { modo: this.tiempo ? 'tiempo' : 'normal', puntos: this.score, lineas: this.linesTotal, ladrillos: this.runBricks, record: newRecord, segundos: Math.round((this.time.now - this.t0) / 1000), tema: this.tema || '', causa: this.causa || 'espacio', bombas: this.bombasDesactivadas });
    if (this.tiempo) {
      if (newRecord) save.tiempo.record = this.score;
      save.tiempo.partidas += 1;
    } else if (newRecord) save.record = this.score;
    save.games += 1;
    save.partida = null;
    persist();
    sfx.over();
    for (let r = 0; r < N; r++) {
      this.time.delayedCall(r * 70, () => {
        for (let c = 0; c < N; c++) if (this.sprites[r][c]) this.sprites[r][c].setTint(0x777788);
      });
    }
    this.time.delayedCall(900, () => this.showSummary(newRecord, titulo || '¡Sin espacio!'));
  }

  showSummary(newRecord, titulo) {
    const layer = this.add.container(0, 0).setDepth(300);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive());
    const panel = this.add.container(W / 2, 930).setScale(0.3);
    layer.add(panel);
    const g = this.add.graphics();
    g.fillStyle(0xaa5a1e, 1); g.fillRoundedRect(-420, -430, 840, 880, 50);
    g.fillStyle(0xfff7e8, 1); g.fillRoundedRect(-420, -440, 840, 870, 50);
    panel.add(g);
    panel.add(txt(this, 0, -360, titulo, 70, '#46286e'));
    panel.add(txt(this, 0, -270, 'Puntos', 34, '#8c7aa0', { weight: '700' }));
    panel.add(txt(this, 0, -190, this.score.toLocaleString('es-MX'), 110, '#46286e'));
    if (newRecord) {
      const rec = txt(this, 0, -90, '¡NUEVO RÉCORD!', 46, '#e0901a', { stroke: '#ffffff', strokeW: 6 });
      panel.add(rec);
      this.tweens.add({ targets: rec, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
    } else {
      panel.add(txt(this, 0, -90, `Récord${this.tiempo ? ' 60 s' : ''}: ${(this.tiempo ? save.tiempo.record : save.record).toLocaleString('es-MX')}`, 36, '#8c7aa0', { weight: '700' }));
    }
    const bt = txt(this, 45, 10, `+${this.runBricks} ladrillos`, 50, '#c8502a');
    panel.add(bt);
    panel.add(icon(this, 45 - bt.width / 2 - 55, 10, 'ui_ladrillo', 80));
    const next = BUILDINGS.find((b) => !isBuilt(b.id));
    if (next) {
      const ok = save.bricks >= next.cost;
      panel.add(txt(this, 0, 95, ok ? `¡Ya te alcanza para la ${next.name}!` : `Te faltan ${next.cost - save.bricks} para la ${next.name}`, 32, ok ? '#2a9a4a' : '#8c7aa0', { weight: '700' }));
    }
    panel.add(button(this, 0, 220, 600, 120, this.tiempo ? 'Otra vez (60 s)' : 'Otra partida', 0x5ac85a, () => this.scene.restart({ reto: false, modo: this.tiempo ? 'tiempo' : null })));
    panel.add(button(this, 0, 360, 600, 110, 'Ir al pueblo', 0xff8c2b, () => this.scene.start('Village'), { size: 42 }));
    this.tweens.add({ targets: panel, scale: 1, duration: 380, ease: 'Back.Out' });
    if (newRecord) confetti(this, W / 2, 600, 80);
  }
}
