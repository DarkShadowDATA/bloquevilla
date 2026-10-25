// Sonidos sintetizados con WebAudio: no hacen falta archivos de audio.
import { save } from './save.js';

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.14, when = 0, slide = 0 } = {}) {
  if (!save.sound) return;
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const semis = (base, n) => base * Math.pow(2, n / 12);
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

export const sfx = {
  unlock() { ac(); },
  click() { tone(660, 0.06, { type: 'triangle', vol: 0.08 }); },
  pick() { tone(420, 0.07, { type: 'triangle', vol: 0.07, slide: 1.4 }); },
  place() { tone(180, 0.09, { type: 'triangle', vol: 0.16, slide: 0.7 }); },
  back() { tone(300, 0.1, { type: 'sine', vol: 0.06, slide: 0.6 }); },
  // El tono sube una nota por cada nivel de combo
  clear(combo = 1) {
    const step = SCALE[Math.min(combo - 1, SCALE.length - 1)];
    const f = semis(523, step);
    tone(f, 0.22, { vol: 0.13 });
    tone(f * 1.5, 0.28, { vol: 0.07, when: 0.05 });
  },
  combo(n) {
    for (let i = 0; i < Math.min(n + 1, 5); i++) tone(semis(784, SCALE[i]), 0.14, { type: 'square', vol: 0.04, when: 0.08 + i * 0.06 });
  },
  power() {
    [0, 4, 7, 12].forEach((s, i) => tone(semis(523, s), 0.18, { type: 'sine', vol: 0.1, when: i * 0.07 }));
  },
  boom() { tone(120, 0.35, { type: 'sawtooth', vol: 0.12, slide: 0.3 }); },
  coin() { tone(988, 0.08, { vol: 0.08 }); tone(1318, 0.14, { vol: 0.08, when: 0.07 }); },
  build() {
    tone(110, 0.25, { type: 'triangle', vol: 0.2, slide: 0.6 });
    [0, 4, 7, 12, 16].forEach((s, i) => tone(semis(523, s), 0.2, { vol: 0.09, when: 0.25 + i * 0.08 }));
  },
  over() { [7, 4, 0, -5].forEach((s, i) => tone(semis(392, s), 0.25, { type: 'triangle', vol: 0.1, when: i * 0.14 })); },
  tick() { tone(1250, 0.05, { type: 'square', vol: 0.05 }); },
  error() { tone(160, 0.12, { type: 'square', vol: 0.05 }); },
};

export function vibe(ms) {
  if (save.vibe && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) { /* iPhone no lo soporta */ }
  }
}

// En modo captura se registra cada sonido con su tiempo, para rearmar el audio del video
if (typeof window !== 'undefined' && location.search.includes('capture')) {
  Object.keys(sfx).forEach((k) => {
    const fn = sfx[k];
    sfx[k] = (...args) => {
      if (window.__sfxLog) window.__sfxLog.push([k, args, window.__capTime || 0]);
      return fn(...args);
    };
  });
}
