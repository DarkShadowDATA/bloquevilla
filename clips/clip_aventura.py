"""Clip: Modo Aventura. Mapa con 19 niveles superados -> nivel 20 (4 bombas) -> 2 jugadas desactivan
2 bombas cada una -> 3 estrellas. Cold open: las 3 estrellas saliendo."""
import sys
from cap import Recorder, FPS
from director import Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'aventura.mp4'
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
EST = [3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3]
TRAYS = [[{'cells': H(2), 'color': 'orange'}, {'cells': H(2), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
         [{'cells': H(2), 'color': 'green'}, {'cells': [[0, 0], [1, 0]], 'color': 'purple'}, {'cells': [[0, 0]], 'color': 'yellow'}]]


def tap(rec, f, x, y, travel=0.4, after=0.5):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


rec = Recorder({'bricks': 640, 'record': 9800, 'games': 40, 'built': ['casa', 'panaderia', 'pozo', 'herreria'],
                'oroVisto': True, 'peligros': {'bomba': True, 'hielo': True}, 'aventura': {'estrellas': EST}}, query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Aventura'); return 1; }")
rec.step(3)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.wait(rec, 0.5)
M['nivel'] = len(rec.frames)
tap(rec, f, 781, 600, travel=0.45, after=0.6)       # nivel 20
M['popup'] = len(rec.frames)
tap(rec, f, 540, 1215, travel=0.4, after=0.2)        # Jugar
rec.step(2)
# mismas bombas del nivel; solo se eligen las piezas
rec.ev(f"""(trays) => {{ const g = {G}; g.trayQueue = trays;
  g.newTray = function (animate) {{ this.pieces.forEach((p) => p.c && p.c.destroy());
    const defs = this.trayQueue.length ? this.trayQueue.shift() : [{{cells:[[0,0]],color:'red'}},{{cells:[[0,0]],color:'blue'}},{{cells:[[0,0]],color:'green'}}];
    this.pieces = defs.map((d, i) => this.makePiece(d, i, animate)); }};
  g.newTray(false); if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}""", TRAYS)
M['juego'] = len(rec.frames)
f.wait(rec, 0.6)
for i, (slot, r, c) in enumerate([(0, 0, 2), (1, 0, 5), (2, 7, 1), (0, 7, 5)]):
    M[f'd{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.28, travel=0.42, after=0.55 if i in (1, 3) else 0.15)
M['gano'] = len(rec.frames)
f.move(rec, 990, 1850, 0.3)
rec.hold(2.6, None)
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
print('estrellas', rec.ev("() => JSON.parse(localStorage.getItem('bloquevilla_v1')).aventura.estrellas[19]"))

c = M['gano'] + 30
segs = [(c, c + 48), (0, M['fin'])]
subs = [
    (c, c + 48, '¡Nivel 20 con 3 estrellas!', 0),
    (0, M['popup'], 'Mi juego ya tiene MODO AVENTURA', 1),
    (M['popup'], M['juego'], '20 niveles con objetivo y piezas contadas', 1),
    (M['juego'], M['d1'] + 14, 'Nivel 20: desactiva 4 bombas', 1),
    (M['d1'] + 14, M['gano'], '¡2 bombas de un solo golpe!', 1),
    (M['gano'], M['fin'], 'Sobran piezas = más estrellas. ¿Cuántas sacas tú?', 1),
]
render(rec, OUT, [[('¿Pasarías el ', (255, 255, 255)), ('NIVEL 20', (255, 217, 61)), ('?', (255, 255, 255))],
                  [('4 bombas y piezas contadas', (255, 255, 255))]], segs=segs, subs=subs)
rec.close()
print('listo', OUT)
