// Logros: 10 logros con 3 medallas cada uno (bronce, plata y oro) = 30. Cada medalla se cobra en la pantalla de Logros.
// Los contadores suben en la partida (Game.mision llama a contar) y algunos se leen del guardado (edificios, estrellas…).
import { save, persist } from './save.js';

export const MEDALLAS = ['bronce', 'plata', 'oro'];
export const PREMIO_MEDALLA = [20, 50, 100];   // ladrillos por bronce, plata y oro (hasta 1,700 en total)

const fmt = (n) => n.toLocaleString('es-MX');
// c = contador (suma o máximo); valor() = se lee del guardado
export const LOGROS = [
  { id: 'lineas', nombre: 'Limpiador', texto: (n) => `Limpia ${fmt(n)} líneas`, metas: [100, 1000, 5000], c: 'lineas', icono: 'ui_estrella' },
  { id: 'oro', nombre: 'Buscador de oro', texto: (n) => `Limpia ${fmt(n)} bloques dorados`, metas: [25, 150, 500], c: 'oro', icono: 'block_gold' },
  { id: 'bombas', nombre: 'Artificiero', texto: (n) => `Desactiva ${fmt(n)} bombas`, metas: [5, 30, 100], c: 'bombas', icono: 'blk_bomba' },
  { id: 'hielo', nombre: 'Rompehielos', texto: (n) => `Rompe ${fmt(n)} bloques de hielo`, metas: [10, 60, 200], c: 'hielo', icono: 'blk_hielo' },
  { id: 'partidas', nombre: 'Constante', texto: (n) => `Termina ${fmt(n)} partidas`, metas: [10, 50, 200], c: 'partidas', icono: 'ui_ladrillo' },
  { id: 'puntos', nombre: 'Gran puntaje', texto: (n) => `Haz ${fmt(n)} pts en una partida`, metas: [3000, 8000, 15000], c: 'puntos', max: true, icono: 'ui_trofeo' },
  { id: 'combo', nombre: 'Imparable', texto: (n) => `Llega a combo x${n}`, metas: [4, 6, 8], c: 'combo', max: true, icono: 'ui_estrella' },
  { id: 'edificios', nombre: 'Constructor', texto: (n) => `Reconstruye ${n} edificios`, metas: [3, 6, 12], valor: () => (save.built || []).length, icono: 'bld_casa' },
  { id: 'estrellas', nombre: 'Aventurero', texto: (n) => `Junta ${n} estrellas en la Aventura`, metas: [10, 30, 60],
    valor: () => (save.aventura.estrellas || []).reduce((a, e) => a + (e || 0), 0), icono: 'ui_estrella' },
  { id: 'cofres', nombre: 'Disciplinado', texto: (n) => `Abre ${n} cofres de misiones`, metas: [3, 15, 50], c: 'cofres', icono: 'ui_regalo' },
];

function datos() {
  if (!save.logros || typeof save.logros !== 'object') save.logros = { c: {}, cobrados: {} };
  save.logros.c = save.logros.c || {};
  save.logros.cobrados = save.logros.cobrados || {};
  return save.logros;
}

export const progreso = (L) => (L.valor ? L.valor() : datos().c[L.c] || 0);
export const alcanzadas = (L) => L.metas.filter((m) => progreso(L) >= m).length;   // 0..3
export const cobradas = (L) => datos().cobrados[L.id] || 0;                           // 0..3

// Suma (o guarda el máximo de) un contador; devuelve los logros que acaban de subir de medalla
export function contar(clave, v = 1) {
  if (!v || v < 0) return [];
  const d = datos();
  const afect = LOGROS.filter((L) => L.c === clave);
  if (!afect.length) return [];
  const antes = afect.map(alcanzadas);
  d.c[clave] = afect[0].max ? Math.max(d.c[clave] || 0, v) : (d.c[clave] || 0) + v;
  return afect.filter((L, i) => alcanzadas(L) > antes[i]).map((L) => ({ L, medalla: alcanzadas(L) - 1 }));
}

// Medallas ganadas y sin cobrar (para el aviso rojo del menú)
export const porCobrarLogros = () => LOGROS.reduce((a, L) => a + Math.max(0, alcanzadas(L) - cobradas(L)), 0);

export function cobrarLogro(L) {
  const d = datos();
  const k = cobradas(L);
  if (k >= alcanzadas(L)) return 0;
  const premio = PREMIO_MEDALLA[k];
  d.cobrados[L.id] = k + 1;
  save.bricks += premio;
  persist();
  return premio;
}

// % total (medallas ganadas de 30)
export const porcentaje = () => Math.round((LOGROS.reduce((a, L) => a + alcanzadas(L), 0) / (LOGROS.length * 3)) * 100);
export const totalMedallas = () => LOGROS.reduce((a, L) => a + alcanzadas(L), 0);
