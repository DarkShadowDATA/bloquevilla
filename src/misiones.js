// Misiones diarias: 3 al día (fácil, media y difícil), iguales para todos ese día (la semilla es la fecha).
// Cuentan en todos los modos. Cada una da ladrillos al cobrarla y, al cobrar las 3, se abre el cofre.
import { save, persist, today } from './save.js';
import { rngDe, barajar } from './rng.js';
import { maxPoderes } from './bonos.js';

const fmt = (n) => n.toLocaleString('es-MX');
// n = meta por dificultad [fácil, media, difícil]; max = cuenta el mejor valor de una partida, no la suma
export const TIPOS = {
  lineas: { texto: (n) => `Limpia ${n} líneas`, n: [15, 30, 50], icono: 'ui_estrella' },
  puntos: { texto: (n) => `Haz ${fmt(n)} pts en una partida`, n: [1500, 3000, 6000], max: true, icono: 'ui_trofeo' },
  combo: { texto: (n) => `Llega a combo x${n}`, n: [3, 4, 5], max: true, icono: 'ui_estrella' },
  oro: { texto: (n) => `Limpia ${n} bloques dorados`, n: [3, 6, 10], icono: 'block_gold' },
  bombas: { texto: (n) => (n === 1 ? 'Desactiva 1 bomba' : `Desactiva ${n} bombas`), n: [1, 2, 4], icono: 'blk_bomba' },
  hielo: { texto: (n) => `Rompe ${n} bloques de hielo`, n: [2, 4, 7], icono: 'blk_hielo' },
  partidas: { texto: (n) => `Termina ${n} partidas`, n: [2, 4, 6], icono: 'ui_ladrillo' },
  estrellas: { texto: (n) => (n === 1 ? 'Gana 1 estrella en Aventura' : `Gana ${n} estrellas en Aventura`), n: [1, 3, 5], icono: 'ui_estrella' },
  tiempo: { texto: () => 'Juega 1 Contrarreloj de 60 s', n: [1, 1, 1], soloFacil: true, icono: 'ui_trofeo' },
  reto: { texto: () => 'Completa el Reto del día', n: [1, 1, 1], soloMedia: true, icono: 'ui_estrella' },
};
export const PREMIO_MISION = [15, 25, 40];
export const COFRE = { ladrillos: 30, poderes: ['martillo', 'bomba', 'rayo'], ladrillosSiLleno: 20 };
const ESTRELLAS_MAX = 60;   // 20 niveles × 3

// Misiones de hoy (las crea la primera vez que se piden en el día)
export function misionesHoy() {
  const d = today();
  if (save.misiones && save.misiones.dia === d && Array.isArray(save.misiones.lista)) return save.misiones;
  const rnd = rngDe('misiones-' + d);
  const estrellas = (save.aventura.estrellas || []).reduce((a, e) => a + (e || 0), 0);
  const usados = new Set();
  const lista = [0, 1, 2].map((dif) => {
    const opciones = barajar(Object.keys(TIPOS), rnd).filter((t) => {
      const T = TIPOS[t];
      if (usados.has(t)) return false;
      if (T.soloFacil && dif !== 0) return false;
      if (T.soloMedia && dif !== 1) return false;
      if (t === 'estrellas' && estrellas + T.n[dif] > ESTRELLAS_MAX) return false;
      return true;
    });
    const t = opciones[0];
    usados.add(t);
    return { t, n: TIPOS[t].n[dif], dif, p: 0, cobrada: false };
  });
  // lo que ya se hizo hoy antes de abrir las misiones también cuenta
  lista.forEach((m) => {
    if (m.t === 'reto' && save.reto.last === d) m.p = 1;
  });
  save.misiones = { dia: d, lista, cofre: false };
  persist();
  return save.misiones;
}

export const textoMision = (m) => TIPOS[m.t].texto(m.n);
export const iconoMision = (m) => TIPOS[m.t].icono;
export const cumplida = (m) => m.p >= m.n;

// Suma progreso; devuelve las misiones que se acaban de cumplir (para avisar en la partida)
export function avanzar(tipo, v = 1) {
  if (!v || v < 0) return [];
  const M = misionesHoy();
  const nuevas = [];
  M.lista.forEach((m) => {
    if (m.t !== tipo || cumplida(m)) return;
    m.p = TIPOS[tipo].max ? Math.max(m.p, v) : m.p + v;
    if (cumplida(m)) { m.p = m.n; nuevas.push(m); }
  });
  if (nuevas.length || M.lista.some((m) => m.t === tipo)) persist();
  return nuevas;
}

// Cuántas cosas hay para cobrar (para la marca del botón del menú)
export function porCobrar() {
  const M = misionesHoy();
  const n = M.lista.filter((m) => cumplida(m) && !m.cobrada).length;
  return n + (cofreListo() ? 1 : 0);
}

export const cofreListo = () => { const M = misionesHoy(); return !M.cofre && M.lista.every((m) => m.cobrada); };

export function cobrar(i) {
  const m = misionesHoy().lista[i];
  if (!m || m.cobrada || !cumplida(m)) return 0;
  m.cobrada = true;
  const premio = PREMIO_MISION[m.dif];
  save.bricks += premio;
  persist();
  return premio;
}

// Cofre por las 3: ladrillos + un poder para la próxima partida (o más ladrillos si ya están llenos los espacios)
export function abrirCofre() {
  if (!cofreListo()) return null;
  const M = misionesHoy();
  M.cofre = true;
  const rnd = rngDe('cofre-' + M.dia);
  let ladrillos = COFRE.ladrillos, poder = null;
  if ((save.proximos || []).length < maxPoderes()) {
    poder = COFRE.poderes[Math.floor(rnd() * COFRE.poderes.length)];
    save.proximos.push(poder);
  } else ladrillos += COFRE.ladrillosSiLleno;
  save.bricks += ladrillos;
  persist();
  return { ladrillos, poder };
}

// Tiempo para las misiones nuevas (medianoche local)
export function faltaParaNuevas() {
  const ahora = new Date();
  const man = new Date(ahora); man.setHours(24, 0, 0, 0);
  const min = Math.max(1, Math.round((man - ahora) / 60000));
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}
