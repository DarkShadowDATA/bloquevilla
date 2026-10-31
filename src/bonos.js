// Bonos permanentes de los edificios de la Zona 2 (el Muelle)
import { ORO, PELIGRO } from './config.js';
import { isBuilt } from './save.js';

export const extraLadrillos = () => (isBuilt('muelle') ? 0.1 : 0);
export const multRegalo = () => (isBuilt('barca') ? 2 : 1);
export const oroChance = () => (isBuilt('pescaderia') ? 0.26 : ORO.chance);
export const turnosBomba = () => PELIGRO.bomba.turnos + (isBuilt('faro') ? 2 : 0);
export const maxPoderes = () => (isBuilt('astillero') ? 3 : 2);
export const precioTienda = (p) => (isBuilt('mercado') ? Math.round(p * 0.8) : p);
