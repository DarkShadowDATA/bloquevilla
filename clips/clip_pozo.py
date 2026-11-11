"""Clip: Pozo de la semana (premios en Shadow retirable para el top 5). BQ-04, con voz (skill voz-reels).
Pantalla del Pozo (premios + ranking de muestra) -> Jugar -> partida real del Pozo (jugadas elegidas por un ayudante que
busca líneas) -> el servidor local revisa la partida y da el puntaje. Cold open: la mejor jugada de la partida.
Necesita el servidor local de prueba del estudio (repo de Mutantes, DEV_AUTH) en http://127.0.0.1:3900.
El ranking que se ve es de muestra (nombres inventados): nunca se graban cuentas reales."""
import json, sys, time, functools
print = functools.partial(print, flush=True)
from cap import Recorder, FPS
from director import Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'pozo.mp4'
API = 'http://127.0.0.1:3900'
G = "window.__game.scene.getScene('Game')"
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
MUESTRA = [('Lupita_Bloques', 2140), ('ElConstructor', 1875), ('Tetra_MX', 1320), ('Vale22', 980), ('DonLadrillo', 760), ('Mari', 590), ('Chuy', 410)]
MEJOR = 627


def tabla(mio):
    filas = sorted(MUESTRA + [('Alex', mio)], key=lambda x: -x[1])
    top = [{'rank': i + 1, 'name': n, 'score': s, 'me': n == 'Alex'} for i, (n, s) in enumerate(filas)]
    return top, next(t['rank'] for t in top if t['me'])


def ruta_pozo(route):
    if route.request.method == 'OPTIONS':
        route.fulfill(status=204, headers=CORS); return
    top, rank = tabla(MEJOR)
    route.fulfill(json={'week': '2026-S46', 'endsAt': '2026-11-16T06:00:00Z', 'prizes': [21, 12, 7, 5, 5], 'best': MEJOR, 'rank': rank,
                        'attemptsLeft': 3, 'top': top}, headers=CORS)


def ruta_fin(route):
    if route.request.method == 'OPTIONS':
        route.continue_(); return
    r = route.fetch(); d = r.json()
    if d.get('ok'):
        d['rank'] = tabla(d['score'])[1]; d['record'] = d['score'] > MEJOR
    route.fulfill(response=r, json=d)


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


# Elige la jugada: primero la que limpia más líneas; si no, la que deja el tablero más compacto.
MEJOR_JUGADA = """() => {
  const g = %s, pz = g.pz, N = 8; let best = null;
  pz.tray.forEach((p, slot) => {
    if (p.used) return;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!p.cells.every(([dr, dc]) => r + dr < N && c + dc < N && !pz.board[r + dr][c + dc])) continue;
      const b = pz.board.map((x) => x.map((v) => (v ? 1 : 0)));
      p.cells.forEach(([dr, dc]) => { b[r + dr][c + dc] = 1; });
      let lines = 0, adj = 0;
      for (let i = 0; i < N; i++) { if (b[i].every((v) => v)) lines++; if (b.every((row) => row[i])) lines++; }
      p.cells.forEach(([dr, dc]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, e]) => {
        const rr = r + dr + a, cc = c + dc + e;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N || pz.board[rr][cc]) adj++;
      }));
      let casi = 0;
      for (let i = 0; i < N; i++) { const fr = b[i].reduce((a, v) => a + v, 0), fc = b.reduce((a, row) => a + row[i], 0); if (fr >= 6) casi += fr; if (fc >= 6) casi += fc; }
      const s = lines * 1000 + adj * 3 + casi + p.cells.length;
      if (!best || s > best.s) best = { s, slot, r, c, lines };
    }
  });
  return best;
}""" % G

rec = Recorder({'bricks': 412, 'record': 9800, 'games': 40, 'built': ['casa', 'panaderia', 'pozo', 'herreria'], 'oroVisto': True, 'apodo': 'Alex',
                'daily': {'last': '2026-11-10', 'streak': 2}, 'reto': {'last': '2026-11-10', 'racha': 3}, 'tiempo': {'record': 5200, 'partidas': 3},
                'tienda': {'temas': [], 'deco': [], 'visto': True}, 'misionesVistas': True},
               query=f'&evento=off&fecha=2026-11-10&devapi={API}&devname=Alex')
rec.page.route('**/api/pozo/bloquevilla', ruta_pozo)
rec.page.route('**/api/pozo/bloquevilla/finish', ruta_fin)
for _ in range(80):
    if rec.ev("() => !!(window.__nube && window.__nube.on)"):
        break
    time.sleep(0.25); rec.step(1)
print('nube', rec.ev("() => !!(window.__nube && window.__nube.on)"))
rec.ev("() => { window.__game.scene.getScene('Menu').scene.start('Pozo'); return 1; }")
for _ in range(40):
    time.sleep(0.15); rec.step(2)
print('pozo abierto'); rec.begin()
M = {}
f = Finger(980, 1840)
f.wait(rec, 0.1, visible=False)
M['pozo'] = len(rec.frames)
f.wait(rec, 5.2)
M['jugar'] = len(rec.frames)
tap(rec, f, 540, 1520, after=0.1)
for _ in range(80):
    if rec.scene_active('Game'):
        break
    time.sleep(0.2); rec.step(1)
rec.step(6)
M['juego'] = len(rec.frames); print('en juego', M)
f.wait(rec, 0.4)
jugadas = []
for i in range(46):
    m = rec.ev(MEJOR_JUGADA)
    if not m or rec.ev(f"() => {G}.over"):
        break
    jugadas.append((len(rec.frames), m['lines'])); print('jugada', i, m)
    drag(rec, f, m['slot'], m['r'], m['c'], approach=0.2, travel=0.3, after=0.5 if m['lines'] else 0.16)
M['fin'] = len(rec.frames)
rec.ev(f"() => {{ const g = {G}; if (!g.over) g.finPozo(); return 1; }}")
for _ in range(60):
    time.sleep(0.2); rec.grab(None)
    if rec.ev(f"() => {{ const g = {G}; return g.children.list.some((o) => o.text && /esta semana|Partida registrada|No se pudo/.test(o.text)); }}"):
        break
M['resultado'] = len(rec.frames)
rec.hold(4.0)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
print('jugadas', jugadas)
print('puntos', rec.ev(f"() => {G}.pz.score"))
json.dump({'M': M, 'jugadas': jugadas}, open(OUT.replace('.mp4', '.json'), 'w'))

# Partes: mejor jugada (cold open) -> pantalla del Pozo -> tramo de partida -> resultado. Duraciones a la medida de la voz (BQ-04).
con = [(a, n) for a, n in jugadas if n and a > M['juego'] + 60]
c = max(con, key=lambda x: (x[1], x[0]))[0] if con else M['fin'] - 120
segs = [(c - 6, c + 78),                                  # 2.8 s: «Mi juego de bloques ahora reparte premios…»
        (M['pozo'], M['pozo'] + 150),                     # 5.0 s: premios y ranking
        (M['jugar'] - 12, M['jugar'] + 20),               # ~1 s: toca «Jugar»
        (M['fin'] - 105, M['fin']),                       # 3.5 s: partida
        (M['resultado'] - 4, M['resultado'] + 100)]       # 3.4 s: resultado
render(rec, OUT, [[('El Pozo de la semana', (255, 255, 255))], [('¿LLEGAS AL TOP 5?', (255, 217, 61))]], segs=segs, subs=None, end_seconds=3.4)
rec.close()
print('listo', OUT)
