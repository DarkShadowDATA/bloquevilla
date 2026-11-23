import { botonMasJuegos } from '../masjuegos.js';
import Phaser from 'phaser';
import { W, H, COLORS, HEX, BUILDINGS, DAILY, NOMBRE_TEMA, VERSION } from '../config.js';
import { nube, loginUrl, onNube } from '../nube.js';
import { porCobrarLogros, porcentaje } from '../logros.js';
import { pruebaDisponible } from '../prueba.js';
import { temaDragon, nuevos, premioListo } from '../coleccion.js';
import { cobrarCofreSemanal } from '../bonos.js';
import { save, persist, isBuilt, dailyAvailable, dailyIndex, today } from '../save.js';
import { EVENTO, eventoActivo, diasRestantes } from '../evento.js';
import { retoNumero } from '../reto.js';
import { premioSemanal, cobrarSemanal } from '../pozo.js';
import { acertijoNumero } from '../acertijo.js';
import { abrirAjustes } from '../ajustes.js';
import { sfx } from '../sfx.js';
import { txt, background, icon, button, toast, confetti, marco, chip, tile, badge, navBar, dibujo, UI } from '../ui.js';
import { premioPendiente, cobrarPremio } from '../ranking.js';
import { multRegalo } from '../bonos.js';
import { misionesHoy, porCobrar, cobrar, abrirCofre, cofreListo, cumplida, textoMision, iconoMision, premioMision, ladrillosCofre, faltaParaNuevas } from '../misiones.js';
import { POWERS } from '../powers.js';

