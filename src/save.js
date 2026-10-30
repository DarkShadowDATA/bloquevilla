// Guardado en el navegador (localStorage). Sin cuentas en el MVP.
const KEY = 'bloquevilla_v1';
const DEFAULT = {
  bricks: 0,
  record: 0,
  games: 0,
  built: [],
  theme: 'clasico',
  sound: true,
  vibe: true,
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
  apodo: null,
  partida: null, // partida normal en curso, para retomarla si el navegador se cierra
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { ...JSON.parse(JSON.stringify(DEFAULT)), ...d, reto: { ...DEFAULT.reto, ...(d.reto || {}) }, muertos: { ...DEFAULT.muertos, ...(d.muertos || {}) }, tiempo: { ...DEFAULT.tiempo, ...(d.tiempo || {}) }, tienda: { ...DEFAULT.tienda, ...(d.tienda || {}) }, peligros: { ...DEFAULT.peligros, ...(d.peligros || {}) } };
    }
  } catch (e) { /* navegador sin almacenamiento */ }
  return JSON.parse(JSON.stringify(DEFAULT));
}

export const save = load();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignorar */ }
}

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
