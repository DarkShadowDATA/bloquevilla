"""Clip: Tema del día (v1.6). Menú (botón de bloques con ¡GRATIS HOY!) -> elige el tema prestado -> Jugar -> partida con
bloques Oro puro y combo -> Tienda Shadow (los 3 temas premium) -> más partida. Cold open: combo con los bloques de oro.
Se arma sin subtítulos propios: la voz (skill voz-reels, guion BQ-05.json) pone los suyos."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'temadia.mp4'
DIA = '2026-11-11'   # ese día toca Oro puro
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
rnd = random.Random(4)
BOARD = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
TRAYS = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
         [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}]]
MOVES = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4)]


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


rec = Recorder({'bricks': 412, 'record': 9800, 'games': 60, 'built': ['casa', 'panaderia', 'pozo', 'herreria'], 'oroVisto': True,
                'daily': {'last': DIA, 'streak': 2}, 'reto': {'last': DIA, 'racha': 3}, 'tiempo': {'record': 5200, 'partidas': 3},
                'tienda': {'temas': [], 'deco': [], 'visto': True}, 'aventura': {'estrellas': [3, 3, 2, 3]},
                'misiones': {'dia': DIA, 'cofre': True, 'lista': [{'t': 'tiempo', 'n': 1, 'dif': 0, 'p': 1, 'cobrada': True},
                             {'t': 'reto', 'n': 1, 'dif': 1, 'p': 1, 'cobrada': True}, {'t': 'estrellas', 'n': 5, 'dif': 2, 'p': 5, 'cobrada': True}]},
                'misionesVistas': True, 'logrosVistos': True,
                'logros': {'c': {'lineas': 300, 'partidas': 60, 'puntos': 9000, 'combo': 6}, 'cobrados': {'lineas': 1, 'partidas': 2, 'puntos': 2, 'combo': 2, 'edificios': 1, 'estrellas': 1}}},
               query=f'&evento=off&fecha={DIA}')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Menu'); return 1; }")
rec.step(3)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.wait(rec, 0.7)
tap(rec, f, 705, 1668, after=1.3)                      # botón de bloques: elige el tema del día
print('tema', rec.ev("() => JSON.parse(localStorage.getItem('bloquevilla_v1')).theme"))
tap(rec, f, 540, 1038, after=0.05)                     # Jugar
M['juego'] = len(rec.frames)
rec.step(2)
print('escena', rec.ev(f"() => {{ const g = {G}; return JSON.stringify([g.sys.isActive(), g.pruebaTema]); }}"))
setup_board(rec, BOARD, TRAYS, score=1840)
rec.ev(f"() => {{ const g = {G}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
f = Finger(980, 1820)
f.wait(rec, 0.2)
for i, (slot, r, c) in enumerate(MOVES):
    M[f'd{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.24, travel=0.36, after=0.2 if i < 4 else 1.6)
M['tienda'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScene('Game').scene.start('Shop', { tab: 'shadow' }); return 1; }")
rec.step(2)
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.move(rec, 760, 1150, 1.2)
f.wait(rec, 2.2)
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

c = M['d3'] - 6
# cold open (combo con bloques de oro) · menú: elegir el tema y Jugar · 3 jugadas · tienda con los 3 temas · resto de la partida
segs = [(c, c + 66), (0, M['juego']), (M['juego'], M['d3']), (M['tienda'] + 2, M['tienda'] + 2 + 96), (M['d3'], M['d3'] + 66)]
render(rec, OUT, [[('Hoy mis bloques son de', (255, 255, 255))], [('ORO PURO · GRATIS', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
