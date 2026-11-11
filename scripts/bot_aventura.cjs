// Bot que juega los niveles de la Aventura con el juego real (modo captura, sin dibujar) para calibrar las piezas.
const { chromium } = require('playwright');
(async () => {
  const [from, to, seeds] = [Number(process.argv[2] || 0), Number(process.argv[3] || 59), Number(process.argv[4] || 4)];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/dist/index.html?capture,canvas&evento=off');
  await p.evaluate(() => localStorage.setItem('bloquevilla_v1', JSON.stringify({ bricks: 300, games: 180, sound: false, misionesVistas: true, oroVisto: true, logrosVistos: true, peligros: { bomba: true, hielo: true }, aventura: { estrellas: Array(60).fill(1), vistos: { jefe: 1, cadena: 1, hueco: 1, raras: 1 } } })));
  await p.goto('file://' + process.cwd() + '/dist/index.html?capture,canvas&evento=off');
  await p.waitForFunction(() => window.__capReady === true);
  await p.evaluate(() => {
    const game = window.__game;
    const r = game.renderer; ['preRender', 'render', 'postRender'].forEach((k) => { if (r[k]) r[k] = () => {}; });
    for (let i = 0; i < 400 && !game.scene.isActive('Menu'); i++) window.__step(2, 33);
    window.__jugar = (nivel, intento) => {
      const N = 8;
      game.scene.getScenes(true)[0].scene.start('Game', { reto: false, nivel, intento });
      window.__step(6, 33);
      const g = game.scene.getScene('Game');
      for (let k = 0; k < 60 && !(g.av && g.av.usadas === 0 && !g.over && g.nivel === nivel && g.pieces.length === 3 && g.pieces.every((x) => !x.used && x.c)); k++) window.__step(2, 33);
      let res = null;
      g.finAventura = (gano, titulo) => { res = { gano, usadas: g.av.usadas, titulo: titulo || '' }; g.over = true; g.av.fin = true; };
      if (window.__libre) { g.av.def = { ...g.av.def, p0: g.av.def.p, p: 400 }; }
      const t = g.av.def.t;
      const objetivo = (v) => (t === 'hielo' && (v === 'hielo' || v === 'hielo2')) || (t === 'bombas' && v === 'bomba') || (t === 'oro' && v === 'gold') || v === 'bomba';
      const evalMove = (pc, r, c) => {
        const bd = g.board.map((row) => row.slice());
        pc.cells.forEach(([dr, dc], k) => { bd[r + dr][c + dc] = k === pc.gold ? 'gold' : 'x'; });
        const rows = [], cols = [];
        for (let i = 0; i < N; i++) { if (bd[i].every(Boolean)) rows.push(i); if (bd.every((row) => row[i])) cols.push(i); }
        let s = (rows.length + cols.length) * 120, obj = 0;
        const quitar = (rr, cc, esFila) => {
          const v = bd[rr][cc];
          if (!v || v === 'hueco') return;
          if (v === 'cadv' && !cols.includes(cc)) return;
          if (v === 'cadh' && !rows.includes(rr)) return;
          if (objetivo(v) || v === 'cadv' || v === 'cadh') obj += 1;
          if (v === 'hielo') { bd[rr][cc] = 'hielo2'; return; }
          bd[rr][cc] = null;
        };
        const seen = new Set();
        rows.forEach((rr) => { for (let cc = 0; cc < N; cc++) { const k = rr * N + cc; if (!seen.has(k)) { seen.add(k); quitar(rr, cc); } } });
        cols.forEach((cc) => { for (let rr = 0; rr < N; rr++) { const k = rr * N + cc; if (!seen.has(k)) { seen.add(k); quitar(rr, cc); } } });
        s += obj * 200;
        if (rows.length + cols.length && g.combo >= 1) s += 60;
        let llenos = 0, hoyos = 0, lineas = 0;
        for (let i = 0; i < N; i++) {
          let fr = 0, fc = 0;
          for (let j = 0; j < N; j++) { if (bd[i][j]) fr++; if (bd[j][i]) fc++; }
          lineas += fr * fr + fc * fc;
          for (let j = 0; j < N; j++) {
            if (bd[i][j]) { llenos++; continue; }
            let v = 0;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, e]) => { const x = i + a, y = j + e; if (x < 0 || y < 0 || x >= N || y >= N || bd[x][y]) v++; });
            if (v >= 3) hoyos += v === 4 ? 3 : 1;
          }
        }
        // apuntar a lo que pide el nivel: llenar las filas/columnas de bombas, hielo y cadenas
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const v = bd[i][j];
          if (!v) continue;
          let fr = 0, fc = 0;
          for (let q = 0; q < N; q++) { if (bd[i][q]) fr++; if (bd[q][j]) fc++; }
          if (v === 'bomba') { const tm = g.bombas[i * N + j] || 9; s += Math.max(fr, fc) * (70 / Math.max(1, tm - 1)); }
          else if (v === 'cadv') s += fc * 9;
          else if (v === 'cadh') s += fr * 9;
          else if (t === 'hielo' && (v === 'hielo' || v === 'hielo2')) s += Math.max(fr, fc) * 5;
          else if (t === 'oro' && v === 'gold') s += Math.max(fr, fc) * 5;
        }
        // que las otras piezas de la bandeja sigan cabiendo
        let sinLugar = 0;
        g.pieces.forEach((o) => {
          if (o.used || o === pc) return;
          let cabe = false;
          for (let i = 0; i < N && !cabe; i++) for (let j = 0; j < N && !cabe; j++) cabe = o.cells.every(([dr, dc]) => { const x = i + dr, y = j + dc; return x >= 0 && y >= 0 && x < N && y < N && !bd[x][y]; });
          if (!cabe) sinLugar++;
        });
        // espacio para piezas grandes: cuántos huecos de 3x3 y tiras de 4 quedan
        let grandes = 0;
        for (let i = 0; i < N - 2; i++) for (let j = 0; j < N - 2; j++) { let ok = true; for (let a = 0; a < 3 && ok; a++) for (let e = 0; e < 3 && ok; e++) if (bd[i + a][j + e]) ok = false; if (ok) grandes++; }
        return s - llenos * 7 - hoyos * 16 + lineas * 0.45 - sinLugar * 600 + Math.min(grandes, 6) * 12;
      };
      const fits = (cells, r, c) => cells.every(([dr, dc]) => { const x = r + dr, y = c + dc; return x >= 0 && y >= 0 && x < N && y < N && !g.board[x][y]; });
      for (let turno = 0; turno < 400 && !res; turno++) {
        for (let k = 0; k < 120 && (g.busy || g.offerOpen) && !res; k++) {
          if (g.offerOpen && g._offerCards && g._offerCards[0] && !g.__ofr) { g.__ofr = true; g._offerCards[0].emit('pointerdown'); }
          if (!g.offerOpen) g.__ofr = false;
          window.__step(2, 50);
        }
        if (res) break;
        let best = null;
        g.pieces.filter((pc) => !pc.used).forEach((pc) => {
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(pc.cells, r, c)) { const v = evalMove(pc, r, c); if (!best || v > best.v) best = { v, pc, r, c }; }
        });
        if (!best) { window.__step(20, 50); if (!res && !g.busy) res = { gano: false, usadas: g.av.usadas, titulo: 'trabado' }; continue; }
        g.place(best.pc, best.r, best.c);
        window.__step(2, 50);
      }
      return res || { gano: false, usadas: g.av.usadas, titulo: 'timeout' };
    };
  });
  await p.evaluate((l) => { window.__libre = l; }, process.argv[5] === 'libre');
  const out = [];
  for (let n = from; n <= to; n++) {
    const def = await p.evaluate((n) => { const g = window.__game; return null; }, n);
    const rs = [];
    for (let s = 0; s < seeds; s++) rs.push(await p.evaluate(([n, s]) => window.__jugar(n, s), [n, s]));
    const w = rs.filter((r) => r.gano);
    const us = w.map((r) => r.usadas).sort((a, b) => a - b);
    const info = await p.evaluate(() => { const d = window.__game.scene.getScene('Game').av.def; return [d.t, d.n, d.p0 || d.p]; });
    const med = us.length ? us[Math.floor(us.length / 2)] : 0;
    console.log(String(n + 1).padStart(2), info.join(' ').padEnd(16), `gana ${w.length}/${seeds}`, 'med', med, 'p/med', med ? (info[2] / med).toFixed(2) : '-', 'piezas', us.join(','), '|', rs.filter((r) => !r.gano).map((r) => r.titulo + '@' + r.usadas).join(' '));
  }
  if (errs.length) console.log('ERR', errs.slice(0, 5));
  await b.close();
})();
