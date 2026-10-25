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
  { id: 'pozo', name: 'Pozo', cost: 120, unlock: 'Tema de bloques "Agua"' },
  { id: 'herreria', name: 'Herrería', cost: 200, unlock: 'Poder Doble ladrillo' },
  { id: 'torre', name: 'Torre', cost: 300, unlock: 'Poder Segunda oportunidad' },
  { id: 'plaza', name: 'Plaza', cost: 450, unlock: 'Zona 2 (próximamente)' },
];

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
// Decoraciones en el pueblo: [x, y del suelo, tamaño]
export const DECO_POS = {
  arboles: [[70, 880, 210], [1020, 1030, 200], [55, 1330, 190], [1030, 1430, 200]],
  farolas: [[440, 905, 110], [655, 1170, 110], [420, 1505, 110], [665, 1690, 110]],
  flores: [[700, 845, 180], [405, 1095, 180], [690, 1455, 180], [385, 1725, 180]],
  banderines: [[540, 520, 560]],
  fuente: [[548, 1335, 210]],
};
