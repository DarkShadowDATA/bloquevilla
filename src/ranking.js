// Ranking semanal de Contrarreloj (Supabase, funciones seguras: el juego no puede leer ni borrar la tabla)
import { save, persist } from './save.js';

const URL = 'https://jgpqevmxlfhloaqlmloh.supabase.co/rest/v1/rpc/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncHFldm14bGZobG9hcWxtbG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzA2ODMsImV4cCI6MjEwNzkwNjY4M30.u6A5nuRnxaAmE_Fej66b3rpFvSgIiTlkzhK5wWAseMM';
// Premio en ladrillos para el top 3 de la semana anterior
export const PREMIO_RANKING = [60, 40, 25];

const apagado = () => location.search.includes('capture') || location.search.includes('nostats');

function id() {
  if (!save.jugador) {
    save.jugador = (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    persist();
  }
  return save.jugador;
}

async function rpc(fn, body) {
  const r = await fetch(URL + fn, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error((data && data.message) || 'sin conexión');
  return data;
}

export async function enviarPuntaje(puntos) {
  if (apagado() || !save.apodo || puntos <= 0) return null;
  const res = await rpc('bloquevilla_enviar_puntaje', { p_jugador: id(), p_apodo: save.apodo, p_puntos: Math.floor(puntos) });
  return res && res[0];
}

export async function verTop(semana = null) {
  if (window.__fakeTop) return window.__fakeTop;   // solo para grabar videos
  if (apagado()) return [];
  return rpc('bloquevilla_top', { p_jugador: id(), p_semana: semana });
}

// Lunes de la semana pasada (hora de México), en AAAA-MM-DD
export function semanaPasada() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  const dia = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dia - 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Si quedaste en el top 3 la semana pasada y no has cobrado, devuelve {lugar, premio}
export async function premioPendiente() {
  if (apagado()) return null;
  const s = semanaPasada();
  if (save.rankingCobrado === s) return null;
  const top = await verTop(s);
  const yo = (top || []).find((t) => t.soy_yo);
  if (!yo || yo.lugar > 3) { save.rankingCobrado = s; persist(); return null; }
  return { lugar: yo.lugar, premio: PREMIO_RANKING[yo.lugar - 1], semana: s };
}

export function cobrarPremio(p) {
  save.bricks += p.premio;
  save.rankingCobrado = p.semana;
  persist();
}
