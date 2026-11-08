// Pozo de la semana: llamadas al servidor del estudio (repo de Mutantes: server/src/routes/pozos.ts).
// Necesita la cuenta DarkShadow. El servidor da la semilla de cada intento y al final vuelve a jugar la partida (src/pozo-core.js).
import { api } from './cuenta.js';

export const verPozo = () => api('/pozo/bloquevilla');
export const empezarPozo = () => api('/pozo/bloquevilla/start', { method: 'POST', body: '{}' });
export const terminarPozo = (attemptId, moves, name) => api('/pozo/bloquevilla/finish', { method: 'POST', body: JSON.stringify({ attemptId, moves, name }) });
/** Cuánto vale en dólares una cantidad de Shadow (1 Shadow = 0.10 USD). */
export const usd = (shadow) => (shadow / 10).toFixed(2);
