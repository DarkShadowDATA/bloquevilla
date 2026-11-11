// Medidas y reglas del juego. Todo lo que se ajusta al probar vive aquí.
export const W = 1080;
export const H = 1920;
export const FONT = 'Poppins, Arial, sans-serif';

// Tablero
export const N = 8;
export const CELL = 110;
export const BX = 100;
export const BY = 420;

// Bandeja de piezas
export const TRAY_Y = 1470;
export const SLOTS = [230, 540, 850];
export const TRAY_CELL = 56;

// Colores de bloques
export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
export const HEX = {
  red: 0xff5a5f, orange: 0xffa62b, yellow: 0xffd93d, green: 0x6bcb77,
  blue: 0x4d96ff, purple: 0x9b5de5, pink: 0xf15bb5,
};
export const WATER = [0x3ad6d0, 0x58e0a2, 0xb39cff];

// Puntos y ladrillos (ver GDD, sección "Mecánica del tablero")
export const SCORE = { perCell: 1, lines: [0, 80, 200, 360], extraLine: 160, empty: 300 };
export const BRICKS = { lines: [0, 1, 2, 3], empty: 5, endPer: 400 };
export const COMBO_GRACE = 3; // jugadas seguidas sin limpiar antes de perder el combo

// Poderes
export const LINES_PER_OFFER = 3;
export const MAX_POWERS = 2;

// Pueblo, zona 1 (se construye en orden)
export const BUILDINGS = [
  // Total 1,150 ladrillos: unas 40 partidas + regalos diarios, cerca de una semana jugando a diario.
  // La Casa sale en la primera o segunda partida para que se entienda el ciclo.
  { id: 'casa', name: 'Casa', cost: 20, unlock: 'Poder Deshacer' },
  { id: 'panaderia', name: 'Panadería', cost: 60, unlock: 'Recompensa diaria' },
  { id: 'pozo', art: 'el', name: 'Pozo', cost: 120, unlock: 'Tema de bloques "Agua"' },
  { id: 'herreria', name: 'Herrería', cost: 200, unlock: 'Poder Doble ladrillo' },
  { id: 'torre', name: 'Torre', cost: 300, unlock: 'Poder Segunda oportunidad' },
  { id: 'plaza', name: 'Plaza', cost: 450, unlock: 'Zona 2: el Muelle' },
  // Zona 2, el Muelle: 2,520 ladrillos; cada edificio da un bono permanente
  { id: 'muelle', art: 'el', zona: 2, name: 'Muelle', cost: 250, unlock: '+10% de ladrillos en cada partida' },
  { id: 'barca', zona: 2, name: 'Barca', cost: 320, unlock: 'Regalo diario doble' },
  { id: 'pescaderia', zona: 2, name: 'Pescadería', cost: 380, unlock: 'Más bloques dorados' },
  { id: 'faro', art: 'el', zona: 2, name: 'Faro', cost: 450, unlock: 'Las bombas tardan 2 turnos más' },
  { id: 'astillero', art: 'el', zona: 2, name: 'Astillero', cost: 520, unlock: 'Un 3er espacio de poder' },
  { id: 'mercado', art: 'el', zona: 2, name: 'Mercado', cost: 600, unlock: '20% de descuento en la Tienda' },
  // Zona 3, el Castillo: 4,700 ladrillos; más bonos permanentes y, con el Castillo, el final de la historia
  { id: 'granja', zona: 3, name: 'Granja', cost: 500, unlock: '+5 ladrillos en cada misión diaria' },
  { id: 'molino', art: 'el', zona: 3, name: 'Molino', cost: 600, unlock: 'El cofre de misiones da el doble de ladrillos' },
  { id: 'biblioteca', zona: 3, name: 'Biblioteca', cost: 700, unlock: 'Un Martillo gratis en cada partida normal' },
  { id: 'mina', zona: 3, name: 'Mina', cost: 800, unlock: 'Cada bloque dorado da 5 ladrillos' },
  { id: 'tesoreria', zona: 3, name: 'Tesorería', cost: 900, unlock: 'Cofre semanal de 150 ladrillos' },
  { id: 'castillo', art: 'el', zona: 3, name: 'Castillo', cost: 1200, unlock: '+10% de ladrillos y el final de la historia' },
];

export const ZONAS = [
  { n: 1, nombre: 'Pueblo', bg: 'bg_village' },
  { n: 2, nombre: 'Muelle', bg: 'bg_muelle' },
  { n: 3, nombre: 'Castillo', bg: 'bg_castillo' },
];
// Edificio que abre cada zona (la 1 siempre está abierta)
export const LLAVE_ZONA = { 2: 'plaza', 3: 'mercado' };
export const zonaDe = (b) => b.zona || 1;
export const conArt = (b) => `${b.art || 'la'} ${b.name}`;   // "la Casa", "el Faro"

