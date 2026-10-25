"""Clip del evento Día de Muertos: menú con el letrero, partida con pétalos y flores hasta desbloquear el tema, pueblo de noche."""
import random, sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'muertos.mp4'
rnd = random.Random(4)
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
H = lambda n: [[0, i] for i in range(n)]
trays = [
    [{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
    [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}],
    [{'cells': [[0, 0]], 'color': 'red'}, {'cells': [[0, 0]], 'color': 'blue'}, {'cells': [[0, 0]], 'color': 'yellow'}],
]
rec = Recorder({'bricks': 260, 'record': 3200, 'games': 8, 'built': ['casa', 'panaderia', 'pozo', 'herreria'],
                'muertos': {'flores': 55, 'tema': False}}, query='&evento=on')
rec.ev("() => { const s = window.__game.scene.getScenes(true)[0]; s.scene.start('Menu'); return 1; }")
rec.step(3)
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 1.6, visible=False)
f.move(rec, 540, 1080, 0.45)
f.wait(rec, 0.1, pressed=True)
rec.ev("() => { const s = window.__game.scene.getScene('Menu'); s.scene.start('Game', { reto: false }); return 1; }")
rec.step(1)
setup_board(rec, board, trays, score=2140)
f.wait(rec, 0.5)
moves = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4), (2, 1, 5)]
for i, (slot, r, c) in enumerate(moves):
    drag(rec, f, slot, r, c, approach=0.3, after=0.45 if i != 4 else 1.4)
f.wait(rec, 1.2)
rec.ev("() => { const s = window.__game.scene.getScene('Game'); s.scene.start('Village'); return 1; }")
rec.step(1)
rec.ev("() => { const s = window.__game.scene.getScene('Village'); if (s._toast) { s._toast.destroy(); s._toast = null; } return 1; }")
f.move(rec, 990, 1850, 0.3)
rec.hold(2.6, None)
print('frames', len(rec.frames), 'errores', rec.errors)
render(rec, OUT, [[('Bloquevilla se puso', (255, 255, 255))], [('de ', (255, 255, 255)), ('DÍA DE MUERTOS', (255, 154, 31))]])
rec.close()
print('listo', OUT)
