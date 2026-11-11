// Guardado en el navegador (localStorage). Con cuenta DarkShadow también se guarda en la nube (nube.js).
const KEY = 'bloquevilla_v1';
const DEFAULT = {
  bricks: 0,
  record: 0,
  games: 0,
  built: [],
  theme: 'clasico',
  sound: true,
  volSfx: 3,             // sonidos 0..4 (0 = apagado)
  volMus: 2,             // música 0..4
  vibe: true,
  stats: { seg: 0, piezas: 0 },   // tiempo jugando y piezas colocadas (desde la v1.10)
  daily: { last: null, streak: 0 },
  pendingPower: null,
  reto: { last: null, racha: 0 },
  muertos: { flores: 0, tema: false },
  tiempo: { record: 0, partidas: 0 },
  oroVisto: false,
  tienda: { temas: [], deco: [], visto: false },
  proximos: [],
  jugador: null,
  peligros: { bomba: false, hielo: false },
  aventura: { estrellas: [] },
  apodo: null,
  rankingCobrado: null,
  misiones: null, // misiones diarias de hoy (misiones.js)
  misionesVistas: false,
  ladrillosCobrados: 0, // ladrillos comprados con Shadow que ya se sumaron (nube.js)
  fundador: false,
  logros: { c: {}, cobrados: {} }, // logros.js
  logrosVistos: false,
  cofreSemana: '',       // lunes de la última semana en que se cobró el cofre de la Tesorería
  finalVisto: false,     // ya vio la escena final (Castillo)
  prueba: null,          // prueba.js: tema del día { dia, usado, enJuego }
  coleccion: { vistos: [], premio: false },   // coleccion.js
  apoyo: 0,              // veces que apoyó al creador (insignia ☕)
  partida: null, // partida normal en curso, para retomarla si el navegador se cierra
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { ...JSON.parse(JSON.stringify(DEFAULT)), ...d, reto: { ...DEFAULT.reto, ...(d.reto || {}) }, muertos: { ...DEFAULT.muertos, ...(d.muertos || {}) }, tiempo: { ...DEFAULT.tiempo, ...(d.tiempo || {}) }, tienda: { ...DEFAULT.tienda, ...(d.tienda || {}) }, peligros: { ...DEFAULT.peligros, ...(d.peligros || {}) }, aventura: { ...DEFAULT.aventura, ...(d.aventura || {}) }, stats: { ...DEFAULT.stats, ...(d.stats || {}) } };
    }
  } catch (e) { /* navegador sin almacenamiento */ }
  return JSON.parse(JSON.stringify(DEFAULT));
}

export const save = load();

let onChange = null;
export function onPersist(fn) { onChange = fn; }   // la nube (nube.js) se entera de cada guardado
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignorar */ }
  if (onChange) onChange();
}

