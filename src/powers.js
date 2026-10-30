import { isBuilt } from './save.js';

// target: 'cell' = tocas una casilla, 'piece' = tocas una pieza, 'none' = se aplica al instante
export const POWERS = {
  martillo: { name: 'Martillo', rarity: 'comun', desc: 'Rompe 1 bloque', target: 'cell', hint: 'Toca un bloque para romperlo' },
  girar: { name: 'Girar', rarity: 'comun', desc: 'Rota una pieza', target: 'piece', hint: 'Toca una pieza para girarla' },
  cambio: { name: 'Cambio', rarity: 'comun', desc: 'Te da 3 piezas nuevas', target: 'none' },
  bomba: { name: 'Bomba', rarity: 'raro', desc: 'Limpia un área de 3x3', target: 'cell', hint: 'Toca dónde explotar la bomba' },
  comodin: { name: 'Comodín', rarity: 'raro', desc: '3 piezas de un solo bloque', target: 'none' },
  rayo: { name: 'Rayo', rarity: 'epico', desc: 'Limpia una fila y una columna', target: 'cell', hint: 'Toca una casilla: cae el rayo' },
  deshacer: { name: 'Deshacer', rarity: 'raro', desc: 'Regresa tu última jugada', target: 'none', needs: 'casa' },
  doble: { name: 'Doble ladrillo', rarity: 'epico', desc: 'x2 ladrillos el resto de la partida', target: 'none', needs: 'herreria' },
  segunda: { name: 'Segunda oportunidad', rarity: 'epico', desc: 'Limpia las 3 filas más llenas', target: 'none', needs: 'torre' },
};

export const RARITY = {
  comun: { name: 'COMÚN', color: 0x6e8caa, p: 0.7 },
  raro: { name: 'RARO', color: 0x2882e6, p: 0.25 },
  epico: { name: 'ÉPICO', color: 0xa046dc, p: 0.05 },
};

export function unlockedPowers() {
  return Object.keys(POWERS).filter((id) => !POWERS[id].needs || isBuilt(POWERS[id].needs));
}

function rollRarity(rnd) {
  const x = rnd();
  if (x < RARITY.epico.p) return 'epico';
  if (x < RARITY.epico.p + RARITY.raro.p) return 'raro';
  return 'comun';
}

// 3 cartas distintas, cada una con su tirada de rareza
export function rollOffer(rnd = Math.random) {
  const pool = unlockedPowers();
  const out = [];
  while (out.length < 3 && out.length < pool.length) {
    const rar = rollRarity(rnd);
    let opts = pool.filter((id) => POWERS[id].rarity === rar && !out.includes(id));
    if (!opts.length) opts = pool.filter((id) => !out.includes(id));
    out.push(opts[Math.floor(rnd() * opts.length)]);
  }
  return out;
}
