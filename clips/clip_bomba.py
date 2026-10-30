"""Clips de los bloques peligrosos.
  python clip_bomba.py salva out/bomba_salva.mp4  -> la bomba llega a 1 y se desactiva justo a tiempo (con hielo que se agrieta)
  python clip_bomba.py boom  out/bomba_boom.mp4   -> no la limpias a tiempo: ¡BOOM! y se acaba la partida
"""
import sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render, big_center_text, to_video

MODO, OUT = sys.argv[1], sys.argv[2]
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
V = lambda n: [[i, 0] for i in range(n)]
SQ = [[0, 0], [0, 1], [1, 0], [1, 1]]

rec = Recorder({'bricks': 262, 'record': 9800, 'games': 22, 'built': ['casa', 'panaderia', 'pozo', 'herreria'],
                'muertos': {'flores': 58, 'tema': False}, 'oroVisto': True, 'peligros': {'bomba': True, 'hielo': True}})
rec.start_scene('Game')
M = {}


def bomba(r, c, n):
    rec.ev(f"() => {{ const g = {G}; const k = {r} * 8 + {c}; g.bombas[k] = {n}; g.pintarBomba(k); g.linesTotal = 12; g.nextOffer = 999; return 1; }}")


if MODO == 'salva':
    board = ['ro....yg',
             'p.g..b..',
             'rgob.Ipk',
             'g..k....',
             'pyB..gbr',
             'o.r.y...',
             '........',
             'k.y.....']
    trays = [[{'cells': H(3), 'color': 'orange'}, {'cells': V(2), 'color': 'blue'}, {'cells': SQ, 'color': 'green'}],
             [{'cells': H(2), 'color': 'pink'}, {'cells': [[0, 0]], 'color': 'yellow'}, {'cells': [[0, 0]], 'color': 'purple'}]]
    setup_board(rec, board, trays, score=3640)
    bomba(4, 2, 4)
    rec.step(2)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.5, visible=False)
    M['m1'] = len(rec.frames)
    drag(rec, f, 0, 6, 0, approach=0.3, travel=0.45, after=0.35)
    M['m2'] = len(rec.frames)
    drag(rec, f, 1, 2, 4, approach=0.3, travel=0.5, after=0.6)
    M['m3'] = len(rec.frames)
    drag(rec, f, 2, 6, 3, approach=0.3, travel=0.45, after=0.7)
    M['m4'] = len(rec.frames)
    drag(rec, f, 0, 4, 3, approach=0.35, travel=0.6, after=1.4)
    f.move(rec, 990, 1850, 0.3)
    M['fin'] = len(rec.frames)
    c = M['m4'] + 28
    segs = [(c, c + 42), (0, M['fin'])]
    subs = [
        (c, c + 42, '¡Desactivada con 1 jugada de sobra!', 0),
        (0, M['m2'], 'NUEVO: bloques BOMBA con cuenta regresiva', 1),
        (M['m2'], M['m3'], 'El HIELO necesita 2 líneas para romperse', 1),
        (M['m3'], M['m4'] + 18, 'Le queda 1 jugada… ¡o explota!', 1),
        (M['m4'] + 18, M['fin'], '¡Desactivada! +5 ladrillos', 1),
    ]
    hook = [[('¡CASI ', (255, 255, 255)), ('EXPLOTA', (255, 90, 80)), ('!', (255, 255, 255))],
            [('La nueva ', (255, 255, 255)), ('BOMBA', (255, 210, 60)), (' de Bloquevilla', (255, 255, 255))]]
else:
    board = ['k.ob.pgr',
             'gB.y..o.',
             'r.p.yb..',
             'ob......',
             '..g..p..',
             'y.......',
             'p...r...',
             'b.......']
    trays = [[{'cells': V(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': SQ, 'color': 'pink'}]]
    setup_board(rec, board, trays, score=4120)
    bomba(1, 1, 2)
    rec.step(2)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.4, visible=False)
    M['m1'] = len(rec.frames)
    drag(rec, f, 0, 4, 7, approach=0.3, travel=0.5, after=0.5)
    M['m2'] = len(rec.frames)
    drag(rec, f, 1, 7, 3, approach=0.3, travel=0.5, after=0.1)
    M['boom'] = len(rec.frames)
    rec.hold(2.9, None)
    M['fin'] = len(rec.frames)
    c = M['boom'] - 4
    segs = [(c, c + 40), (0, M['fin'])]
    subs = [
        (c, c + 40, 'Así se pierde en Bloquevilla…', 0),
        (0, M['m2'], 'La bomba marca 2: le quedan 2 jugadas', 1),
        (M['m2'], M['boom'], 'No limpié su línea a tiempo…', 1),
        (M['boom'], M['fin'], '¡BOOM! Partida terminada', 1),
    ]
    hook = [[('Si la bomba llega a ', (255, 255, 255)), ('0', (255, 90, 80)), ('…', (255, 255, 255))],
            [('¡PIERDES TODO!', (255, 210, 60))]]

print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
render(rec, OUT, hook, segs=segs, subs=subs)
rec.close()
print('listo', OUT)
