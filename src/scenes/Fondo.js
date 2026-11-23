import Phaser from 'phaser';
import { empezarCarga } from '../carga.js';
import { save } from '../save.js';
import { eventoActivo } from '../evento.js';

// Escena invisible que se queda prendida para bajar en segundo plano las imágenes del resto del juego
// (si se cargaran desde Boot, al cerrarse Boot se cortaría la descarga).
export default class Fondo extends Phaser.Scene {
  constructor() { super({ key: 'Fondo', active: false, visible: false }); }
  create() { empezarCarga(this, save.theme, eventoActivo()); }
}
