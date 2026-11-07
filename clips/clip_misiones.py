"""Clip: Misiones diarias (v1.3). Menú con 2 misiones listas -> panel -> partida con combo x5 (cumple la difícil)
-> de vuelta al panel: cobra las 3 y abre el cofre. Cold open: el cofre abriéndose. Se arma sin subtítulos propios:
la voz (skill voz-reels, guion BQ-01.json) pone los suyos."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'misiones.mp4'
DIA = '2026-11-07'
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
rnd = random.Random(4)
BOARD = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
TRAYS = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
         [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}]]
MOVES = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4)]
MIS = {'dia': DIA, 'cofre': False, 'lista': [
    {'t': 'lineas', 'n': 15, 'dif': 0, 'p': 15, 'cobrada': False},
    {'t': 'oro', 'n': 6, 'dif': 1, 'p': 6, 'cobrada': False},
    {'t': 'combo', 'n': 5, 'dif': 2, 'p': 2, 'cobrada': False}]}


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


rec = Recorder({'bricks': 412, 'record': 9800, 'games': 40, 'built': ['casa', 'panaderia', 'pozo', 'herreria'], 'oroVisto': True,
                'daily': {'last': DIA, 'streak': 2}, 'reto': {'last': DIA, 'racha': 3}, 'tiempo': {'record': 5200, 'partidas': 3},
                'tienda': {'temas': [], 'deco': [], 'visto': True}, 'aventura': {'estrellas': [3, 3, 2]},
                'misiones': MIS, 'misionesVistas': True}, query=f'&evento=off&fecha={DIA}')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Menu'); return 1; }")
rec.step(3)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.wait(rec, 0.5)
M['panel'] = len(rec.frames)
tap(rec, f, 375, 1540, after=2.6)                      # botón Misiones
M['juego'] = len(rec.frames)
rec.ev(f"() => {{ window.__game.scene.getScene('Menu').scene.start('Game', {{ reto: false, nueva: true }}); return 1; }}")
rec.step(2)
setup_board(rec, BOARD, TRAYS, score=1840)
rec.ev(f"() => {{ const g = {G}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
f = Finger(980, 1820)
f.wait(rec, 0.2)
for i, (slot, r, c) in enumerate(MOVES):
    M[f'd{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.24, travel=0.36, after=0.2 if i < 4 else 2.0)
M['menu'] = len(rec.frames)
rec.ev("() => { const s = window.__game.scene.getScene('Game'); s.scene.start('Menu'); return 1; }")
rec.step(2)
rec.ev("() => { window.__game.scene.getScene('Menu').openMisiones(); return 1; }")
f = Finger(980, 1820)
f.wait(rec, 0.45)
for y in (680, 895, 1110):                              # cobrar las 3
    tap(rec, f, 840, y, travel=0.25, after=0.95)
M['cofre'] = len(rec.frames)
tap(rec, f, 840, 1330, travel=0.3, after=2.2)          # abrir el cofre
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
print('estado', rec.ev("() => { const s = JSON.parse(localStorage.getItem('bloquevilla_v1')); return JSON.stringify([s.misiones, s.proximos, s.bricks]); }"))

c = M['cofre'] + 4
segs = [(c, c + 75), (M['panel'] - 4, M['fin'])]
render(rec, OUT, [[('Mi juego ahora tiene', (255, 255, 255))], [('MISIONES DIARIAS', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