// Recompensa diaria (7 días); el día 7 también da un poder épico
export const DAILY = [10, 15, 20, 25, 30, 40, 50];

// Bloque dorado: a veces una pieza trae una casilla de oro; al limpiarla da ladrillos extra
export const ORO = { chance: 0.18, ladrillos: 3, puntos: 50 };

// Modo Contrarreloj: 60 s, cada línea suma tiempo; trabarse cuesta tiempo
export const TIEMPO = { dur: 60000, porLinea: 1000, castigo: 3000, alerta: 10000 };

// Tienda: todo se compra con ladrillos
export const TIENDA = {
  poderes: [
    { id: 'martillo', precio: 15 },
    { id: 'cambio', precio: 15 },
    { id: 'bomba', precio: 30 },
    { id: 'rayo', precio: 50 },
  ],
  temas: [
    { id: 'neon', name: 'Neón', desc: 'Bloques que brillan en la oscuridad', precio: 150 },
    { id: 'caramelo', name: 'Caramelo', desc: 'Bloques de dulce con rayitas', precio: 150 },
  ],
  deco: [
    { id: 'arboles', name: 'Árboles', desc: 'Sombra para tu pueblo', precio: 30 },
    { id: 'farolas', name: 'Farolas', desc: 'Iluminan el camino', precio: 40 },
    { id: 'flores', name: 'Jardines', desc: 'Flores junto al camino', precio: 50 },
    { id: 'banderines', name: 'Banderines', desc: 'Fiesta en la entrada', precio: 60 },
    { id: 'fuente', name: 'Fuente', desc: 'El centro del pueblo', precio: 90 },
  ],
};
// Decoraciones en el pueblo: [x, y del suelo, tamaño del lado más largo]
export const DECO_POS = {
  arboles: [[70, 880, 230], [1020, 1030, 220], [55, 1330, 210], [1030, 1430, 220]],
  farolas: [[440, 905, 210], [655, 1170, 210], [420, 1505, 210], [665, 1690, 210]],
  flores: [[700, 845, 180], [405, 1095, 180], [690, 1455, 180], [385, 1725, 180]],
  banderines: [[540, 520, 560]],
  fuente: [[548, 1335, 210]],
};

export const VERSION = '1.9';
export const APOYO_SHADOW = 10;   // «Invítame un café» (Tienda Shadow); el precio que vale es el del servidor

// Temas con imágenes (src/assets/img/<tema>_<color>.webp). Los premium se compran con Shadow (nube.js); el Fundador va en su paquete.
export const TEMAS_IMG = ['neon', 'caramelo', 'cristal', 'galaxia', 'oropuro', 'fundador', 'dragon'];
// Copia para mostrar la Tienda Shadow sin sesión; los precios que valen son los del servidor (BQ_TIENDA en el repo de Mutantes)
export const TIENDA_SHADOW = [
  { id: 'fundador', nombre: 'Paquete Fundador', desc: 'Tema exclusivo + 500 ladrillos + 👑', shadow: 30, unaVez: true, tema: 'fundador', ladrillos: 500 },
  { id: 'tema_cristal', nombre: 'Tema Cristal', desc: 'Bloques de piedras preciosas', shadow: 20, unaVez: true, tema: 'cristal', ladrillos: 0 },
  { id: 'tema_galaxia', nombre: 'Tema Galaxia', desc: 'Una galaxia en cada bloque', shadow: 20, unaVez: true, tema: 'galaxia', ladrillos: 0 },
  { id: 'tema_oropuro', nombre: 'Tema Oro puro', desc: 'Bloques de oro con gemas', shadow: 20, unaVez: true, tema: 'oropuro', ladrillos: 0 },
  { id: 'lad500', nombre: '500 ladrillos', desc: 'Para reconstruir más rápido', shadow: 10, unaVez: false, tema: null, ladrillos: 500 },
  { id: 'lad1500', nombre: '1,500 ladrillos', desc: 'Para reconstruir más rápido', shadow: 25, unaVez: false, tema: null, ladrillos: 1500 },
];
export const NOMBRE_TEMA = { neon: 'Neón', caramelo: 'Caramelo', cristal: 'Cristal', galaxia: 'Galaxia', oropuro: 'Oro puro', fundador: 'Fundador', dragon: 'Dragón' };

// Bloques peligrosos (solo en partida normal, después de unas líneas)
// Bomba: cuenta regresiva por pieza colocada; si llega a 0 explota y se acaba la partida. Limpiar su línea la desactiva.
// Hielo: ocupa una casilla y necesita 2 líneas para romperse (la primera solo lo agrieta).
export const PELIGRO = {
  desdeLineas: 6,
  bomba: { chance: 0.35, turnos: 7, ladrillos: 5, puntos: 100 },
  hielo: { chance: 0.4, max: 4 },
};
