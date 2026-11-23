// Reto semanal (antes «Pozo de la semana»): llamadas al servidor del estudio (repo de Mutantes: server/src/routes/pozos.ts).
// Necesita la cuenta DarkShadow. El servidor da la semilla de cada intento y al final vuelve a jugar la partida (src/pozo-core.js).
// Desde el 22 nov 2026 el premio es SOLO del juego (ladrillos y medallas de podio): nada de Shadow ni dinero, para poder
// anunciar el juego en Meta. El reparto de Shadow del servidor quedó apagado (app_kv pozo_bloquevilla).
import { api } from './cuenta.js';
import { save, persist } from './save.js';
import { nube } from './nube.js';

export const verPozo = () => api('/pozo/bloquevilla');
export const empezarPozo = () => api('/pozo/bloquevilla/start', { method: 'POST', body: '{}' });
export const terminarPozo = (attemptId, moves, name) => api('/pozo/bloquevilla/finish', { method: 'POST', body: JSON.stringify({ attemptId, moves, name }) });

/** Premio del Reto semanal por lugar (top 10), en ladrillos. */
export const PREMIO_SEMANAL = [300, 200, 150, 75, 75, 75, 75, 75, 75, 75];
export const premioDeLugar = (lugar) => PREMIO_SEMANAL[lugar - 1] || 0;

/** ¿Quedaste en el top 10 la semana pasada y no has cobrado? Devuelve {lugar, premio, semana} o null. */
let revisado = false;   // una vez por sesión, cuando ya hay sesión en la nube
export async function premioSemanal() {
  if (revisado || !nube.on || location.search.includes('capture')) return null;
  const d = await verPozo();
  revisado = true;
  const p = d && d.prev;
  if (!p || save.retoSemanal.cobrado === p.week) return null;
  if (!p.rank || p.rank > PREMIO_SEMANAL.length) { save.retoSemanal.cobrado = p.week; persist(); return null; }
  return { lugar: p.rank, premio: premioDeLugar(p.rank), semana: p.week };
}

export function cobrarSemanal(p) {
  const R = save.retoSemanal;
  if (R.cobrado === p.semana) return;
  save.bricks += p.premio;
  R.cobrado = p.semana;
  if (p.lugar === 1) R.oro++; else if (p.lugar === 2) R.plata++; else if (p.lugar === 3) R.bronce++;
  R.top10++;
  persist();
}
