import Phaser from 'phaser';
import { W, H, TIENDA, COLORS, TIENDA_SHADOW, NOMBRE_TEMA } from '../config.js';
import { nube, comprar, onNube, abrirTienda, pendiente, guardarPendiente, quitarPendiente } from '../nube.js';
import { maxPoderes, precioTienda } from '../bonos.js';
import { save, persist } from '../save.js';
import { POWERS, RARITY } from '../powers.js';
import { sfx, vibe } from '../sfx.js';
import { txt, background, icon, button, toast, chip, confetti, marco, backBtn, topBar, UI, pestanasUI } from '../ui.js';
import { track } from '../stats.js';

const TABS = [['poderes', 'Poderes'], ['temas', 'Temas'], ['deco', 'Pueblo'], ['shadow', 'Shadow']];
const COLS = [290, 790];
const ROWS = [600, 1030, 1460];
const CW = 460, CH = 400;

// Si cambia el saldo (regresó de pagar, entró a su cuenta, llegó un pago de OXXO) y está en la Tienda: terminar lo pendiente y repintar
onNube(() => { const g = window.__game; if (g && g.scene.isActive('Shop')) g.scene.getScene('Shop').alCambiarNube(); });

export default class Shop extends Phaser.Scene {
  constructor() { super('Shop'); }

