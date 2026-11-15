"""BQ-17: Mis estadísticas. Voz: 2.13 | 2.00 | 3.00 | 2.12 | 2.00 | 1.89"""
import sys
from cap import Recorder
from director import Finger
from edit import render
from comun_bq import base, cortes, escena, tap

OUT = sys.argv[1]
TODOS = 'casa,panaderia,pozo,herreria,torre,plaza,muelle,barca,pescaderia,faro,astillero,mercado,granja,molino,biblioteca'.split(',')
rec = Recorder(base(games=412, record=14280, built=TODOS, tiempo={'record': 5120}, reto={'racha': 12},
                    stats={'seg': 45640, 'piezas': 18420},
                    logros={'c': {'lineas': 6240, 'combo': 9, 'oro': 410, 'bombas': 132, 'hielo': 260, 'cofres': 41, 'partidas': 412, 'puntos': 14280},
                            'cobrados': {'lineas': 3, 'oro': 2, 'bombas': 3, 'hielo': 3, 'partidas': 3, 'puntos': 2, 'combo': 2, 'edificios': 2, 'estrellas': 2, 'cofres': 2}},
                    aventura={'estrellas': [3] * 44 + [2] * 4}), query='&evento=off')
rec.begin()
M = {}
f = Finger(980, 1820)
M['menu'] = len(rec.frames)
f.wait(rec, 0.4, visible=False)
f.move(rec, 960, 120, 0.4)
rec.ev("() => { const m = window.__game.scene.getScene('Menu'); m.children.list.filter((c) => c.type === 'Container' && c.x === 960 && c.y === 120)[0].emit('pointerdown'); return 1; }")
f.wait(rec, 0.6, pressed=True)
tap(rec, f, 755, 1220, travel=0.4, after=0.1)
M['stats'] = len(rec.frames)
f.wait(rec, 0.5)
for x, y in [(279, 396), (801, 396), (279, 632), (801, 514)]:     # partidas, mejor puntaje, líneas, mejor combo
    f.move(rec, x, y, 0.35)
    f.wait(rec, 0.4)
M['bombas'] = len(rec.frames)
for x, y in [(279, 934), (279, 1236)]:                           # bombas, jefes
    f.move(rec, x, y, 0.4)
    f.wait(rec, 0.6)
M['tiempo'] = len(rec.frames)
f.move(rec, 279, 750, 0.4)
f.wait(rec, 1.6)
M['tabs'] = len(rec.frames)
tap(rec, f, 310, 205, travel=0.4, after=0.8)
tap(rec, f, 600, 205, travel=0.3, after=0.8)
M['vuelta'] = len(rec.frames)
tap(rec, f, 890, 205, travel=0.3, after=2.4)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
segs = cortes([(M['tiempo'] + 4, 2.13), (M['menu'] + 4, 2.00), (M['stats'] + 6, 3.00), (M['bombas'], 2.12), (M['tabs'] + 4, 2.00), (M['vuelta'] + 4, 1.89)])
render(rec, OUT, [[('¿CUÁNTO TIEMPO LLEVO…', (255, 255, 255))], [('JUGANDO MI JUEGO?', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
