"""BQ-14: hielo. Voz: 2.24 | 2.08 | 1.56 | 1.71 | 1.92 | 1.96"""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render
from comun_bq import base, cortes, escena

OUT = sys.argv[1]
G = "window.__game.scene.getScene('Game')"
BOARD = ['..p.....', '..o.....', '..y.....', '..k.....', 'rgIybko.', '..b.....', '..r.....', '........']
ONE = lambda col: {'cells': [[0, 0]], 'color': col}
TRAYS = [[ONE('green'), ONE('blue'), ONE('orange')]]
rec = Recorder(base(aventura={'estrellas': [3] * 34, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}},
                    logros={'c': {'hielo': 99, 'lineas': 900, 'partidas': 120}, 'cobrados': {'lineas': 2, 'partidas': 2}}), query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 34 }); return 1; }")
rec.step(90)
setup_board(rec, BOARD, TRAYS, score=1640)
rec.ev(f"() => {{ const g = {G}; g.av.progreso = 1; g.av.usadas = 5; g.avPintar(); return 1; }}")
rec.step(2)
rec.begin()
M = {}
f = Finger(980, 1820)
M['tablero'] = len(rec.frames)
f.wait(rec, 0.8, visible=False)
M['m1'] = len(rec.frames)
drag(rec, f, 0, 4, 7, approach=0.35, travel=0.55, after=1.4)   # fila: el hielo se agrieta
M['m2'] = len(rec.frames)
drag(rec, f, 1, 7, 2, approach=0.35, travel=0.55, after=1.6)   # columna: se rompe
M['logros'] = len(rec.frames)
escena(rec, 'Logros')
f = Finger(980, 1820)
f.wait(rec, 0.6, visible=False)
f.move(rec, 540, 1100, 0.8)
f.wait(rec, 2.6)
M['fin'] = len(rec.frames)
print('estado', rec.ev("() => JSON.stringify(JSON.parse(localStorage.getItem('bloquevilla_v1')).logros)"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
segs = cortes([(M['m1'] + 22, 2.24), (M['tablero'], 2.08), (M['m1'] + 20, 1.56), (M['m2'] + 18, 1.71), (M['logros'], 1.92), (M['logros'] + 58, 1.96)])
render(rec, OUT, [[('LIMPIÉ LA FILA…', (255, 255, 255))], [('¿Y EL HIELO SIGUE AHÍ?', (120, 220, 255))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
