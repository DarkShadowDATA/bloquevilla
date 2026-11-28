// Misión de una sola vez «Únete a la comunidad»: un botón por red del estudio (Discord, Telegram, WhatsApp).
// Cada botón abre su link en pestaña nueva y da su premio la PRIMERA vez que se toca (es por confianza: no se puede
// comprobar que se unió). Los links salen de https://darkshadow-studios.com/comunidad.json
// ({"discord":"…","telegram":"","whatsapp":""}); solo se muestran las redes con link. Si el archivo no carga, el Discord fijo.
// Premio chico del juego (ladrillos); nunca Shadow ni nada que dé ventaja en ranking, reto o Pozo.
import { save, persist } from './save.js';
import { track } from './stats.js';

export const URL_COMUNIDAD = 'https://darkshadow-studios.com/comunidad.json';
export const DISCORD_FIJO = 'https://discord.gg/7pUXuTXvxk';
export const PREMIO_COMUNIDAD = 25;   // ladrillos por red (lo de una misión media)
export const REDES = {
  discord: { nombre: 'Discord', color: 0x5865f2 },
  telegram: { nombre: 'Telegram', color: 0x2aa3df },
  whatsapp: { nombre: 'WhatsApp', color: 0x25b863 },
};
const ORDEN = ['discord', 'telegram', 'whatsapp'];

let links = { discord: DISCORD_FIJO };   // mientras carga (o si falla): el Discord de siempre
let pedido = null;
const valido = (u) => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u.trim());

/** Pide los links una vez por sesión (máx. 4 s). Nunca falla: si no hay archivo, queda el Discord fijo. */
export function cargarComunidad() {
  if (pedido) return pedido;
  pedido = (async () => {
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tm = setTimeout(() => ctl && ctl.abort(), 4000);
      const r = await fetch(URL_COMUNIDAD, { cache: 'no-cache', signal: ctl ? ctl.signal : undefined });
      clearTimeout(tm);
      if (!r.ok) throw new Error('sin archivo');
      const j = await r.json();
      const n = {};
      for (const k of ORDEN) if (valido(j && j[k])) n[k] = j[k].trim();
      if (!n.discord) n.discord = DISCORD_FIJO;
      links = n;
    } catch (e) { /* se queda el Discord fijo */ }
    return links;
  })();
  return pedido;
}

/** Redes que se muestran (con link), en orden. */
export const redesVisibles = () => ORDEN.filter((k) => links[k]).map((k) => ({ id: k, url: links[k], ...REDES[k], hecha: !!(save.comunidad && save.comunidad[k]) }));
/** ¿Hay alguna red sin tocar que todavía no haya visto en Misiones? (aviso «NUEVO» discreto en el menú) */
export const comunidadPendiente = () => redesVisibles().some((r) => !r.hecha && !(save.comunidadVista || []).includes(r.id));

/** Abre la red en pestaña nueva y, si es la primera vez, da el premio. Devuelve los ladrillos dados (0 si ya estaba). */
export function unirse(id) {
  const url = links[id];
  if (!url) return 0;
  let w = null;
  try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (e) { /* bloqueado */ }
  let enMarco = true;
  try { enMarco = window.top !== window.self; } catch (e) { /* itch */ }
  if (!w && !enMarco) { setTimeout(() => { location.href = url; }, 50); }
  if (!save.comunidad) save.comunidad = {};
  const primera = !save.comunidad[id];
  track('compartir', { tipo: 'comunidad', red: id, primera });
  if (!primera) return 0;
  save.comunidad[id] = true;
  save.bricks += PREMIO_COMUNIDAD;
  persist();
  return PREMIO_COMUNIDAD;
}
