"""Clip 1: combo que escala hasta x7 y deja el tablero limpio."""
import random, sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'combo_x7.mp4'
rnd = random.Random(4)
# huecos por fila (columnas vacías); cada jugada llena uno y limpia la fila
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
board = []
for r in range(8):
    board.append(''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)))

H = lambda n: [[0, i] for i in range(n)]
trays = [
    [{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
    [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}],
    [{'cells': [[0, 0], [0, 1], [1, 0], [1, 1]], 'color': 'yellow'}, {'cells': [[0, 0]], 'color': 'blue'}, {'cells': [[0, 0], [1, 0], [1, 1]], 'color': 'pink'}],
]

rec = Recorder({'bricks': 140, 'record': 9800})
rec.start_scene('Game')
setup_board(rec, board, trays, score=1840)
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.5, visible=False)
# (bandeja, fila, columna) de cada jugada
moves = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4), (2, 1, 5), (0, 3, 3)]
for i, (slot, r, c) in enumerate(moves):
    drag(rec, f, slot, r, c, approach=0.32 if i else 0.4, after=0.5 if (i + 1) % 3 else 0.75)
f.move(rec, 990, 1850, 0.4)
rec.hold(1.6, None)
print('frames', len(rec.frames), 'errores', rec.errors)
render(rec, OUT, [[('¿Hasta qué ', (255, 255, 255)), ('COMBO', (255, 217, 61))], [('llegas tú?', (255, 255, 255))]])
rec.close()
print('listo', OUT)
