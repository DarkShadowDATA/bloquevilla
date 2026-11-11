// Bonos permanentes de los edificios de la Zona 2 (el Muelle) y la Zona 3 (el Castillo).
// Ninguno cambia puntos ni piezas: solo ladrillos, regalos y poderes de la partida normal.
import { ORO, PELIGRO } from './config.js';
import { save, persist, isBuilt, today } from './save.js';

export const extraLadrillos = () => (isBuilt('muelle') ? 0.1 : 0) + (isBuilt('castillo') ? 0.1 : 0);
export const multRegalo = () => (isBuilt('barca') ? 2 : 1);
export const oroChance = () => (isBuilt('pescaderia') ? 0.26 : ORO.chance);
export const turnosBomba = () => PELIGRO.bomba.turnos + (isBuilt('faro') ? 2 : 0);
export const maxPoderes = () => (isBuilt('astillero') ? 3 : 2);
export const precioTienda = (p) => (isBuilt('mercado') ? Math.round(p * 0.8) : p);
// Zona 3
export const extraMision = () => (isBuilt('granja') ? 5 : 0);
export const multCofre = () => (isBuilt('molino') ? 2 : 1);
export const martilloGratis = () => isBuilt('biblioteca');
export const oroLadrillos = () => (isBuilt('mina') ? 5 : ORO.ladrillos);
export const COFRE_SEMANAL = 150;
// Lunes de la semana de una fecha AAAA-MM-DD
export function lunesDe(dia) {
  const d = new Date(dia + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Tesorería: una vez por semana suma el cofre; devuelve cuánto dio (0 si no toca)
export function cobrarCofreSemanal() {
  if (!isBuilt('tesoreria')) return 0;
  const s = lunesDe(today());
  if (save.cofreSemana === s) return 0;
  save.cofreSemana = s;
  save.bricks += COFRE_SEMANAL;
  persist();
  return COFRE_SEMANAL;
}
