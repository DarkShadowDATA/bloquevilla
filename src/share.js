// Retar a un amigo: link con la semilla de la partida, el puntaje a superar y tu apodo
import { save, persist } from './save.js';
import { toast } from './ui.js';
import { track } from './stats.js';

const DOMINIO = 'https://bloquevilla.darkshadow-studios.com/';
const PROHIBIDAS = ['puto', 'puta', 'pendej', 'verga', 'chinga', 'mierda', 'culer', 'joto', 'marica', 'pinche', 'cabron', 'nazi', 'fuck', 'shit', 'bitch'];

export function apodoValido(a) {
  const t = (a || '').trim().replace(/\s+/g, ' ');
  if (t.length < 2 || t.length > 12) return null;
  if (!/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]+$/.test(t)) return null;
  const plano = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (PROHIBIDAS.some((p) => plano.includes(p))) return null;
  return t;
}

// Ventana sencilla de HTML para escribir el apodo (funciona con el teclado del celular)
export function pedirApodo(titulo = '¿Cómo te llamas?', sub = 'Así te verán tus amigos y el ranking') {
  if (save.apodo) return Promise.resolve(save.apodo);
  return new Promise((resolve) => {
    const fondo = document.createElement('div');
    fondo.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,30,.72);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Poppins,system-ui,sans-serif;padding:16px';
    fondo.innerHTML = `<form style="background:#fff7e8;border-radius:24px;padding:22px 20px;width:100%;max-width:340px;text-align:center;box-shadow:0 10px 0 #aa5a1e">
      <div style="font-weight:800;font-size:24px;color:#46286e"></div>
      <div style="font-weight:600;font-size:14px;color:#8c7aa0;margin:6px 0 14px"></div>
      <input id="bv-apodo" maxlength="12" autocomplete="nickname" placeholder="Tu apodo" style="width:100%;box-sizing:border-box;font:700 20px Poppins,system-ui,sans-serif;padding:12px 14px;border-radius:14px;border:3px solid #d8c8e8;outline:none;text-align:center">
      <div id="bv-err" style="color:#c84a4a;font-size:13px;font-weight:700;min-height:18px;margin-top:6px"></div>
      <button type="submit" style="margin-top:6px;width:100%;font:800 20px Poppins,system-ui,sans-serif;color:#fff;background:#5ac85a;border:0;border-radius:16px;padding:12px;box-shadow:0 5px 0 #3a8a3a">Listo</button>
      <button type="button" id="bv-cancel" style="margin-top:10px;background:none;border:0;color:#8c7aa0;font:600 15px Poppins,system-ui,sans-serif">Ahora no</button>
    </form>`;
    const [t1, t2] = fondo.querySelectorAll('form > div');
    t1.textContent = titulo;
    t2.textContent = sub;
    document.body.appendChild(fondo);
    const input = fondo.querySelector('#bv-apodo');
    const err = fondo.querySelector('#bv-err');
    setTimeout(() => input.focus(), 50);
    const cerrar = (v) => { fondo.remove(); resolve(v); };
    fondo.querySelector('#bv-cancel').onclick = () => cerrar(null);
    fondo.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const a = apodoValido(input.value);
      if (!a) { err.textContent = 'De 2 a 12 letras o números, sin groserías'; return; }
      save.apodo = a;
      persist();
      cerrar(a);
    };
  });
}

export function linkReto(semilla, puntos, tiempo) {
  const base = /darkshadow-studios\.com$/.test(location.hostname) ? location.origin + '/' : DOMINIO;
  const q = new URLSearchParams({ vs: String(semilla), p: String(puntos), n: save.apodo || 'Un amigo', ref: 'vs' });
  if (tiempo) q.set('m', 't');
  return base + '?' + q.toString();
}

// Lee un reto que llegó por link (?vs=...)
export function leerReto() {
  try {
    const q = new URLSearchParams(location.search);
    const s = parseInt(q.get('vs'), 10);
    if (!Number.isFinite(s) || s < 0) return null;
    const p = Math.max(0, Math.min(999999, parseInt(q.get('p'), 10) || 0));
    const n = apodoValido(q.get('n')) || 'Un amigo';
    const m = q.get('m') === 't' ? 't' : null;
    return { s, p, n, m };
  } catch (e) { return null; }
}

export function limpiarLink() {
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignorar */ }
}

export async function compartirReto(scene, semilla, puntos, tiempo, revancha) {
  const apodo = await pedirApodo('¿Cómo te llamas?', 'Tu amigo verá quién lo retó');
  if (!apodo) return;
  const url = linkReto(semilla, puntos, tiempo);
  const fmt = puntos.toLocaleString('es-MX');
  const msg = revancha
    ? `¡Te gané y te regreso el reto en Bloquevilla! Hice ${fmt} puntos con las mismas piezas. ¿Puedes superarme?`
    : `¡Te reto en Bloquevilla! Hice ${fmt} puntos${tiempo ? ' en 60 segundos' : ''}. Juega con mis mismas piezas, ¿me ganas?`;
  track('compartir', { puntos, tiempo: !!tiempo, revancha: !!revancha });
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Bloquevilla', text: msg, url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  try {
    await navigator.clipboard.writeText(`${msg} ${url}`);
    toast(scene, '¡Link copiado! Pégalo en WhatsApp', 352, 2600);
  } catch (e) {
    mostrarLink(`${msg} ${url}`);
  }
}

// Último recurso: mostrar el texto para copiarlo a mano
function mostrarLink(texto) {
  const fondo = document.createElement('div');
  fondo.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,30,.72);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;font-family:Poppins,system-ui,sans-serif';
  fondo.innerHTML = '<div style="background:#fff7e8;border-radius:24px;padding:18px;max-width:360px;width:100%;text-align:center"><div style="font-weight:800;color:#46286e;font-size:20px">Copia y manda este mensaje</div><textarea readonly style="width:100%;box-sizing:border-box;height:120px;margin:12px 0;font:14px system-ui;border-radius:12px;padding:8px"></textarea><button style="width:100%;font:800 18px Poppins,system-ui;color:#fff;background:#6a3ab8;border:0;border-radius:14px;padding:10px">Cerrar</button></div>';
  const ta = fondo.querySelector('textarea');
  ta.value = texto;
  fondo.querySelector('button').onclick = () => fondo.remove();
  document.body.appendChild(fondo);
  ta.select();
}
