"""BQ-16: tres idiomas. Voz: 2.34 | 2.00 | 2.22 | 1.93 | 2.51 | 2.32"""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render
from comun_bq import base, cortes, escena, tap

OUT = sys.argv[1]
G = "window.__game.scene.getScene('Game')"
ENGRANE = "() => { const m = window.__game.scene.getScene('Menu'); m.children.list.filter((c) => c.type === 'Container' && c.x === 960 && c.y === 120)[0].emit('pointerdown'); return 1; }"
BOARD = ['........', '.r....p.', '........', '..g..o..', '........', '.b....k.', 'rgb..ykp', 'oyk..rgb']
TRAYS = [[{'cells': [[0, 0], [0, 1], [1, 0], [1, 1]], 'color': 'purple'}, {'cells': [[0, 0]], 'color': 'green'}, {'cells': [[0, 0], [0, 1]], 'color': 'blue'}]]
rec = Recorder(base(), query='&evento=off')
rec.begin()
M = {}
f = Finger(980, 1820)
M['es'] = len(rec.frames)
f.wait(rec, 0.8, visible=False)
f.move(rec, 960, 120, 0.35)
rec.ev(ENGRANE)
f.wait(rec, 0.7, pressed=True)
M['aj_en'] = len(rec.frames)
tap(rec, f, 676, 1080, travel=0.4, after=0.2)          # English
rec.step(2)
M['en'] = len(rec.frames)
f.wait(rec, 1.2)
f.move(rec, 960, 120, 0.35)
rec.ev(ENGRANE)
f.wait(rec, 0.7, pressed=True)
M['aj_pt'] = len(rec.frames)
tap(rec, f, 872, 1080, travel=0.4, after=0.2)          # Português
rec.step(2)
M['pt'] = len(rec.frames)
f.wait(rec, 2.6)
M['juego'] = len(rec.frames)
escena(rec, 'Game', '{ nueva: true }')
rec.step(30)
setup_board(rec, BOARD, TRAYS, score=3120)
f = Finger(980, 1820)
f.wait(rec, 0.2)
M['combo'] = len(rec.frames)
drag(rec, f, 0, 6, 3, approach=0.3, travel=0.45, after=1.6)
M['over'] = len(rec.frames)
rec.ev(f"() => {{ {G}.gameOver(); return 1; }}")
f.wait(rec, 5.0, visible=False)
print('idioma', rec.ev("() => JSON.parse(localStorage.getItem('bloquevilla_v1')).idioma"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
segs = cortes([(M['combo'] + 14, 2.34), (M['es'] + 4, 0.6), (M['en'] + 2, 0.7), (M['pt'] + 2, 0.7), (M['pt'] + 23, 2.22),
               (M['aj_pt'] - 20, 1.93), (M['over'] + 30, 2.51), (M['over'] + 105, 2.32)])
render(rec, OUT, [[('MI JUEGO AHORA HABLA…', (255, 255, 255))], [('¡3 IDIOMAS!', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