// Junta dos guardados (celular y nube): manda el que va más avanzado y no se pierde nada de lo ganado en el otro
const avance = (s) => ((s && s.built) || []).length * 100000 + ((s && s.games) || 0);
export function mergeSaves(local, nube) {
  if (!nube) return local;
  const fresh = JSON.parse(JSON.stringify(DEFAULT));
  const nubeGana = avance(nube) > avance(local);
  const base = JSON.parse(JSON.stringify(nubeGana ? nube : local));
  const otro = nubeGana ? local : nube;
  const out = { ...fresh, ...base, tienda: { ...fresh.tienda, ...(base.tienda || {}) }, tiempo: { ...fresh.tiempo, ...(base.tiempo || {}) },
    muertos: { ...fresh.muertos, ...(base.muertos || {}) }, aventura: { ...fresh.aventura, ...(base.aventura || {}) } };
  const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];
  out.built = union(out.built, otro.built);
  out.tienda.temas = union(out.tienda.temas, otro.tienda && otro.tienda.temas);
  out.tienda.deco = union(out.tienda.deco, otro.tienda && otro.tienda.deco);
  out.record = Math.max(out.record || 0, otro.record || 0);
  out.games = Math.max(out.games || 0, otro.games || 0);
  out.ladrillosCobrados = Math.max(out.ladrillosCobrados || 0, otro.ladrillosCobrados || 0);
  out.tiempo.record = Math.max(out.tiempo.record || 0, (otro.tiempo && otro.tiempo.record) || 0);
  out.tiempo.partidas = Math.max(out.tiempo.partidas || 0, (otro.tiempo && otro.tiempo.partidas) || 0);
  out.muertos.flores = Math.max(out.muertos.flores || 0, (otro.muertos && otro.muertos.flores) || 0);
  out.muertos.tema = !!(out.muertos.tema || (otro.muertos && otro.muertos.tema));
  for (const k of ['oroVisto', 'misionesVistas', 'fundador', 'logrosVistos']) out[k] = !!(out[k] || otro[k]);
  const LA = local.logros || {}, LB = nube.logros || {};
  out.logros = { c: { ...(LA.c || {}) }, cobrados: { ...(LA.cobrados || {}) } };
  for (const [k, v] of Object.entries(LB.c || {})) out.logros.c[k] = Math.max(out.logros.c[k] || 0, v || 0);
  for (const [k, v] of Object.entries(LB.cobrados || {})) out.logros.cobrados[k] = Math.max(out.logros.cobrados[k] || 0, v || 0);
  const e1 = out.aventura.estrellas || [], e2 = (otro.aventura && otro.aventura.estrellas) || [];
  out.aventura.estrellas = Array.from({ length: Math.max(e1.length, e2.length) }, (_, i) => Math.max(e1[i] || 0, e2[i] || 0));
  out.aventura.meta150 = !!(out.aventura.meta150 || (otro.aventura && otro.aventura.meta150));
  out.aventura.vistos = { ...((otro.aventura && otro.aventura.vistos) || {}), ...(out.aventura.vistos || {}) };
  out.apoyo = Math.max(out.apoyo || 0, otro.apoyo || 0);
  const ca = out.coleccion || {}, cb = otro.coleccion || {};
  out.coleccion = { vistos: [...new Set([...(ca.vistos || []), ...(cb.vistos || [])])], premio: !!(ca.premio || cb.premio) };
  out.cofreSemana = [out.cofreSemana || '', otro.cofreSemana || ''].sort().pop();
  out.finalVisto = !!(out.finalVisto || otro.finalVisto);
  // tema del día: si ya se usó hoy en cualquiera de los dos, ya se usó
  const pa = local.prueba, pb = nube.prueba;
  out.prueba = pa && pb && pa.dia === pb.dia ? { dia: pa.dia, usado: !!(pa.usado || pb.usado), enJuego: !!pa.enJuego }
    : (pa && (!pb || pa.dia > pb.dia) ? pa : pb ? { ...pb, enJuego: false } : null);
  out.partida = local.partida || null;   // la partida a medias es de este celular
  const sa = local.stats || {}, sb = nube.stats || {};
  out.stats = { seg: Math.max(sa.seg || 0, sb.seg || 0), piezas: Math.max(sa.piezas || 0, sb.piezas || 0) };
  out.sound = local.sound; out.theme = local.theme;
  for (const k of ['volSfx', 'volMus', 'vibe']) if (local[k] !== undefined) out[k] = local[k];
  return out;
}
export function replaceSave(s) { for (const k of Object.keys(save)) delete save[k]; Object.assign(save, s); }

export const isBuilt = (id) => save.built.includes(id);

export function today() {
  // ?fecha=AAAA-MM-DD solo para grabar videos de otros días
  const m = typeof location !== 'undefined' && location.search.match(/fecha=(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dailyAvailable() {
  return isBuilt('panaderia') && save.daily.last !== today();
}

// Día de la racha que toca hoy (0..6); se reinicia si se salta un día
export function dailyIndex() {
  const last = save.daily.last;
  if (!last) return 0;
  const diff = Math.round((new Date(today()) - new Date(last)) / 864e5);
  if (diff === 1) return save.daily.streak % 7;
  return 0;
}

export function ayer() {
  const d = new Date(new Date(today() + 'T12:00:00').getTime() - 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
