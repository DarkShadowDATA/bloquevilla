"""BQ-15: «Cómo se juega». Voz: 3.50 | 3.60 | 3.07 | 2.43 | 2.29 | 0.31"""
import sys
from cap import Recorder
from director import setup_board, Finger
from edit import render
from comun_bq import base, cortes, escena, celda, tap

OUT = sys.argv[1]
G = "window.__game.scene.getScene('Game')"
BOARD = ['........', '........', '..r..g..', '.bkoB.r.', '..y..p..', '........', '.gr..ob.', '........']
TRAYS = [[{'cells': [[0, 0], [0, 1]], 'color': 'blue'}, {'cells': [[0, 0]], 'color': 'green'}, {'cells': [[0, 0], [1, 0]], 'color': 'orange'}]]
rec = Recorder(base(guia={'vistos': ['basico']}), query='&evento=off')
escena(rec, 'Game', '{ nueva: true }')
rec.step(30)
setup_board(rec, BOARD, TRAYS, score=860)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.3, visible=False)
f.move(rec, *celda(3, 4), 0.7)
f.wait(rec, 0.8)
M['bomba'] = len(rec.frames)
rec.ev(f"() => {{ window.__lay = window.__guia({G}, 'bomba'); return 1; }}")
f.wait(rec, 9.0, visible=False)
rec.ev("() => { window.__lay.destroy(true); return 1; }")
M['jefe'] = len(rec.frames)
rec.ev(f"() => {{ window.__lay = window.__guia({G}, 'jefe'); return 1; }}")
f.wait(rec, 4.0, visible=False)
M['ajustes'] = len(rec.frames)
escena(rec, 'Menu')
f = Finger(980, 1820)
f.wait(rec, 0.4, visible=False)
f.move(rec, 960, 120, 0.4)
rec.ev("() => { const m = window.__game.scene.getScene('Menu'); m.children.list.filter((c) => c.type === 'Container' && c.x === 960 && c.y === 120)[0].emit('pointerdown'); return 1; }")
f.wait(rec, 0.6, pressed=True)
M['lista'] = len(rec.frames)
tap(rec, f, 325, 1220, travel=0.4, after=2.0)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
b = M['bomba']
segs = cortes([(b - 48, 3.50), (b + 57, 3.60), (b + 165, 3.07), (M['jefe'] + 8, 2.43), (M['ajustes'] + 6, 2.29), (M['lista'] + 40, 0.5)])
render(rec, OUT, [[('¿NO SABES QUÉ HACE…', (255, 255, 255))], [('ESTE BLOQUE?', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