export default class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    background(this, 'bg_menu', 'grad_menu');
    this.floatingBlocks();
    // velo oscuro arriba y abajo para que todo se lea parejo sobre el fondo
    const velo = this.add.graphics();
    for (let i = 0; i < 26; i++) {
      velo.fillStyle(UI.tinta, 0.5 * (1 - i / 26)); velo.fillRect(0, i * 20, W, 20);
      velo.fillStyle(UI.tinta, 0.6 * (i / 26)); velo.fillRect(0, 1400 + i * 20, W, 20);
    }

    // Logo
    if (this.textures.exists('logo')) {
      const lg = icon(this, W / 2, 330, 'logo', 780).setScale(0);
      const s = 780 / this.textures.get('logo').getSourceImage().width;
      this.tweens.add({ targets: lg, scale: s, duration: 600, ease: 'Back.Out' });
    } else {
      txt(this, W / 2, 330, 'Bloquevilla', 120, '#ffffff', { stroke: UI.texto, strokeW: 14 });
    }
    txt(this, W / 2, 468, 'Puzzle de bloques · reconstruye tu pueblo', 32, '#ffffff', { weight: '700', stroke: '#1c154288', strokeW: 6 });

    const cofreSem = cobrarCofreSemanal();   // antes de pintar los ladrillos
    const built = save.built.length;
    // Fila de datos: récord, ladrillos y pueblo
    [['ui_trofeo', save.record.toLocaleString('es-MX')], ['ui_ladrillo', String(save.bricks)], ['ui_estrella', `${built}/${BUILDINGS.length}`]]
      .forEach(([k, v], i) => chip(this, W / 2 + (i - 1) * 320, 578, 290, k, v));

    if (eventoActivo()) this.bannerEvento();
    else this.bannerPozo(712);

    // Jugar (o Continuar + Nueva)
    if (save.partida) {
      const pts = (save.partida.score || 0).toLocaleString('es-MX');
      const cb = button(this, W / 2 - 130, 880, 640, 170, 'Continuar', UI.verde, () => this.scene.start('Game', { reto: false, modo: null }), { size: 66 });
      cb.label.setY(-20);
      cb.add(txt(this, 0, 40, `Tu partida: ${pts} pts`, 28, '#ffffffdd', { weight: '700' }));
      this.tweens.add({ targets: cb, scale: 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      button(this, W / 2 + 330, 880, 240, 170, 'Nueva', 0x23955a, () => {
        save.partida = null;
        persist();
        this.scene.start('Game', { reto: false, modo: null, nueva: true });
      }, { size: 42 });
    } else {
      const jb = button(this, W / 2, 880, 900, 170, 'Jugar', UI.verde, () => this.scene.start('Game', { reto: false, modo: null }), { size: 80 });
      this.tweens.add({ targets: jb, scale: 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // Modos de juego: 2 × 2 tarjetas
    const TW = 440, TH = 170, X1 = W / 2 - 230, X2 = W / 2 + 230, Y1 = 1100, Y2 = 1295;
    const estrellas = (save.aventura.estrellas || []).reduce((a, b) => a + (b || 0), 0);
    const avNuevo = !(save.aventura.estrellas || []).some((e) => e > 0);
    tile(this, X1, Y1, TW, TH, { title: 'Aventura', sub: avNuevo ? '60 niveles y jefes' : `${estrellas}/180 estrellas`, color: UI.verde, dibujo: (sc, x, y) => dibujo(sc, 'mapa', x, y, 1.1), onClick: () => this.scene.start('Aventura') });
    if (avNuevo) badge(this, X1 + TW / 2 - 40, Y1 - TH / 2 + 6, 'NUEVO');
    const nHechos = (save.reto.last === today() ? 1 : 0) + (save.acertijo.last === today() ? 1 : 0);
    tile(this, X2, Y1, TW, TH, { title: 'Retos del día', sub: nHechos === 2 ? 'Hechos hoy ✓' : `${nHechos}/2 hechos hoy`, color: UI.morado, dibujo: (sc, x, y) => dibujo(sc, 'calendario', x, y, 1.1), onClick: () => this.openRetos() });
    if (nHechos < 2) badge(this, X2 + TW / 2 - 30, Y1 - TH / 2 + 6, !save.acertijo.last && !save.acertijoVisto ? 'NUEVO' : String(2 - nHechos));
    const subT = !save.tiempo.partidas ? 'Limpia todo lo que puedas' : `Récord ${(save.tiempo.record || 0).toLocaleString('es-MX')}`;
    tile(this, X1, Y2, TW, TH, { title: 'Contrarreloj 60 s', sub: subT, color: UI.turquesa, dibujo: (sc, x, y) => dibujo(sc, 'reloj', x, y, 1.1), onClick: () => this.scene.start('Game', { reto: false, modo: 'tiempo' }) });
    if (!save.tiempo.partidas) badge(this, X1 + TW / 2 - 40, Y2 - TH / 2 + 6, 'NUEVO');
    tile(this, X2, Y2, TW, TH, { title: 'Ranking', sub: 'Premios cada lunes', color: UI.oro, iconKey: 'ui_trofeo', iconSize: 76, onClick: () => this.scene.start('Ranking') });

    // Tema de bloques (si hay más de uno)
    const temas = ['clasico'];
    if (isBuilt('pozo')) temas.push('agua');
    if (save.muertos.tema) temas.push('muertos');
    if (temaDragon()) temas.push('dragon');
    save.tienda.temas.forEach((t) => temas.push(t));
    const prueba = pruebaDisponible();   // tema premium que hoy se presta por una partida
    if (prueba) temas.splice(1, 0, prueba);   // queda a un toque del Clásico
    if (temas.length > 1) {
      if (!temas.includes(save.theme)) save.theme = 'clasico';
      const nombre = { clasico: eventoActivo() ? 'Evento' : 'Clásico', agua: 'Agua', muertos: 'Día de Muertos', ...NOMBRE_TEMA };
      const label = () => (save.theme === prueba ? `🎁 Tema: ${nombre[save.theme]}` : `🎨 Tema: ${nombre[save.theme]}`);
      const tb = button(this, W / 2, 1478, 520, 88, label(), UI.tinta2, () => {
        save.theme = temas[(temas.indexOf(save.theme) + 1) % temas.length];
        persist();
        tb.label.setText(label());
        if (save.theme === prueba) toast(this, `Tema ${nombre[prueba]} gratis en tu próxima partida`, 1380, 2200);
      }, { size: 32 });
      if (prueba) badge(this, W / 2 + 250, 1428, '¡GRATIS HOY!', UI.morado);
    }

    // Más juegos de DarkShadow (quien llegó por anuncio lo ve hasta terminar su primera partida o nivel)
    botonMasJuegos(this, W / 2, temas.length > 1 ? 1584 : 1478, 520, 80, 30);

    // Barra de abajo: pueblo, tienda, misiones, regalo y logros
    const M = misionesHoy();
    const pend = porCobrar();
    const nuevosCol = nuevos();
    const lp = porCobrarLogros() + nuevosCol.length + (premioListo() ? 1 : 0);
    const regaloHoy = dailyAvailable();
    navBar(this, [
      { label: 'Mi pueblo', iconKey: 'bld_casa', iconSize: 84, onClick: () => this.scene.start('Village') },
      { label: 'Tienda', iconKey: 'ui_tienda', iconSize: 84, badge: !save.tienda.visto ? 'NUEVO' : null, onClick: () => this.scene.start('Shop') },
      { label: `Misiones ${M.lista.filter(cumplida).length}/3`, dibujo: 'lista', badge: pend || (!save.misionesVistas ? 'NUEVO' : null), onClick: () => this.openMisiones() },
      { label: 'Regalo', iconKey: 'ui_regalo', iconSize: 74, apagado: !regaloHoy, badge: regaloHoy ? '!' : null,
        onClick: () => (regaloHoy ? this.openDaily() : toast(this, isBuilt('panaderia') ? 'Vuelve mañana por tu regalo diario' : 'Construye la Panadería para recibir regalos diarios', 1560, 2200)) },
      { label: `Logros ${porcentaje()}%`, iconKey: 'medalla_oro', iconSize: 74, badge: lp || (!save.logrosVistos ? 'NUEVO' : null), onClick: () => this.scene.start('Logros') },
    ]);
    if (nuevosCol.length) this.time.delayedCall(900, () => this.sys.isActive() && toast(this, `📖 Nueva pieza en tu colección: ${nuevosCol[0].nombre}`, 1580, 2800));

    // Cuenta (arriba a la izquierda) y ajustes (arriba a la derecha)
    this.engrane(990, 100);
    this.cuenta();
    // Cofre semanal de la Tesorería (zona 3): se cobra solo, una vez por semana
    if (cofreSem) {
      this.time.delayedCall(700, () => {
        if (!this.sys.isActive()) return;
        sfx.build(); confetti(this, W / 2, 620, 70);
        toast(this, `🎁 Cofre de la Tesorería: +${cofreSem} ladrillos`, 620, 3200);
      });
    }
    // premio del Reto semanal de la semana pasada (solo ladrillos y medalla del juego)
    const semanal = () => premioSemanal().then((p) => {
      if (!p) return;
      cobrarSemanal(p);
      if (!this.sys.isActive()) return;
      sfx.build();
      confetti(this, W / 2, 700, 90);
      toast(this, `¡Quedaste #${p.lugar} en el Reto semanal! +${p.premio} ladrillos`, 700, 3500);
    }).catch(() => {});
    semanal();
    if (!Menu.oyeNube) { Menu.oyeNube = true; onNube(() => { const m = this.scene.get('Menu'); if (m && m.sys.isActive() && m.semanal) m.semanal(); else semanal(); }); }
    this.semanal = semanal;
    premioPendiente().then((p) => {
      if (!p || !this.sys.isActive()) return;
      cobrarPremio(p);
      sfx.build();
      confetti(this, W / 2, 700, 90);
      toast(this, `¡Quedaste #${p.lugar} en el ranking de la semana pasada! +${p.premio} ladrillos`, 700, 3500);
    }).catch(() => {});
  }

  // Tarjeta del Reto semanal (premios del juego para el top 10)
  bannerPozo(y) {
    const c = this.add.container(W / 2, y);
    const w = 900, h = 120;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 9, w - 6, h, 34);
    g.fillGradientStyle(0xffc93c, 0xffc93c, 0xe08a12, 0xe08a12, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 34);
    g.lineStyle(4, 0xfff0b8, 0.8); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 34);
    c.add(g);
    c.add(icon(this, -w / 2 + 70, 0, 'ui_trofeo', 84));
    const t1 = txt(this, -w / 2 + 130, -20, 'Reto semanal', 40, '#3a2200').setOrigin(0, 0.5);
    const t2 = txt(this, -w / 2 + 130, 24, 'El top 10 gana ladrillos cada lunes', 26, '#5a3a08', { weight: '700' }).setOrigin(0, 0.5);
    [t1, t2].forEach((t) => { if (t.width > w - 230) t.setScale((w - 230) / t.width); });
    c.add([t1, t2]);
    const fl = this.add.graphics();
    fl.lineStyle(9, 0x3a2200, 0.85); fl.beginPath(); fl.moveTo(w / 2 - 62, -18); fl.lineTo(w / 2 - 44, 0); fl.lineTo(w / 2 - 62, 18); fl.strokePath();
    c.add(fl);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => { sfx.click(); this.tweens.add({ targets: c, scale: 0.97, duration: 70, yoyo: true, onComplete: () => this.scene.start('Pozo') }); });
  }

  bannerEvento() {
    const pp = this.add.image(W / 2, 0, 'deco_papel_picado').setOrigin(0.5, 0);
    pp.setDisplaySize(W + 40, (W + 40) * (pp.height / pp.width));
    this.tweens.add({ targets: pp, angle: { from: -0.6, to: 0.6 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const m = this.add.image(W / 2, 710, 'evento_marco');
    const ratio = m.height / m.width;
    const h = Math.min(820 * ratio, 150);
    m.setDisplaySize(h / ratio, h);
    const dias = diasRestantes();
    txt(this, W / 2, 690, 'DÍA DE MUERTOS', 44, '#ffd23f', { stroke: '#3a1240', strokeW: 8 });
    const f = save.muertos.tema ? '¡Tema desbloqueado!' : `${save.muertos.flores}/${EVENTO.meta} flores`;
    txt(this, W / 2 + 26, 738, `${f} · ${dias === 1 ? 'último día' : `quedan ${dias} días`}`, 30, '#ffffff', { weight: '700', stroke: '#3a1240', strokeW: 6 });
    const t = txt(this, 0, 0, `${f} · ${dias === 1 ? 'último día' : `quedan ${dias} días`}`, 30, '#ffffff', { weight: '700' });
    const w = t.width; t.destroy();
    const fl = icon(this, W / 2 + 26 - w / 2 - 30, 738, 'ui_flor', 44);
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
    const b = button(this, 200, 100, 340, 84, label, nube.on ? UI.tinta2 : UI.morado, () => {
      if (nube.on) toast(this, 'Tu partida se guarda en tu cuenta DarkShadow', 900, 2200);
      else location.href = loginUrl();
    }, { size: nube.on ? 30 : 32 });
    b.label.setFontSize(Math.min(32, Math.floor(30 * 280 / Math.max(280, b.label.width))));
    if (save.fundador) {
      const f = txt(this, 200, 172, '👑 Fundador', 28, '#ffd93d', { stroke: '#3a1250', strokeW: 8 });
      this.tweens.add({ targets: f, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    if (save.apoyo > 0) txt(this, 200, save.fundador ? 214 : 172, '☕ Apoyo', 26, '#ffe9c8', { stroke: '#3a1250', strokeW: 8 });
    if (save.coleccion && save.coleccion.premio) txt(this, save.apoyo > 0 ? 360 : 230, save.fundador ? 214 : 172, '📖 Coleccionista', 26, '#c8f0ff', { stroke: '#3a1250', strokeW: 8 });
  }

  engrane(x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillCircle(0, 5, 52);
    g.fillStyle(UI.tinta, 0.92); g.fillCircle(0, 0, 52);
    g.lineStyle(3, 0xffffff, 0.16); g.strokeCircle(0, 0, 52);
    const im = icon(this, 0, 0, 'ui_ajustes', 64);
    c.add([g, im]);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, 58), Phaser.Geom.Circle.Contains);
    c.on('pointerdown', () => { sfx.click(); this.tweens.add({ targets: im, angle: 90, duration: 250 }); abrirAjustes(this); });
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

  openRetos() {
    if (!save.acertijoVisto) { save.acertijoVisto = true; persist(); }
    const layer = this.add.container(0, 0).setDepth(300);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setInteractive());
    const panel = this.add.container(W / 2, 960).setScale(0.3);
    layer.add(panel);
    this.tweens.add({ targets: panel, scale: 1, duration: 320, ease: 'Back.Out' });
    const g = this.add.graphics();
    marco(g, -460, -440, 920, 860, 0x4a2a8a);
    panel.add(g);
    panel.add(txt(this, 0, -360, 'Retos del día', 64, '#2a1a5e'));
    panel.add(txt(this, 0, -292, 'Iguales para todos · cambian a medianoche', 28, '#6a5a8a', { weight: '700' }));
    const cards = [
      { y: -140, titulo: `Reto #${retoNumero(today())}`, sub: 'Limpia las líneas que te pide con 3 piezas', hecho: save.reto.last === today(), color: 0x7a4ad8, ir: () => this.scene.start('Game', { reto: true }) },
      { y: 110, titulo: `Acertijo #${acertijoNumero(today())}`, sub: 'Deja el tablero VACÍO: el orden importa', hecho: save.acertijo.last === today(), color: 0xd8602a, ir: () => this.scene.start('Game', { acertijo: true }), nuevo: !save.acertijo.last },
    ];
    cards.forEach((k) => {
      const card = this.add.graphics();
      card.fillStyle(0xffffff, 1); card.fillRoundedRect(-420, k.y - 105, 840, 210, 30);
      card.lineStyle(5, k.hecho ? 0x4ab86a : 0xd6d0ea, 1); card.strokeRoundedRect(-420, k.y - 105, 840, 210, 30);
      panel.add(card);
      panel.add(txt(this, -380, k.y - 45, k.titulo + (k.hecho ? ' ✓' : ''), 42, '#2a1a5e').setOrigin(0, 0.5));
      const st = txt(this, -380, k.y + 10, k.sub, 28, '#6a5a8a', { weight: '700' }).setOrigin(0, 0.5);
      if (st.width > 500) st.setScale(500 / st.width);
      panel.add(st);
      panel.add(txt(this, -380, k.y + 58, k.hecho ? 'Premio cobrado: juega por diversión' : 'Premio de hoy sin cobrar', 26, k.hecho ? '#4a9a5a' : '#c87a1a', { weight: '700' }).setOrigin(0, 0.5));
      panel.add(button(this, 270, k.y, 220, 110, k.hecho ? 'Otra vez' : 'Jugar', k.hecho ? 0x8a7aa8 : k.color, k.ir, { size: 36 }));
      if (k.nuevo) panel.add(badge(this, 360, k.y - 100, 'NUEVO'));
    });
    panel.add(button(this, 0, 340, 420, 100, 'Cerrar', 0x3a7ad8, () => layer.destroy(), { size: 40 }));
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
    marco(g, -460, -570, 920, 1120, 0x1e4a8a);
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
      const premio = premioMision(m);
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
    panel.add(txt(this, -260, yc + 22, `+${ladrillosCofre()} ladrillos y un poder gratis`, 26, '#8a6a28', { weight: '700' }).setOrigin(0, 0.5));
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
    marco(g, -450, -430, 900, 840, 0xa03a6a);
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
