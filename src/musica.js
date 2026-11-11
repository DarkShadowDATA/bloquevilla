// Música de fondo sintetizada con WebAudio (sin archivos): 3 ambientes que se repiten sin cortes.
//   pueblo: tranquila (menú, pueblo, tienda…) · juego: más viva (partidas) · jefe: tensa (niveles de jefe)
// Cada ambiente tiene 8 compases con acordes, bajo, arpegio y una melodía fija (siempre suena igual).
import { save } from './save.js';
import { ac, NIVELES_VOL } from './sfx.js';

const CAPTURA = typeof location !== 'undefined' && location.search.includes('capture');   // los videos arman su propio audio

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// acordes = notas MIDI (raíz primero); melodía = 16 corcheas por compás (null = silencio), en grados de la escala
const AMB = {
  pueblo: { bpm: 84, vol: 2.2, hat: false, arp: 8,
    acordes: [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [46, 50, 53], [48, 52, 55]],
    escala: [65, 67, 69, 72, 74, 77, 79, 81],
    mel: '0.2.4...3.2.1...|2.4.5...4.2.....|4.5.7...5.4.2...|3.2.1...0.......|0.2.4...3.2.1...|2.4.5...7.5.4...|5.4.3...2.1.0...|1.2.3...........' },
  juego: { bpm: 104, vol: 2, hat: true, arp: 16,
    acordes: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
    escala: [72, 74, 76, 79, 81, 84, 86, 88],
    mel: '4...3.2.4...5...|2...1.0.2...3...|0.2.3...2.0.2...|1...3...4.......|4...3.2.4...5...|7...5.4.5...3...|2.3.4...3.2.0...|1.2.3...........' },
  jefe: { bpm: 116, vol: 2, hat: true, arp: 16,
    acordes: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47], [45, 48, 52], [41, 45, 48], [38, 41, 45], [40, 44, 47]],
    escala: [69, 71, 72, 74, 76, 77, 80, 81],
    mel: '0.0.2.4...2.0...|5...4.2.0.......|1.1.3.4...3.1...|6...4...6.......|0.0.2.4...2.0...|5...4.5.7.......|3.2.1...3.4.5...|6...............' },
};

let ctxM = null, master = null, bus = null, modo = null, siguiente = null, paso = 0, t0 = 0, timer = null, ruido = null;

const nivel = () => NIVELES_VOL[save.volMus ?? 2] ?? 0;

function nodos(a) {
  if (master) return;
  master = a.createGain(); master.gain.value = 0;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  bus = a.createGain(); bus.gain.value = 1;
  bus.connect(lp).connect(master).connect(a.destination);
  const n = a.createBuffer(1, a.sampleRate * 0.1, a.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  ruido = n;
}

function nota(a, f, t, dur, { type = 'triangle', vol = 0.05, ataque = 0.01 } = {}) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t); o.stop(t + dur + 0.05);
}

function hat(a, t, vol) {
  const s = a.createBufferSource(); s.buffer = ruido;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f).connect(g).connect(bus); s.start(t); s.stop(t + 0.06);
}

// Programa una corchea (16 por compás de 4/4 = semicorcheas) del ambiente actual
function tocar(a, t) {
  const A = AMB[modo];
  const comp = Math.floor(paso / 16) % 8, k = paso % 16;
  const dur16 = 60 / A.bpm / 4;
  const acorde = A.acordes[comp];
  if (k === 0) {                                   // acorde de colchón, todo el compás
    acorde.forEach((m) => { nota(a, hz(m + 12), t, dur16 * 16, { type: 'sine', vol: 0.022, ataque: 0.25 }); nota(a, hz(m + 12) * 1.004, t, dur16 * 16, { type: 'triangle', vol: 0.012, ataque: 0.3 }); });
  }
  if (k === 0 || k === 8) nota(a, hz(acorde[0] - 12), t, dur16 * 7, { type: 'sine', vol: 0.09, ataque: 0.02 });     // bajo
  if (A.arp === 16 ? k % 2 === 0 : k % 4 === 2) {                                                                     // arpegio
    const m = acorde[(k / 2) % 3 | 0] + 24;
    nota(a, hz(m), t, dur16 * 2.2, { type: 'triangle', vol: 0.018 });
  }
  if (A.hat && k % 4 === 2) hat(a, t, 0.025);
  const g = A.mel.split('|')[comp][k];
  if (g && g !== '.') {
    let largo = 1; const linea = A.mel.split('|')[comp];
    while (k + largo < 16 && linea[k + largo] === '.' && largo < 6) largo++;
    nota(a, hz(A.escala[+g]), t, dur16 * largo * 0.95, { type: 'square', vol: 0.016, ataque: 0.008 });
    nota(a, hz(A.escala[+g]), t, dur16 * largo, { type: 'triangle', vol: 0.03 });
  }
}

function bucle() {
  const a = ctxM;
  if (!a || !modo || a.state !== 'running') return;
  if (t0 < a.currentTime) t0 = a.currentTime + 0.05;
  while (t0 < a.currentTime + 0.8) {   // 0.8 s por adelantado: aguanta tirones del celular
    // el cambio de ambiente espera al inicio de un compás para no cortar a media frase
    if (siguiente && paso % 16 === 0) { modo = siguiente; siguiente = null; paso = 0; }
    tocar(a, t0);
    t0 += 60 / AMB[modo].bpm / 4;
    paso++;
  }
}

function volumen(rapido) {
  if (!master) return;
  const a = ctxM;
  const v = modo ? nivel() * AMB[modo].vol : 0;
  master.gain.cancelScheduledValues(a.currentTime);
  master.gain.setTargetAtTime(v, a.currentTime, rapido ? 0.05 : 0.6);
}

export const musica = {
  // Cambia de ambiente (o lo arranca). Se llama al entrar a cada pantalla.
  modo(m) {
    if (CAPTURA || !AMB[m]) return;
    this.deseado = m;
    if (!nivel()) return;
    const a = ac();
    if (!a || a.state !== 'running') return;   // se arranca con el primer toque (desbloquear)
    nodos(a); ctxM = a;
    if (!modo) { modo = m; paso = 0; t0 = a.currentTime + 0.1; }
    else if (m !== modo) siguiente = m;
    if (!timer) timer = setInterval(bucle, 120);
    volumen(false);
  },
  // Tras el primer toque de la pantalla (los navegadores no dejan sonar antes)
  desbloquear() { if (this.deseado) setTimeout(() => this.modo(this.deseado), 60); },
  // Al mover el volumen en Ajustes
  actualizar() {
    if (CAPTURA) return;
    if (!nivel()) { volumen(true); return; }
    if (!master || !modo) this.modo(this.deseado || 'pueblo'); else volumen(true);
  },
  deseado: null,
};

// Sin pantalla a la vista (otra pestaña, celular bloqueado): todo el audio se pausa
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const a = ctxM;
    if (!a) return;
    if (document.hidden) a.suspend(); else a.resume();
  });
}
