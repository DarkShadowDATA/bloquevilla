// Idiomas: español (el original), inglés y portugués. El juego se escribe en español y aquí se traduce al mostrarse:
// todo texto de Phaser pasa por t() (se parcha Text.setText), así no hay que tocar cada pantalla.
// Idioma: el que eligió el jugador en Ajustes (save.idioma) o, si no, el del navegador (es → es, pt → pt, otro → en).
import Phaser from 'phaser';
import EN from './i18n_en.js';
import PT from './i18n_pt.js';
import { save } from './save.js';

const nav = () => { try { return (navigator.language || 'es').toLowerCase(); } catch (e) { return 'es'; } };
const forzado = () => { try { const m = location.search.match(/[?&]lang=(es|en|pt)/); return m && m[1]; } catch (e) { return null; } };
const delNavegador = () => (nav().startsWith('es') ? 'es' : nav().startsWith('pt') ? 'pt' : 'en');
export const idiomaNavegador = nav;
// En modo captura (videos y pruebas) siempre español, salvo ?lang=en
const CAPTURA = (() => { try { return location.search.includes('capture'); } catch (e) { return false; } })();
export const idioma = () => forzado() || (CAPTURA ? 'es' : save.idioma || delNavegador());
export const enIngles = () => idioma() !== 'es';   // hay que traducir (inglés o portugués)
const DIC = { en: EN, pt: PT };

const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
const PLANTILLAS = Object.keys(EN).filter((k) => k.includes('{}'))
  .map((k) => ({ k, re: new RegExp('^' + k.split('{}').map(esc).join('([\\s\\S]*?)') + '$'), lit: k.replace(/\{\}/g, '').length }))
  .sort((a, b) => b.lit - a.lit);

function llenar(en, vals) {
  if (/\{\d\}/.test(en)) return en.replace(/\{(\d)\}/g, (_, i) => vals[+i] ?? '');
  let i = 0;
  return en.replace(/\{\}/g, () => vals[i++] ?? '');
}

const cache = new Map();
function trad(s, prof) {
  const D = DIC[idioma()] || EN;
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(s)) return s;
  if (Object.prototype.hasOwnProperty.call(D, s)) return D[s];
  if (prof > 3) return s;
  for (const p of PLANTILLAS) {
    if (p.lit < 2) continue;
    const m = s.match(p.re);
    if (m) return llenar(D[p.k] || EN[p.k], m.slice(1).map((v) => trad(v, prof + 1)));
  }
  for (const sep of ['\n', ' · ', ': ']) {
    if (s.includes(sep)) {
      const partes = s.split(sep).map((x) => trad(x, prof + 1));
      return partes.join(sep);
    }
  }
  // un emoji o espacio al inicio: traducir el resto
  const m = s.match(/^([^A-Za-zÁÉÍÓÚáéíóúñÑ¡¿]+)([\s\S]+)$/);
  if (m) { const r = trad(m[2], prof + 1); if (r !== m[2]) return m[1] + r; }
  return s;
}

export function t(s) {
  if (typeof s !== 'string' || !s || !enIngles()) return s;
  let r = cache.get(s);
  if (r === undefined) { r = trad(s, 0); if (cache.size > 4000) cache.clear(); cache.set(s, r); }
  return r;
}

export function cambiarIdioma(l) {
  save.idioma = l;
  cache.clear();
  try { document.documentElement.lang = idioma(); } catch (e) { /* ignorar */ }
}

// Todos los textos de Phaser pasan por aquí
const orig = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (v) {
  return orig.call(this, typeof v === 'string' ? t(v) : v);
};
try { document.documentElement.lang = idioma(); } catch (e) { /* ignorar */ }
