import Phaser from 'phaser';
import { IMAGES } from '../assets.js';
import { makeTextures } from '../textures.js';
import { W, H } from '../config.js';
import { txt } from '../ui.js';
import { save } from '../save.js';
import { trackAbrir } from '../stats.js';

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const t = txt(this, W / 2, H / 2, 'Cargando...', 44);
    this.load.on('progress', (p) => t.setText(`Cargando... ${Math.round(p * 100)}%`));
    // Si una imagen falla, se usa la versión dibujada con código
    this.load.on('loaderror', (file) => console.warn('No se pudo cargar', file.key));
    IMAGES.forEach(({ key, url }) => this.load.image(key, url));
  }

  create() {
    makeTextures(this);
    trackAbrir();
    // Quien entra por primera vez juega de inmediato; el menú aparece después
    const nuevo = save.games === 0 && save.built.length === 0 && !location.search.includes('capture');
    this.scene.start(nuevo ? 'Game' : 'Menu');
  }
}
