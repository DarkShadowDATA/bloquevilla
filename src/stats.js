// Estadísticas anónimas: cada jugador es un número al azar, sin nombre ni correo.
// Solo se puede AGREGAR a la tabla bloquevilla_eventos (nadie de fuera puede leerla).
import { save, persist } from './save.js';
import { VERSION } from './config.js';

const URL = 'https://jgpqevmxlfhloaqlmloh.supabase.co/rest/v1/bloquevilla_eventos';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncHFldm14bGZobG9hcWxtbG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzA2ODMsImV4cCI6MjEwNzkwNjY4M30.u6A5nuRnxaAmE_Fej66b3rpFvSgIiTlkzhK5wWAseMM';

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function jugador() {
  if (!save.jugador) { save.jugador = uuid(); persist(); }
  return save.jugador;
}

// De dónde se está jugando: itch, el dominio del estudio u otro sitio
function origen() {
  const h = location.hostname;
  if (/itch\.(io|zone)$/.test(h)) return 'itch';
  if (h.endsWith('darkshadow-studios.com')) return 'dominio';
  if (/claude|anthropic/.test(h)) return 'claude';
  return h.slice(0, 40) || 'otro';
}

const apagado = () => {
  const q = location.search;
  const h = location.hostname;
  return q.includes('capture') || q.includes('nostats') || h === 'localhost' || h === '127.0.0.1' || h === '';
};

export function track(evento, datos = {}) {
  if (apagado()) return;
  try {
    fetch(URL, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ jugador: jugador(), evento, origen: origen(), version: VERSION, datos }),
    }).catch(() => {});
  } catch (e) { /* sin red: no pasa nada */ }
}

// Al abrir el juego: si es nuevo, si es celular y de dónde viene (?ref=tiktok en los links de los videos)
export function trackAbrir() {
  let ref = '';
  try {
    const m = location.search.match(/[?&]ref=([\w-]{1,20})/);
    ref = m ? m[1] : (document.referrer ? new URL(document.referrer).hostname : '');
  } catch (e) { /* ignorar */ }
  track('abrir', {
    nuevo: save.games === 0 && !save.jugador,
    movil: /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),
    ref: ref.slice(0, 40),
    partidas: save.games,
    edificios: save.built.length,
  });
}
