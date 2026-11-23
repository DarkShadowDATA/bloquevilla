import Phaser from 'phaser';
import { IMAGES, esDePartida } from '../assets.js';
import { esAnuncio } from '../stats.js';
import { marcarCargaLista } from '../carga.js';
import { makeTextures } from '../textures.js';
import { W, H } from '../config.js';
import { txt } from '../ui.js';
import { save } from '../save.js';
import { eventoActivo } from '../evento.js';
import { trackAbrir } from '../stats.js';
import { dsTrack } from '../dsev.js';
import { leerReto, limpiarLink } from '../share.js';

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  // ¿A dónde va al abrir? Quien entra por primera vez, quien tiene una partida a medias, quien abre un reto de un amigo
  // y quien llega de un anuncio juegan de inmediato; los demás ven el menú.
  destino() {
    if (this._destino) return this._destino;
    const cap = location.search.includes('capture');
    const vs = cap ? null : leerReto();
    const nuevo = save.games === 0 && save.built.length === 0 && !cap;
    const enCurso = !!save.partida && !cap;
    this._destino = vs ? { k: 'Game', d: { reto: false, vs }, vs: true } : { k: nuevo || enCurso || esAnuncio() ? 'Game' : 'Menu', d: { reto: false, modo: null } };
    return this._destino;
  }

  preload() {
    const t = txt(this, W / 2, H / 2, 'Cargando...', 44);
    this.load.on('progress', (p) => t.setText(`Cargando... ${Math.round(p * 100)}%`));
    // Si una imagen falla, se usa la versión dibujada con código
    this.load.on('loaderror', (file) => console.warn('No se pudo cargar', file.key));
    // Si va directo a jugar, solo se baja lo de la partida y el resto en segundo plano (escena Fondo);
    // si va al menú (o en modo captura para videos), se baja todo como antes.
    this.todo = location.search.includes('capture') || this.destino().k !== 'Game';
    IMAGES.filter(({ key }) => this.todo || esDePartida(key, save.theme, eventoActivo())).forEach(({ key, url }) => this.load.image(key, url));
  }

  create() {
    makeTextures(this);
    trackAbrir();
    dsTrack('game_opened', 'bloquevilla');   // analítica anónima del estudio (además de la de Bloquevilla)
    const D = this.destino();
    if (D.vs) limpiarLink();
    if (this.todo) marcarCargaLista(); else this.scene.launch('Fondo');
    this.scene.start(D.k, D.d);
  }
}
