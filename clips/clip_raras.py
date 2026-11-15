"""BQ-13: piezas raras. Voz: 2.54 | 2.15 | 1.93 | 2.52 | 2.62 | 2.15"""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render
from comun_bq import base, cortes

OUT = sys.argv[1]
G = "window.__game.scene.getScene('Game')"
BOARD = ['........', '...r...k', 'g.....o.', '.....b..', 'rgb.ykop', 'p..k..b.', 'okrgy.bp', '..y..r..']
TRAYS = [[{'cells': [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], 'color': 'purple'},
          {'cells': [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], 'color': 'orange'},
          {'cells': [[0, 0], [1, 1], [2, 2]], 'color': 'green'}]]
rec = Recorder(base(aventura={'estrellas': [3] * 40, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}}), query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 40 }); return 1; }")
rec.step(90)
setup_board(rec, BOARD, TRAYS, score=2210)
rec.ev(f"() => {{ const g = {G}; g.av.progreso = 6; g.av.usadas = 9; g.avPintar(); return 1; }}")
rec.step(2)
rec.begin()
M = {}
f = Finger(980, 1820)
M['tablero'] = len(rec.frames)
f.wait(rec, 0.5, visible=False)
f.move(rec, 860, 1520, 0.6)                    # señala la diagonal en la bandeja
f.wait(rec, 1.2)
M['m1'] = len(rec.frames)
drag(rec, f, 0, 0, 0, approach=0.3, travel=0.4, after=0.15)   # cruz
M['m2'] = len(rec.frames)
drag(rec, f, 1, 0, 4, approach=0.3, travel=0.4, after=0.9)    # U: completa la fila 1
M['m3'] = len(rec.frames)
drag(rec, f, 2, 4, 3, approach=0.35, travel=2.3, after=2.6)   # diagonal, despacio: 2 líneas
M['fin'] = len(rec.frames)
print('estado', rec.ev(f"() => {{ const g = {G}; return JSON.stringify([g.av.progreso, g.combo]); }}"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
drop = M['m3'] + 79   # ~ cuando suelta la diagonal
segs = cortes([(drop - 40, 2.54), (M['tablero'] + 10, 2.15), (M['m1'] + 6, 1.93), (M['m3'] + 6, 2.52), (drop - 10, 2.62), (drop + 69, 2.15)])
render(rec, OUT, [[('ME SALIÓ ESTA PIEZA…', (255, 255, 255))], [('¿DÓNDE LA PONGO?', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
