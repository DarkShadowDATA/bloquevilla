// Colección: álbum con todos los temas de bloques y decoraciones del pueblo.
// El % solo cuenta lo que se consigue jugando (gratis): temas y decoraciones de la tienda con ladrillos, más los
// premios exclusivos de logros y Aventura. Lo de temporada (vuelve cada año) y lo de Shadow se ven aparte y no cuentan.
import { save, persist, isBuilt } from './save.js';
import { TIENDA, TIENDA_SHADOW, NOMBRE_TEMA } from './config.js';
import { estrellasTotales } from './aventura.js';
import { totalMedallas } from './logros.js';

const tienda = (tipo, id) => (tipo === 'tema' ? save.tienda.temas : save.tienda.deco).includes(id);

// tipo: tema | deco · seccion: temas, pueblo, trofeos (exclusivos), temporada, shadow
// tiene() = ya es tuyo · como = cómo se consigue · cuenta = entra en el %
export const PIEZAS = [
  { id: 'clasico', tipo: 'tema', seccion: 'temas', nombre: 'Clásico', como: 'Desde el inicio', tiene: () => true },
  { id: 'agua', tipo: 'tema', seccion: 'temas', nombre: 'Agua', como: 'Construye el Pozo', tiene: () => isBuilt('pozo') },
  ...TIENDA.temas.map((t) => ({ id: t.id, tipo: 'tema', seccion: 'temas', nombre: t.name, como: `Tienda: ${t.precio} ladrillos`, tienda: 'temas', tiene: () => tienda('tema', t.id) })),
  { id: 'dragon', tipo: 'tema', seccion: 'temas', nombre: 'Dragón', como: 'Vence al Dragón (Aventura, nivel 60)', exclusivo: true, tiene: () => ((save.aventura.estrellas || [])[59] || 0) > 0 },
  ...TIENDA.deco.map((d) => ({ id: d.id, tipo: 'deco', seccion: 'pueblo', nombre: d.name, como: `Tienda: ${d.precio} ladrillos`, tienda: 'deco', tiene: () => tienda('deco', d.id) })),
  { id: 'globo', tipo: 'deco', seccion: 'pueblo', nombre: 'Globo aerostático', como: 'Junta 150 estrellas en la Aventura', exclusivo: true, tiene: () => estrellasTotales() >= 150 },
  { id: 'estatua', tipo: 'deco', seccion: 'pueblo', nombre: 'Estatua dorada', como: 'Gana 15 medallas de logros', exclusivo: true, tiene: () => totalMedallas() >= 15 },
  { id: 'copa', tipo: 'deco', seccion: 'pueblo', nombre: 'Copa de campeón', como: 'Gana las 30 medallas de logros', exclusivo: true, tiene: () => totalMedallas() >= 30 },
  // no cuentan en el %
  { id: 'muertos', tipo: 'tema', seccion: 'temporada', nombre: 'Día de Muertos', como: 'Evento de Día de Muertos', tiene: () => !!(save.muertos && save.muertos.tema) },
  ...TIENDA_SHADOW.filter((t) => t.tema).map((t) => ({ id: t.tema, tipo: 'tema', seccion: 'shadow', nombre: NOMBRE_TEMA[t.tema], como: t.id === 'fundador' ? 'Paquete Fundador' : `Tienda Shadow: ${t.shadow} Shadow`, tienda: 'shadow', tiene: () => tienda('tema', t.tema) })),
].map((p) => ({ ...p, cuenta: p.seccion !== 'temporada' && p.seccion !== 'shadow' }));

export const SECCIONES = [
  ['temas', 'Temas de bloques'],
  ['pueblo', 'Decoraciones del pueblo'],
  ['temporada', 'De temporada · no cuentan en el %'],
  ['shadow', 'Extras con Shadow · no cuentan en el %'],
];

export const PREMIO_COLECCION = 300;   // ladrillos al llegar al 100 %
const contadas = () => PIEZAS.filter((p) => p.cuenta);
export const tenidas = () => contadas().filter((p) => p.tiene()).length;
export const totalPiezas = () => contadas().length;
export const porcentajeColeccion = () => Math.round((tenidas() / totalPiezas()) * 100);
export const premioListo = () => tenidas() === totalPiezas() && !save.coleccion.premio;

export function cobrarPremio() {
  if (!premioListo()) return 0;
  save.coleccion.premio = true;
  save.bricks += PREMIO_COLECCION;
  persist();
  return PREMIO_COLECCION;
}

// Exclusivos ganados que todavía no se han visto en el álbum (para avisar en el menú)
export const nuevos = () => PIEZAS.filter((p) => p.exclusivo && p.tiene() && !save.coleccion.vistos.includes(p.id));
export function marcarVistos() {
  const n = nuevos();
  if (!n.length) return;
  n.forEach((p) => save.coleccion.vistos.push(p.id));
  persist();
}

// Decoraciones exclusivas que van en la colina del Castillo (zona 3): [x, y del suelo, tamaño]
export const TROFEOS_POS = { globo: [175, 560, 220], estatua: [205, 790, 230], copa: [880, 790, 200] };
export const temaDragon = () => PIEZAS.find((p) => p.id === 'dragon').tiene();
