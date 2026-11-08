// Guardado en la nube y Tienda Shadow (cuenta DarkShadow). Todo es opcional: sin cuenta o sin internet el juego sigue igual.
// Servidor: repo de Mutantes, server/src/routes/bloquevilla.ts (GET/PUT /bq/save, POST /bq/comprar).
import { initCuenta, api, onStudio, user, loginUrl, shadowUrl } from './cuenta.js';
import { save, persist, mergeSaves, replaceSave, onPersist } from './save.js';
export { loginUrl, shadowUrl };

// on = sesión iniciada · can = se puede iniciar aquí (en el dominio del estudio y no dentro de itch)
export const nube = { on: false, can: false, name: '', shadow: 0, compras: {}, ladrillos: 0, tienda: [], rev: 0, state: '' };
const listeners = [];
export function onNube(fn) { listeners.push(fn); }
const changed = () => listeners.forEach((f) => { try { f(); } catch (e) { /* nada */ } });

let timer = null, pushing = false, again = false;
function schedule(ms = 6000) { if (!nube.on) return; clearTimeout(timer); timer = setTimeout(push, ms); }

async function push() {
  if (pushing) { again = true; return; }
  pushing = true;
  try {
    const r = await api('/bq/save', { method: 'PUT', body: JSON.stringify({ rev: nube.rev, save }) });
    nube.rev = r.rev; nube.state = 'ok';
  } catch (e) {
    if (e.status === 409 && e.data && e.data.save) {   // otro celular guardó antes: juntar y volver a subir
      replaceSave(mergeSaves(save, e.data.save)); nube.rev = e.data.rev; again = true;
      try { localStorage.setItem('bloquevilla_v1', JSON.stringify(save)); } catch (er) { /* nada */ }
    } else nube.state = 'offline';
  }
  pushing = false;
  if (again) { again = false; schedule(1500); }
}

// Lo comprado con Shadow (lo dice el servidor) se pasa al guardado: temas, insignia y ladrillos que falten por sumar
export function aplicarCompras() {
  let cambio = false;
  for (const it of nube.tienda) {
    if (!(nube.compras[it.id] > 0)) continue;
    if (it.tema && !save.tienda.temas.includes(it.tema)) { save.tienda.temas.push(it.tema); cambio = true; }
    if (it.id === 'fundador' && !save.fundador) { save.fundador = true; cambio = true; }
  }
  const falta = (nube.ladrillos || 0) - (save.ladrillosCobrados || 0);
  if (falta > 0) { save.bricks += falta; save.ladrillosCobrados = nube.ladrillos; cambio = true; }
  if (cambio) persist();
  return falta > 0 ? falta : 0;
}

export async function startNube() {
  nube.can = onStudio() && window.top === window.self;
  const u = await initCuenta();
  if (!u) { changed(); return; }
  try {
    const r = await api('/bq/save');
    Object.assign(nube, { on: true, name: user.name, rev: r.rev, shadow: r.shadow, compras: r.compras || {}, ladrillos: r.ladrillos || 0, tienda: r.tienda || [] });
    if (r.save) replaceSave(mergeSaves(save, r.save));
    aplicarCompras();
    persist();
    onPersist(() => schedule());
    document.addEventListener('visibilitychange', () => { if (document.hidden) schedule(0); });
    await push();
  } catch (e) { nube.state = 'offline'; }
  changed();
}

export async function comprar(item) {
  const r = await api('/bq/comprar', { method: 'POST', body: JSON.stringify({ item }) });
  nube.shadow = r.shadow; nube.compras = r.compras || {}; nube.ladrillos = r.ladrillos || 0;
  const lad = aplicarCompras();
  schedule(500);
  changed();
  return { ...r, sumados: lad };
}

if (typeof window !== 'undefined') window.__nube = nube;   // para revisar y grabar videos
