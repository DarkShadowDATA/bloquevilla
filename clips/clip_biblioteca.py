"""BQ-19: bonos del castillo (Biblioteca y Mina). Voz: 2.65 | 2.37 | 2.17 | 3.08 | 2.04 | 2.27"""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render
from comun_bq import base, cortes, escena, tap, celda

OUT = sys.argv[1]
G = "window.__game.scene.getScene('Game')"
TODOS = 'casa,panaderia,pozo,herreria,torre,plaza,muelle,barca,pescaderia,faro,astillero,mercado,granja,molino,biblioteca,mina'.split(',')
BOARD = ['........', '..r.....', '........', '.....p..', 'rGbyGko.', '........', '..g..b..', '........']
TRAYS = [[{'cells': [[0, 0]], 'color': 'green'}, {'cells': [[0, 0], [1, 0]], 'color': 'blue'}, {'cells': [[0, 0], [0, 1]], 'color': 'orange'}]]
rec = Recorder(base(bricks=380, built=TODOS, tienda={'temas': [], 'deco': ['arboles', 'farolas', 'flores', 'banderines', 'fuente'], 'visto': True}), query='&evento=off')
rec.begin()
M = {}
f = Finger(980, 1820)
M['pueblo'] = len(rec.frames)
escena(rec, 'Village', '{ zona: 3 }')
f.wait(rec, 0.8, visible=False)
M['biblio'] = len(rec.frames)
tap(rec, f, 165, 1080, travel=0.5, after=2.0)
M['mina'] = len(rec.frames)
tap(rec, f, 536, 1080, travel=0.4, after=2.2)
f.wait(rec, 1.5, visible=False)
M['juego'] = len(rec.frames)
escena(rec, 'Game', '{ nueva: true }')
rec.step(30)
print('poderes', rec.ev(f"() => JSON.stringify({G}.powers)"))
setup_board(rec, BOARD, TRAYS, score=640)
rec.ev(f"() => {{ const g = {G}; g.powers = ['martillo']; g.renderPowers(); return 1; }}")
f = Finger(980, 1820)
f.wait(rec, 0.5)
M['martillo'] = len(rec.frames)
tap(rec, f, 320, 1785, travel=0.45, after=0.3)          # toma el martillo
tap(rec, f, *celda(1, 2), travel=0.5, after=1.2)        # rompe el bloque suelto
M['oro'] = len(rec.frames)
drag(rec, f, 0, 4, 7, approach=0.3, travel=0.5, after=2.2)   # fila con 2 bloques dorados
print('estado', rec.ev(f"() => JSON.stringify([{G}.board[1][2], {G}.score])"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
segs = cortes([(M['martillo'] + 10, 2.65), (M['biblio'] + 6, 2.37), (M['martillo'] + 28, 2.17), (M['mina'] + 6, 1.4), (M['oro'] + 14, 1.68),
               (M['pueblo'] + 2, 2.04), (M['oro'] + 64, 2.27)])
render(rec, OUT, [[('ESTE EDIFICIO…', (255, 255, 255))], [('¡ME REGALA UN MARTILLO!', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
