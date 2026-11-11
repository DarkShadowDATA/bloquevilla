import Phaser from 'phaser';
import { W, H, TIENDA, COLORS, TIENDA_SHADOW, NOMBRE_TEMA, APOYO_SHADOW } from '../config.js';
import { nube, comprar, loginUrl, shadowUrl } from '../nube.js';
import { maxPoderes, precioTienda } from '../bonos.js';
import { save, persist } from '../save.js';
import { POWERS, RARITY } from '../powers.js';
import { sfx, vibe } from '../sfx.js';
import { txt, background, icon, button, toast, chip, confetti } from '../ui.js';
import { track } from '../stats.js';

const TABS = [['poderes', 'Poderes'], ['temas', 'Temas'], ['deco', 'Pueblo'], ['shadow', 'Shadow']];
const COLS = [290, 790];
const ROWS = [600, 1030, 1460];
const CW = 460, CH = 400;

export default class Shop extends Phaser.Scene {
  constructor() { super('Shop'); }

  create(data) {
    background(this, 'bg_menu', 'grad_menu');
    this.add.rectangle(W / 2, H / 2, W, H, 0x120c30, 0.72);
    button(this, 120, 110, 170, 84, 'Menú', 0x2c3070, () => this.scene.start('Menu'), { size: 32 });
    txt(this, W / 2, 110, 'Tienda', 70, '#ffd93d', { stroke: '#3a1250', strokeW: 10 });
    this.brickChip = chip(this, 905, 110, 230, 'ui_ladrillo', save.bricks);
    if (!save.tienda.visto) { save.tienda.visto = true; persist(); }
    this.tab = (data && data.tab) || 'poderes';
    this.tabBtns = TABS.map(([id, name], i) => {
      const b = button(this, 145 + i * 263, 265, 245, 96, name, id === 'shadow' ? 0x4a2a8a : 0x3a2e7a, () => this.show(id), { size: 36 });
      b.tabId = id;
      return b;
    });
    this.layer = this.add.container(0, 0);
    this.show(this.tab);
  }

  show(id) {
    this.tab = id;
    this.tabBtns.forEach((b) => {
      const on = b.tabId === id;
      b.setScale(on ? 1.06 : 1);
      b.label.setColor(on ? '#ffd93d' : '#ffffff');
      b.list[0].setAlpha(on ? 1 : 0.6);
    });
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
      top.add(icon(this, -150, 0, 'ui_shadow', 50));
      top.add(txt(this, 30, 0, `Tienes ${nube.shadow} Shadow`, 34, '#ffffff', { weight: '800' }));
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
        this.stateBtn(c, `${it.shadow} Shadow`, 0x6a5a8a, () => this.pedirSesion());
        return;
      }
      let armado = false;
      const b = button(this, 0, 150, 300, 84, `${it.shadow}`, 0x7a4ad8, () => {
        if (nube.shadow < it.shadow) { toast(this, `Te faltan ${it.shadow - nube.shadow} Shadow`, 1850, 1800); return; }
        if (!armado) { armado = true; b.label.setText('¿Comprar?'); b.list[2] && b.list[2].setVisible(false); return; }   // 2.º toque confirma
        b.setEnabled(false); b.label.setText('…');
        comprar(it.id).then((r) => {
          sfx.build(); vibe(40); confetti(this, c.x, c.y - 60, 60);
          if (it.tema) { save.theme = it.tema; persist(); }
          this.brickChip.setValue(save.bricks);
          toast(this, it.tema ? `¡Tema ${NOMBRE_TEMA[it.tema]} puesto!${r.sumados ? ` +${r.sumados} ladrillos` : ''}` : `+${r.sumados} ladrillos`, 1850, 2400);
          this.time.delayedCall(300, () => this.show('shadow'));
        }).catch((e) => { toast(this, e.message, 1850, 2400); this.show('shadow'); });
      }, { size: 40, iconKey: 'ui_shadow' });
      c.add(b);
    });
    const pie = nube.on
      ? button(this, 700, 1755, 560, 100, 'Conseguir Shadow', 0x4a2a8a, () => { location.href = shadowUrl(); }, { size: 36, iconKey: 'ui_shadow' })
      : button(this, 700, 1755, 560, 100, nube.can ? 'Iniciar sesión' : 'Ir a la página del juego', 0x6a3ab8, () => this.pedirSesion(), { size: 36 });
    this.layer.add(pie);
    // Apoyar al creador: opcional, sin ventaja; solo da la insignia ☕
    this.layer.add(button(this, 215, 1755, 350, 100, '☕ Apoyar', 0x8a5a2a, () => this.abrirApoyo(), { size: 36 }));
  }

  abrirApoyo() {
    track('apoyo_ver', {});
    const ov = this.add.container(0, 0).setDepth(400);
    ov.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setInteractive());
    const p = this.add.container(W / 2, 900);
    ov.add(p);
    const g = this.add.graphics();
    g.fillStyle(0xaa5a1e, 1); g.fillRoundedRect(-430, -330, 860, 690, 50);
    g.fillStyle(0xfff7e8, 1); g.fillRoundedRect(-430, -340, 860, 680, 50);
    p.add(g);
    p.add(txt(this, 0, -255, '☕ Invítame un café', 58, '#46286e'));
    p.add(txt(this, 0, -120, 'Bloquevilla lo hago yo solo. Si te gusta el juego, puedes apoyarme para que siga creciendo.', 32, '#6a5a8a', { weight: '700', wrap: 740 }));
    p.add(txt(this, 0, 10, 'No da ninguna ventaja: solo la insignia ☕ en tu menú.', 28, '#8c7aa0', { weight: '600', wrap: 740 }));
    if (save.apoyo > 0) p.add(txt(this, 0, 62, `¡Gracias! Ya me invitaste ${save.apoyo} ${save.apoyo === 1 ? 'café' : 'cafés'}`, 28, '#2a9a4a', { weight: '800' }));
    const cerrar = () => ov.destroy();
    const b = button(this, 0, 150, 520, 100, `${APOYO_SHADOW}`, 0x7a4ad8, () => {
      if (!nube.on) { this.pedirSesion(); return; }
      if (nube.shadow < APOYO_SHADOW) { toast(this, `Te faltan ${APOYO_SHADOW - nube.shadow} Shadow`, 1850, 1800); return; }
      b.setEnabled(false); b.label.setText('…');
      comprar('apoyo').then(() => {
        sfx.build(); vibe(40); confetti(this, W / 2, 800, 80);
        cerrar();
        toast(this, '¡Muchas gracias por tu apoyo! ☕', 1850, 2600);
        this.show('shadow');
      }).catch((e) => { cerrar(); toast(this, e.message, 1850, 2400); });
    }, { size: 44, iconKey: 'ui_shadow' });
    p.add(b);
    p.add(button(this, 0, 265, 360, 80, 'Ahora no', 0x8a7ab0, cerrar, { size: 32 }));
    p.setScale(0.4);
    this.tweens.add({ targets: p, scale: 1, duration: 260, ease: 'Back.Out' });
  }

  pedirSesion() {
    if (nube.can) { location.href = loginUrl(); return; }
    // Dentro de itch (o sin conexión con la cuenta): la tienda se usa en la página del juego
    try { window.open('https://bloquevilla.darkshadow-studios.com/?src=itch', '_blank'); } catch (e) { /* nada */ }
    toast(this, 'La Tienda Shadow se usa en bloquevilla.darkshadow-studios.com', 1850, 2600);
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
