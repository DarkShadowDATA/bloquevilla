"""BQ-12: huecos. Voz: 2.38 | 1.88 | 1.55 | 2.75 | 1.94 | 1.83"""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render
from comun_bq import base, cortes, celda

OUT = sys.argv[1]
G = "window.__game.scene.getScene('Game')"
BOARD = ['..p.....', '..o.....', 'rg#yb#o.', '..k.....', '..b.....', '..#..#..', '..r.....', '........']
ONE = lambda col: {'cells': [[0, 0]], 'color': col}
TRAYS = [[ONE('green'), ONE('blue'), {'cells': [[0, 0], [0, 1]], 'color': 'orange'}]]
rec = Recorder(base(aventura={'estrellas': [3] * 32, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}}), query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 32 }); return 1; }")
rec.step(90)
setup_board(rec, BOARD, TRAYS, score=1840)
rec.ev(f"() => {{ const g = {G}; g.av.progreso = 3; g.av.usadas = 6; g.avPintar(); return 1; }}")
rec.step(2)
rec.begin()
M = {}
f = Finger(980, 1820)
M['tablero'] = len(rec.frames)
f.wait(rec, 0.6, visible=False)
f.move(rec, *celda(5, 5), 0.6)                # señala el hueco
f.wait(rec, 0.6)
M['falla'] = len(rec.frames)
drag(rec, f, 0, 5, 5, approach=0.35, travel=0.5, after=0.6)   # no cabe: regresa
M['m1'] = len(rec.frames)
drag(rec, f, 0, 2, 7, approach=0.35, travel=0.55, after=1.6)  # fila 2 con 2 huecos: se limpia
M['m2'] = len(rec.frames)
drag(rec, f, 1, 7, 2, approach=0.35, travel=0.55, after=2.4)  # columna 2 con 2 huecos
M['fin'] = len(rec.frames)
print('estado', rec.ev(f"() => {{ const g = {G}; return JSON.stringify([g.av.progreso, g.board[2][2], g.board[5][2]]); }}"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
segs = cortes([(M['m1'] + 14, 2.38), (M['tablero'], 1.88), (M['falla'] + 4, 1.55), (M['m1'] + 2, 2.75), (M['m2'] + 8, 1.94), (M['m2'] + 8 + 58, 1.83)])
render(rec, OUT, [[('ESTA FILA TIENE UN HOYO…', (255, 255, 255))], [('¿SE PUEDE LIMPIAR?', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