  create(data) {
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.72);
    backBtn(this, () => this.scene.start('Menu'));
    topBar(this, 'Tienda', { h: 340, depth: 0 });
    this.brickChip = chip(this, 905, 110, 230, 'ui_ladrillo', save.bricks);
    if (!save.tienda.visto) { save.tienda.visto = true; persist(); }
    this.tab = (data && data.tab) || 'poderes';
    this.layer = this.add.container(0, 0);
    this.comprando = false;
    this.show(this.tab);
    this.time.delayedCall(400, () => this.completarPendiente());
  }

  alCambiarNube() {
    if (this.completarPendiente()) return;
    if (this.tab === 'shadow' && !this.comprando) this.show('shadow');
  }

  // Lo que quería comprar cuando no le alcanzó: se compra solo en cuanto llega la Shadow
  completarPendiente() {
    const p = pendiente();
    if (!p || !nube.on || this.comprando) return false;
    const it = (nube.tienda.length ? nube.tienda : TIENDA_SHADOW).find((x) => x.id === p.item);
    if (!it || (it.unaVez && (nube.compras[it.id] || 0) > 0)) { quitarPendiente(); return false; }
    if (nube.shadow < it.shadow) return false;
    quitarPendiente();
    this.comprarShadow(it, null);
    return true;
  }

  comprarShadow(it, c) {
    this.comprando = true;
    if (this.tab !== 'shadow') this.show('shadow');
    return comprar(it.id).then((r) => {
      this.comprando = false;
      if (!this.scene.isActive()) return;
      sfx.build(); vibe(40); confetti(this, c ? c.x : W / 2, c ? c.y - 60 : 700, 60);
      if (it.tema) { save.theme = it.tema; persist(); }
      this.brickChip.setValue(save.bricks);
      toast(this, it.tema ? `¡Tema ${NOMBRE_TEMA[it.tema]} puesto!${r.sumados ? ` +${r.sumados} ladrillos` : ''}` : `+${r.sumados} ladrillos`, 1850, 2400);
      this.time.delayedCall(300, () => this.show('shadow'));
    }).catch((e) => { this.comprando = false; if (this.scene.isActive()) { toast(this, e.message, 1850, 2400); this.show('shadow'); } });
  }

  show(id) {
    this.tab = id;
    (this.tabObjs || []).forEach((o) => o.destroy());
    const antes = this.children.list.length;
    pestanasUI(this, TABS.map(([tid, name]) => ({ id: tid, label: name, ir: () => this.show(tid) })), id, W / 2, 265, 1000, 5);
    this.tabObjs = this.children.list.slice(antes);
    this.layer.removeAll(true);
    if (id === 'poderes') this.showPoderes();
    else if (id === 'temas') this.showTemas();
    else if (id === 'shadow') this.showShadow();
    else this.showDeco();
  }

  // Marco de cada artículo
  card(i, title, desc, rarColor) {
    const x = COLS[i % 2], y = ROWS[Math.floor(i / 2)];
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-CW / 2 + 6, -CH / 2 + 10, CW, CH, 40);
    g.fillStyle(0xfff7e8, 1); g.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 40);
    if (rarColor) { g.lineStyle(8, rarColor, 1); g.strokeRoundedRect(-CW / 2 + 4, -CH / 2 + 4, CW - 8, CH - 8, 36); }
    c.add(g);
    c.add(txt(this, 0, 40, title, 40, '#46286e'));
    const d = txt(this, 0, 88, desc, 24, '#8c7aa0', { weight: '600' });
    if (d.width > CW - 40) d.setScale((CW - 40) / d.width);   // una sola línea: no se encima con el botón
    c.add(d);
    this.layer.add(c);
    return c;
  }

  priceBtn(c, precio, onBuy, label) {
    precio = precioTienda(precio);   // el Mercado del Muelle da descuento
    const ok = save.bricks >= precio;
    const b = button(this, 0, 150, 300, 84, label || `${precio}`, ok ? 0x5ac85a : 0x8a8aa0, () => {
      if (save.bricks < precio) {
        toast(this, `Te faltan ${precio - save.bricks} ladrillos: ¡juega para ganar más!`, 1850, 2000);
        return;
      }
      save.bricks -= precio;
      persist();
      this.brickChip.setValue(save.bricks);
      sfx.build();
      vibe(40);
      confetti(this, c.x, c.y - 60, 40);
      track('compra', { tipo: this.tab, id: c.itemId || '', precio });
      onBuy();
    }, { size: 40, iconKey: label ? undefined : 'ui_ladrillo' });
    c.add(b);
    return b;
  }

  stateBtn(c, label, color, onClick) {
    c.add(button(this, 0, 150, 300, 84, label, color, onClick || (() => {}), { size: 36 }));
  }

  showPoderes() {
    TIENDA.poderes.forEach((it, i) => {
      const p = POWERS[it.id];
      const rar = RARITY[p.rarity];
      const c = this.card(i, p.name, p.desc, rar.color);
      c.itemId = it.id;
      const pill = this.add.graphics();
      pill.fillStyle(rar.color, 1); pill.fillRoundedRect(-70, -CH / 2 + 18, 140, 38, 19);
      c.add(pill);
      c.add(txt(this, 0, -CH / 2 + 37, rar.name, 22, '#ffffff'));
      c.add(icon(this, 0, -70, 'pw_' + it.id, 130));
      this.priceBtn(c, it.precio, () => {
        if (save.proximos.length >= maxPoderes()) save.proximos.shift();
        save.proximos.push(it.id);
        persist();
        toast(this, `${p.name} listo para tu próxima partida`, 1850, 1800);
        this.time.delayedCall(250, () => this.show('poderes'));
      });
    });
    // Lo que ya tienes guardado
    const y = 1330;
    const g = this.add.graphics();
    g.fillStyle(0x0c0f30, 0.7); g.fillRoundedRect(90, y - 100, 900, 250, 40);
    this.layer.add(g);
    this.layer.add(txt(this, W / 2, y - 55, `Para tu próxima partida (máx. ${maxPoderes()})`, 32, '#ffffff', { weight: '700' }));
    for (let k = 0; k < maxPoderes(); k++) {
      const x = W / 2 - 110 * (maxPoderes() - 1) + k * 220;
      const sg = this.add.graphics();
      sg.lineStyle(5, 0x7a7eba, 1); sg.strokeRoundedRect(x - 70, y - 10, 140, 140, 26);
      this.layer.add(sg);
      const id = save.proximos[k];
      if (id) this.layer.add(icon(this, x, y + 60, 'pw_' + id, 110));
      else this.layer.add(txt(this, x, y + 60, '+', 56, '#7a7eba'));
    }
    this.layer.add(txt(this, W / 2, 1560, 'Los poderes duran una partida y se usan como los que ganas jugando', 26, '#c8c0e8', { weight: '600', wrap: 860 }));
    this.layer.add(button(this, W / 2, 1720, 560, 120, 'Jugar', 0x5ac85a, () => this.scene.start('Game', { reto: false, modo: null }), { size: 56 }));
  }

  showTemas() {
    TIENDA.temas.forEach((it, i) => {
      const c = this.card(i, it.name, it.desc, 0xa046dc);
      c.itemId = it.id;
      [0, 1, 2, 3].forEach((k) => {
        const im = this.add.image(-105 + k * 70, -80 + (k % 2) * 34, `${it.id}_${COLORS[(k * 2 + i) % COLORS.length]}`);
        im.setDisplaySize(96, 96);
        c.add(im);
      });
      const tiene = save.tienda.temas.includes(it.id);
      if (!tiene) {
        this.priceBtn(c, it.precio, () => {
          save.tienda.temas.push(it.id);
          save.theme = it.id;
          persist();
          toast(this, `¡Tema ${it.name} puesto! Cámbialo en el menú cuando quieras`, 1850, 2400);
          this.time.delayedCall(250, () => this.show('temas'));
        });
      } else if (save.theme === it.id) {
        this.stateBtn(c, 'En uso', 0x2a8a4a);
      } else {
        this.stateBtn(c, 'Usar', 0x2c6ab0, () => { save.theme = it.id; persist(); sfx.power(); this.show('temas'); });
      }
    });
    this.layer.add(txt(this, W / 2, 880, 'Los temas son tuyos para siempre', 30, '#c8c0e8', { weight: '700' }));
    this.layer.add(txt(this, W / 2, 935, 'Cámbialos en el menú con el botón "Bloques"', 26, '#c8c0e8', { weight: '600' }));
  }

  // Tienda Shadow (opcional): temas exclusivos y ladrillos. Nada de aquí da ventaja en el ranking ni en los retos.
  showShadow() {
    const lista = (nube.on && nube.tienda.length ? nube.tienda : TIENDA_SHADOW).slice(0, 6);
    const top = this.add.container(W / 2, 352);
    if (nube.on) {
      const t = txt(this, -30, 0, `Tienes ${nube.shadow}`, 34, '#ffffff', { weight: '800' });   // el saldo y a su lado la moneda
      top.add([t, icon(this, -30 + t.width / 2 + 34, 0, 'ui_shadow', 40)]);
    } else top.add(txt(this, 0, 0, 'Opcional: todo el juego se puede jugar gratis', 28, '#c8c0e8', { weight: '700' }));
    this.layer.add(top);
    lista.forEach((it, i) => {
      const c = this.card(i, it.nombre, it.desc, it.id === 'fundador' ? 0xe0a33a : 0x7a4ad8);
      c.itemId = it.id;
      if (it.tema) {
        [0, 1, 2, 3].forEach((k) => {
          const im = this.add.image(-105 + k * 70, -80 + (k % 2) * 34, `${it.tema}_${COLORS[(k * 2 + i) % COLORS.length]}`);
          im.setDisplaySize(96, 96);
          c.add(im);
        });
        if (it.id === 'fundador') c.add(txt(this, 150, -150, '👑', 54));
      } else {
        c.add(icon(this, -95, -75, 'ui_ladrillo', 110));
        c.add(txt(this, 50, -75, `×${it.ladrillos.toLocaleString('es-MX')}`, 48, '#c8502a'));
      }
      const tiene = it.unaVez && (nube.compras[it.id] || 0) > 0;
      if (tiene) {
        if (it.tema && save.theme !== it.tema) this.stateBtn(c, 'Usar', 0x2c6ab0, () => { save.theme = it.tema; persist(); sfx.power(); this.show('shadow'); });
        else this.stateBtn(c, it.tema ? 'En uso' : 'Lo tienes', 0x2a8a4a);
        return;
      }
      if (!nube.on) {
        c.add(button(this, 0, 150, 300, 84, `${it.shadow}`, 0x6a5a8a, () => abrirTienda(), { size: 36, iconKey: 'ui_shadow' }));   // la ventana pide entrar a la cuenta
        return;
      }
      let armado = false;
      const b = button(this, 0, 150, 300, 84, `${it.shadow}`, 0x7a4ad8, () => {
        if (nube.shadow < it.shadow) {   // no alcanza: se compra justo lo que falta y al llegar la Shadow se termina la compra
          guardarPendiente(it.id, it.shadow);
          abrirTienda({ falta: it.shadow - nube.shadow });
          return;
        }
        if (!armado) { armado = true; b.label.setText('¿Comprar?'); b.list[2] && b.list[2].setVisible(false); return; }   // 2.º toque confirma
        b.setEnabled(false); b.label.setText('…');
        this.comprarShadow(it, c);
      }, { size: 40, iconKey: 'ui_shadow' });
      c.add(b);
    });
    // Comprar Shadow y Apoyar al creador: la ventana del estudio, sin salir del juego (solo aquí en la Tienda)
    this.layer.add(button(this, 735, 1755, 470, 100, 'Comprar Shadow', 0x4a2a8a, () => abrirTienda(), { size: 36, iconKey: 'ui_shadow' }));
    this.layer.add(button(this, 270, 1755, 420, 100, '💜 Apoyar al creador', 0x8a3a8a, () => { track('apoyo_ver', {}); abrirTienda({ modo: 'apoyar' }); }, { size: 32 }));
  }

  showDeco() {
    TIENDA.deco.forEach((it, i) => {
      const c = this.card(i, it.name, it.desc, 0x2a8a4a);
      c.itemId = it.id;
      const key = { arboles: 'deco_arbol', farolas: 'deco_farola', flores: 'deco_flores', banderines: 'deco_banderines', fuente: 'deco_fuente' }[it.id];
      const im = this.add.image(0, -80, key);
      const s = Math.min(200 / im.width, 170 / im.height);
      im.setScale(s);
      c.add(im);
      const tiene = save.tienda.deco.includes(it.id);
      if (!tiene) {
        this.priceBtn(c, it.precio, () => {
          save.tienda.deco.push(it.id);
          persist();
          toast(this, `¡${it.name} en tu pueblo!`, 1850, 1600);
          this.time.delayedCall(250, () => this.show('deco'));
        });
      } else {
        this.stateBtn(c, 'En tu pueblo', 0x2a8a4a, () => this.scene.start('Village', { zona: 1 }));
      }
    });
    // 6.º lugar: ir al pueblo
    const c = this.add.container(COLS[1], ROWS[2]);
    c.add(button(this, 0, 0, 380, 130, 'Ver mi pueblo', 0xff8c2b, () => this.scene.start('Village', { zona: 1 }), { size: 42 }));
    this.layer.add(c);
  }
}
