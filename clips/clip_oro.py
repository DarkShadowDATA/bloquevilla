"""Clip: el bloque DORADO. Primero uno (+3 ladrillos), luego una jugada con 4 de oro (+12)."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render, big_center_text, to_video

OUT = sys.argv[1] if len(sys.argv) > 1 else 'oro.mp4'
rnd = random.Random(5)
C = lambda: rnd.choice('robpkg')
rows = []
for r in range(8):
    if r == 2:
        row = ['.', '.', '.'] + [C() for _ in range(5)]
    elif r >= 5:
        row = [C() for _ in range(5)] + ['.', '.', '.']
    else:
        row = [C() if rnd.random() < 0.6 else '.' for _ in range(8)]
        if '.' not in row[:5]:
            row[1] = '.'
    rows.append(row)
rows[5][0] = 'G'; rows[6][2] = 'G'; rows[7][4] = 'G'
board = [''.join(r) for r in rows]
SQ = [[r, c] for r in range(3) for c in range(3)]
trays = [[{'cells': [[0, 0], [0, 1], [0, 2]], 'color': 'blue', 'gold': 1},
          {'cells': SQ, 'color': 'purple', 'gold': 4},
          {'cells': [[0, 0], [1, 0]], 'color': 'pink'}]]

rec = Recorder({'bricks': 188, 'record': 9800, 'games': 12, 'built': ['casa', 'panaderia', 'pozo'],
                'muertos': {'flores': 47, 'tema': False}, 'oroVisto': True})
rec.start_scene('Game')
setup_board(rec, board, trays, score=2310)
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.9, visible=False)
f.move(rec, 230, 1480, 0.4)
f.wait(rec, 0.5)            # se ve la pieza con su casilla de oro
drag(rec, f, 0, 2, 0, approach=0.2, travel=0.6, after=1.3)
marca = len(rec.frames)
drag(rec, f, 1, 5, 5, approach=0.35, travel=0.7, after=2.0)
fin = len(rec.frames)
f.move(rec, 990, 1850, 0.3)
rec.hold(0.6, None)
print('frames', len(rec.frames), 'errores', rec.errors)


def overlay(img, i):
    if marca - 12 <= i < marca + 10:
        big_center_text(img, '¿Y si son 4?', 110, (255, 225, 80), (i - marca + 12) / FPS, y=to_video(540, 330)[1] + 150)


render(rec, OUT, [[('¿Qué pasa si limpias', (255, 255, 255))], [('un bloque ', (255, 255, 255)), ('DORADO', (255, 210, 60)), ('?', (255, 255, 255))]], overlay)
rec.close()
print('listo', OUT)
