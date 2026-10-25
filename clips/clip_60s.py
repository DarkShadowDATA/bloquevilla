"""Clips del modo Contrarreloj.
  python clip_60s.py reto out/contrarreloj.mp4      -> "¿Cuántos puntos haces en 60 s?" (inicio, salto, final con récord)
  python clip_60s.py segundo out/ultimo_segundo.mp4  -> "Me quedaba 1 segundo…" (una jugada de 3 líneas lo salva)
"""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render, big_center_text, to_video
from PIL import ImageDraw

MODO, OUT = sys.argv[1], sys.argv[2]
H = lambda n: [[0, i] for i in range(n)]
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}


def tablero(seed):
    rnd = random.Random(seed)
    return [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]


TRAYS = [
    [{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
    [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}],
]
MOVES = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4), (2, 1, 5)]

rec = Recorder({'bricks': 236, 'record': 9800, 'games': 14, 'built': ['casa', 'panaderia', 'pozo'],
                'muertos': {'flores': 41, 'tema': False}, 'tiempo': {'record': 5480, 'partidas': 6}})
rec.ev("() => { const s = window.__game.scene.getScenes(true)[0]; s.scene.start('Game', { reto: false, modo: 'tiempo' }); return 1; }")
rec.step(3)
G = "window.__game.scene.getScene('Game')"
marks = {}


def hasta_fin(max_s=7):
    for _ in range(int(max_s * FPS)):
        if rec.ev(f"() => {G}.over"):
            break
        rec.grab(None)


if MODO == 'reto':
    setup_board(rec, tablero(4), [TRAYS[0], TRAYS[1]], score=0)
    rec.ev(f"() => {{ {G}.drawTimer(); return 1; }}")
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.1, visible=False)
    for i, (slot, r, c) in enumerate(MOVES[:3]):
        if i == 1:
            marks['linea'] = len(rec.frames)
        drag(rec, f, slot, r, c, approach=0.28 if i else 0.3, travel=0.45, after=0.3 if i < 2 else 0.45)
    # salto en el tiempo
    marks['salto'] = len(rec.frames)
    rec.ev(f"() => {{ const g = {G}; g.tiempoRest = 2100; g.drawTimer(); return 1; }}")
    setup_board(rec, tablero(9), [TRAYS[0]], score=5160)
    rec.hold(0.6, None)
    marks['salto_fin'] = len(rec.frames)
    f = Finger(980, 1820)
    for i, (slot, r, c) in enumerate(MOVES[:3]):
        marks[f'd{i}'] = len(rec.frames)
        drag(rec, f, slot, r, c, approach=0.25, travel=0.4, after=0.25)
    f.move(rec, 990, 1850, 0.3)
    hasta_fin()
    marks['fin'] = len(rec.frames)
    rec.hold(1.4, None)
    hook = [[('¿Cuántos puntos haces', (255, 255, 255))], [('en ', (255, 255, 255)), ('60 SEGUNDOS', (255, 217, 61)), ('?', (255, 255, 255))]]
else:
    rnd = random.Random(21)
    tb = []
    for r in range(8):
        if r >= 5:
            tb.append('.' + ''.join(rnd.choice('roygbpk') for _ in range(7)))
        else:
            tb.append(''.join(rnd.choice('roygbpk') if rnd.random() < 0.55 else '.' for _ in range(8))[:7] + '.')
    V3 = [[0, 0], [1, 0], [2, 0]]
    tray = [{'cells': H(2), 'color': 'blue'}, {'cells': V3, 'color': 'orange'}, {'cells': [[0, 0]], 'color': 'pink'}]
    setup_board(rec, tb, [tray], score=5310)
    rec.ev(f"() => {{ const g = {G}; g.arrancarTiempo(); g.tiempoRest = 1700; g.combo = 2; g.updateComboText(); g.drawTimer(); return 1; }}")
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.2, visible=False)
    marks['uno'] = len(rec.frames) + 15
    drag(rec, f, 1, 5, 0, approach=0.35, travel=0.55, after=0.0)
    marks['uno_fin'] = len(rec.frames)
    f.wait(rec, 1.2)
    f.move(rec, 990, 1850, 0.3)
    hasta_fin(8)
    marks['fin'] = len(rec.frames)
    rec.hold(1.5, None)
    hook = [[('Me quedaba ', (255, 255, 255)), ('1 SEGUNDO', (255, 110, 110)), ('…', (255, 255, 255))]]

print('frames', len(rec.frames), 'marcas', marks, 'errores', rec.errors)


def overlay(img, i):
    if MODO == 'reto' and marks['salto'] <= i < marks['salto_fin']:
        d = ImageDraw.Draw(img)
        d.rectangle([0, 300, 1080, 1920], fill=None)
        big_center_text(img, '50 s después…', 110, (255, 255, 255), (i - marks['salto']) / FPS, y=to_video(540, 860)[1])
    if MODO == 'segundo' and marks['uno'] <= i < marks['uno_fin']:
        big_center_text(img, '¡1 SEGUNDO!', 120, (255, 110, 110), (i - marks['uno']) / FPS, y=to_video(540, 330)[1] + 140)


fin = len(rec.frames)
if MODO == 'reto':
    c = marks['d2'] + 23
    segs = [(c, c + 45), (0, fin)]
    subs = [
        (c, c + 45, '¡Combo x6 con el reloj en rojo!', 0),
        (0, marks['linea'], 'Modo Contrarreloj: tienes 60 segundos', 1),
        (marks['linea'], marks['salto'], 'Cada línea te suma +1 segundo', 1),
        (marks['salto_fin'], marks['fin'], 'Últimos segundos: ¡a combear!', 1),
        (marks['fin'], fin, '¡Nuevo récord! ¿Cuánto haces tú?', 1),
    ]
else:
    c = marks['uno_fin'] - 3
    segs = [(c, c + 40), (0, fin)]
    subs = [
        (c, c + 40, '¡4 líneas con 1 segundo en el reloj!', 0),
        (0, marks['uno_fin'], 'Me quedaba 1 segundo…', 1),
        (marks['uno_fin'], marks['fin'], '+4 segundos y combo x3', 1),
        (marks['fin'], fin, '¡Y nuevo récord!', 1),
    ]
render(rec, OUT, hook, overlay, segs=segs, subs=subs)
rec.close()
print('listo', OUT)
