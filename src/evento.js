// Evento de temporada: Día de Muertos 2026
import { today, save, persist } from './save.js';

export const EVENTO = {
  id: 'muertos2026',
  nombre: 'Día de Muertos',
  inicio: '2026-10-24',
  fin: '2026-11-02', // último día incluido
  meta: 60, // flores para desbloquear el tema para siempre
  divisorBono: 200, // al terminar: 1 ladrillo por cada 200 puntos (normal: 400)
};

export function eventoActivo() {
  if (typeof location !== 'undefined' && location.search.includes('evento=off')) return false;
  if (typeof location !== 'undefined' && location.search.includes('evento=on')) return true;
  const t = today();
  return t >= EVENTO.inicio && t <= EVENTO.fin;
}

export function diasRestantes() {
  return Math.max(0, Math.round((new Date(EVENTO.fin) - new Date(today())) / 864e5) + 1);
}

// Suma flores; devuelve true si en esta suma se desbloqueó el tema
export function sumarFlores(n) {
  if (!eventoActivo() || n <= 0) return false;
  const antes = save.muertos.flores;
  save.muertos.flores = antes + n;
  let nuevo = false;
  if (!save.muertos.tema && save.muertos.flores >= EVENTO.meta) {
    save.muertos.tema = true;
    nuevo = true;
  }
  persist();
  return nuevo;
}

// Tema de bloques que se ve: durante el evento el clásico se viste de Día de Muertos
export function temaBloques(pozoConstruido) {
  if (save.theme === 'agua' && pozoConstruido) return 'agua';
  if (save.theme === 'muertos' && save.muertos.tema) return 'muertos';
  if (save.theme === 'clasico' && eventoActivo()) return 'muertos';
  return 'clasico';
}
