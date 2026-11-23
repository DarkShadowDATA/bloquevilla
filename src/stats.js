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

// ?src=itch: el juego abierto desde itch.io (su HTML abre la versión en línea). Se lee al cargar, antes de limpiar la URL.
const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
const SRC = (QS.get('src') || QS.get('utm_source') || '').slice(0, 30);
// Campaña del anuncio: ?campana=bq1 (o utm_campaign). Ejemplo de link: ?src=fb_ads&campana=bq1
const CAMPANA = (QS.get('campana') || QS.get('utm_campaign') || '').replace(/[^\w-]/g, '').slice(0, 30);

/** ¿Llegó de un anuncio pagado? (?src=fb_ads / ig_ads / *_ads, ?campana=…, utm_medium=paid o el clic de Meta fbclid con campaña) */
export const esAnuncio = () => /_ads$|^ads?$/.test(SRC) || !!CAMPANA || /paid|cpc|ads/.test(QS.get('utm_medium') || '');

// De dónde llegó en ESTA visita: anuncio (src del link), itch, página del estudio, otra página o directo
function llegadaAhora() {
  if (SRC) return SRC;
  if (QS.get('via') === 'estudio') return 'estudio';
  try {
    const h = document.referrer ? new URL(document.referrer).hostname : '';
    if (/itch\.(io|zone)$/.test(h) || /itch\.(io|zone)$/.test(location.hostname)) return 'itch';
    if (h === 'darkshadow-studios.com' || h === 'www.darkshadow-studios.com') return 'estudio';
    if (/facebook\.|fb\.com|instagram\./.test(h)) return 'fb_ig';
    if (h && h !== location.hostname) return h.slice(0, 30);
  } catch (e) { /* sin referrer */ }
  return 'directo';
}
const LLEGADA = llegadaAhora();
const SESION = Math.random().toString(36).slice(2, 10);   // esta visita (para sumar el tiempo jugado)
const T0 = Date.now();

// De dónde se está jugando: itch, el dominio del estudio u otro sitio
function origen() {
  const h = location.hostname;
  if (/itch\.(io|zone)$/.test(h) || SRC === 'itch') return 'itch';
  if (h.endsWith('darkshadow-studios.com')) return 'dominio';
  if (/claude|anthropic/.test(h)) return 'claude';
  return h.slice(0, 40) || 'otro';
}

const apagado = () => {
  const q = location.search;
  const h = location.hostname;
  return q.includes('capture') || q.includes('nostats') || h === 'localhost' || h === '127.0.0.1' || h === '';
};

// Todos los eventos guardan de dónde llegó: en esta visita (llegada/campana) y la primera vez que jugó (primera/primeraCampana)
function procedencia() {
  if (!save.llegada) { save.llegada = { src: LLEGADA, campana: CAMPANA || undefined }; persist(); }
  const p = { llegada: LLEGADA, sesion: SESION };
  if (CAMPANA) p.campana = CAMPANA;
  if (save.llegada.src !== LLEGADA || save.llegada.campana) { p.primera = save.llegada.src; if (save.llegada.campana) p.primeraCampana = save.llegada.campana; }
  return p;
}

export function track(evento, datos = {}) {
  if (apagado()) return;
  try {
    fetch(URL, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ jugador: jugador(), evento, origen: origen(), version: VERSION, datos: { ...datos, ...procedencia() } }),
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
    lang: (navigator.language || '').slice(0, 10),   // idioma del celular, para decidir próximas traducciones
    partidas: save.games,
    edificios: save.built.length,
  });
}

// ---------- Tiempo de juego (la tabla solo acepta ciertos eventos: van como 'tiempo' con un tipo) ----------
let primeraPieza = false;
/** Primera pieza puesta en esta visita: cuántos segundos tardó desde que abrió el juego. */
export function trackPrimeraPieza(datos = {}) {
  if (primeraPieza) return;
  primeraPieza = true;
  track('tiempo', { tipo: 'primera_pieza', s: Math.round((Date.now() - T0) / 1000), nuevo: save.games === 0, ...datos });
}

// Tiempo jugado: a los 1, 2, 3, 5, 10, 15, 20 y 30 minutos, y al salir (el máximo por «sesion» es lo que jugó)
let activo = 0, ultimo = Date.now(), enviado = 0, visible = typeof document === 'undefined' || !document.hidden;
const MARCAS = [60, 120, 180, 300, 600, 900, 1200, 1800];
const contar = () => { const now = Date.now(); if (visible) activo += now - ultimo; ultimo = now; };
function mandarSesion(motivo) {
  contar();
  const s = Math.round(activo / 1000);
  if (s < 3 || s === enviado) return;
  enviado = s;
  track('tiempo', { tipo: 'sesion', s, motivo, partidas: save.games });
}
if (typeof document !== 'undefined' && !apagado()) {
  setInterval(() => {
    contar();
    const s = activo / 1000;
    if (MARCAS.some((m) => s >= m && enviado < m) || (s >= 1800 && s - enviado >= 600)) mandarSesion('minuto');
  }, 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { mandarSesion('salir'); visible = false; } else { contar(); visible = true; }
  });
  window.addEventListener('pagehide', () => mandarSesion('salir'));
}
