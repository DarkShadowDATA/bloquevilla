"""Clip: "Mi amigo me retó con las mismas piezas". Reto por link, lo superas en pleno combo y le regresas el reto."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'reta_amigo.mp4'
G = "window.__game.scene.getScene('Game')"
rnd = random.Random(4)
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
H = lambda n: [[0, i] for i in range(n)]
trays = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
         [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}]]

rec = Recorder({'bricks': 240, 'record': 9800, 'games': 30, 'built': ['casa', 'panaderia', 'pozo', 'herreria'],
                'oroVisto': True, 'apodo': 'Alex', 'peligros': {'bomba': True, 'hielo': True}}, query='&evento=off')
rec.ev(f"() => {{ window.__game.scene.getScenes(true)[0].scene.start('Game', {{ reto: false, vs: {{ s: 424242, p: 2340, n: 'Juan', m: null }} }}); return 1; }}")
rec.step(3)
setup_board(rec, board, trays, score=2120)
rec.ev(f"() => {{ const g = {G}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
rec.step(2)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 1.3, visible=False)
moves = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0)]
for i, (slot, r, c) in enumerate(moves):
    M[f'm{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.3, travel=0.5, after=0.4 if i != 1 else 1.0)
f.move(rec, 990, 1850, 0.3)
M['fin_juego'] = len(rec.frames)
rec.ev(f"() => {{ {G}.gameOver(); return 1; }}")
rec.hold(1.6, None)
M['resumen'] = len(rec.frames)
f = Finger(900, 1700)
f.move(rec, 540, 900 * 0 + 900 + 205, 0.45)   # botón "Regresarle el reto"
f.wait(rec, 0.15, pressed=True)
f.wait(rec, 0.9)
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

c = M['m1'] + 24
segs = [(c, c + 42), (0, M['fin'])]
subs = [
    (c, c + 42, '¡Lo superé con las mismas piezas!', 0),
    (0, M['m1'], 'Juan me retó por WhatsApp: hizo 2,340', 1),
    (M['m1'], M['m2'], 'Mismas piezas que él… ¡a superarlo!', 1),
    (M['m2'], M['resumen'], '¡Ya le gané!', 1),
    (M['resumen'], M['fin'], 'Ahora le regreso el reto. ¿Tú a quién retas?', 1),
]
render(rec, OUT, [[('Mi amigo me ', (255, 255, 255)), ('RETÓ', (255, 217, 61))],
                  [('con las MISMAS piezas…', (255, 255, 255))]], segs=segs, subs=subs)
rec.close()
print('listo', OUT)
