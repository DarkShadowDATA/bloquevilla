// Tema del día: cada día se presta gratis un tema premium (de la Tienda Shadow) por una partida.
// Es solo apariencia: no cambia piezas, puntos ni premios. Al terminar se ofrece comprarlo, sin insistir.
import { save, persist, today } from './save.js';
import { TIENDA_SHADOW } from './config.js';

const PREMIUM = ['cristal', 'galaxia', 'oropuro'];

// El tema que toca hoy (rota entre los premium que el jugador todavía no tiene); null si ya los tiene todos
export function temaDelDia() {
  const libres = PREMIUM.filter((t) => !save.tienda.temas.includes(t));
  if (!libres.length) return null;
  const n = Math.floor(new Date(today()).getTime() / 864e5);
  return libres[((n % libres.length) + libres.length) % libres.length];
}

function estado() {
  const d = today();
  if (!save.prueba || save.prueba.dia !== d) save.prueba = { dia: d, usado: false, enJuego: false };
  return save.prueba;
}

// El tema de prueba que todavía se puede usar hoy (o null)
export const pruebaDisponible = () => { const t = temaDelDia(); return t && !estado().usado ? t : null; };

// Al empezar una partida: devuelve el tema de prueba si esta partida lo usa.
// continua = se retomó una partida guardada (sigue con la prueba si la tenía).
export function empezarPrueba(permitido, continua) {
  const p = estado();
  const t = temaDelDia();
  if (continua) return p.enJuego && t ? t : null;
  if (permitido && t && !p.usado && save.theme === t) {
    p.usado = true; p.enJuego = true; persist();
    return t;
  }
  if (p.enJuego) { p.enJuego = false; persist(); }
  return null;
}

export function terminarPrueba() {
  const p = estado();
  if (p.enJuego) { p.enJuego = false; persist(); }
}

export const precioTema = (t) => (TIENDA_SHADOW.find((x) => x.tema === t) || {}).shadow || 20;
