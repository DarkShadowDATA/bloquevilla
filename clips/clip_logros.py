"""Clip: Logros (v1.5). Menú (botón Logros con aviso) -> pantalla de Logros -> partida con combo que gana la medalla
de oro de Limpiador -> de vuelta a Logros: cobra las medallas. Cold open: el combo con el aviso de la medalla de oro.
Se arma sin subtítulos propios: la voz (skill voz-reels, guion BQ-03.json) pone los suyos."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'logros.mp4'
LIN = int(sys.argv[2]) if len(sys.argv) > 2 else 4998
DIA = '2026-11-10'
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
rnd = random.Random(4)
BOARD = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
TRAYS = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
         [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}]]
MOVES = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4)]
LOG = {'c': {'lineas': LIN, 'oro': 160, 'bombas': 31, 'hielo': 12, 'partidas': 60, 'puntos': 9000, 'combo': 6, 'cofres': 16},
       'cobrados': {'lineas': 2, 'oro': 2, 'bombas': 2, 'hielo': 1, 'partidas': 1, 'puntos': 2, 'combo': 2, 'edificios': 1, 'estrellas': 1, 'cofres': 2}}


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


rec = Recorder({'bricks': 412, 'record': 9800, 'games': 60, 'built': ['casa', 'panaderia', 'pozo', 'herreria'], 'oroVisto': True,
                'daily': {'last': DIA, 'streak': 2}, 'reto': {'last': DIA, 'racha': 3}, 'tiempo': {'record': 5200, 'partidas': 3},
                'tienda': {'temas': ['neon'], 'deco': [], 'visto': True}, 'aventura': {'estrellas': [3, 3, 2, 3]},
                'misiones': {'dia': DIA, 'cofre': True, 'lista': [{'t': 'tiempo', 'n': 1, 'dif': 0, 'p': 1, 'cobrada': True},
                             {'t': 'reto', 'n': 1, 'dif': 1, 'p': 1, 'cobrada': True}, {'t': 'estrellas', 'n': 5, 'dif': 2, 'p': 5, 'cobrada': True}]},
                'misionesVistas': True, 'logros': LOG, 'logrosVistos': True}, query=f'&evento=off&fecha={DIA}')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Menu'); return 1; }")
rec.step(3)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.wait(rec, 0.9)
M['logros'] = len(rec.frames)
tap(rec, f, 375, 1668, after=3.6)                      # botón Logros
M['juego'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScene('Logros').scene.start('Game', { reto: false, nueva: true }); return 1; }")
rec.step(2)
setup_board(rec, BOARD, TRAYS, score=1840)
rec.ev(f"() => {{ const g = {G}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
f = Finger(980, 1820)
f.wait(rec, 0.2)
lin = lambda: rec.ev("() => JSON.parse(localStorage.getItem('bloquevilla_v1')).logros.c.lineas")
for i, (slot, r, c) in enumerate(MOVES):
    M[f'd{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.24, travel=0.36, after=0.2 if i < 4 else 2.4)
    print('mov', i, 'cuadro', len(rec.frames), 'lineas', lin())
M['cobrar'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScene('Game').scene.start('Logros'); return 1; }")
rec.step(2)
f = Finger(980, 1820)
f.wait(rec, 0.5)
tap(rec, f, 955, 400, travel=0.3, after=1.5)           # Limpiador: oro +100
tap(rec, f, 955, 952, travel=0.3, after=1.9)           # Constante: plata +50
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
print('estado', rec.ev("() => { const s = JSON.parse(localStorage.getItem('bloquevilla_v1')); return JSON.stringify([s.logros, s.bricks]); }"))

c = int(sys.argv[3]) if len(sys.argv) > 3 else M['d2'] + 16
# cold open (medalla de oro en pleno combo) · menú y Logros · 4 jugadas · cobrar medallas
segs = [(c, c + 66), (18, 150), (M['d1'], M['d4'] + 30), (M['cobrar'], M['fin'])]
render(rec, OUT, [[('Mi juego ahora tiene', (255, 255, 255))], [('LOGROS Y MEDALLAS', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
