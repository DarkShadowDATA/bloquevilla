"""Clip: Tienda Shadow (v1.4). Menú con cuenta (☁️ Alex) -> Tienda > Shadow -> compra el Paquete Fundador (2 toques)
-> partida con bloques Fundador y combo. Cold open: líneas limpiándose con los bloques Fundador.
Necesita el servidor local de prueba (DEV_AUTH, 80 Shadow para dev:4242) en http://127.0.0.1:3911.
Se arma sin subtítulos propios: la voz (skill voz-reels, guion BQ-02.json) pone los suyos."""
import random, sys, time
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'shadow.mp4'
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


rec = Recorder({'bricks': 412, 'record': 9800, 'games': 40, 'built': ['casa', 'panaderia', 'pozo', 'herreria'], 'oroVisto': True,
                'daily': {'last': '2026-11-08', 'streak': 2}, 'reto': {'last': '2026-11-08', 'racha': 3}, 'tiempo': {'record': 5200, 'partidas': 3},
                'tienda': {'temas': ['neon'], 'deco': [], 'visto': True}, 'aventura': {'estrellas': [3, 3, 2, 3]},
                'misiones': {'dia': '2026-11-08', 'cofre': True, 'lista': [{'t': 'lineas', 'n': 15, 'dif': 0, 'p': 15, 'cobrada': True},
                             {'t': 'oro', 'n': 6, 'dif': 1, 'p': 6, 'cobrada': True}, {'t': 'combo', 'n': 5, 'dif': 2, 'p': 5, 'cobrada': True}]},
                'misionesVistas': True}, query='&evento=off&fecha=2026-11-08&devapi=http://127.0.0.1:3911&devname=Alex')
# esperar a que la cuenta de prueba conteste (la red no avanza con los cuadros)
for _ in range(80):
    if rec.ev("() => !!(window.__nube && window.__nube.on)"):
        break
    time.sleep(0.25); rec.step(1)
rec.step(4)
print('nube', rec.ev("() => JSON.stringify({on: window.__nube.on, shadow: window.__nube.shadow})"))
rec.ev("() => { window.__game.scene.getScene('Menu').scene.restart(); return 1; }")
rec.step(3)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.wait(rec, 2.4)
M['tienda'] = len(rec.frames)
tap(rec, f, 705, 1418, after=0.4)                      # Tienda
tap(rec, f, 934, 265, after=3.8)                       # pestaña Shadow
M['comprar'] = len(rec.frames)
tap(rec, f, 290, 750, after=0.5)                       # 30 Shadow
tap(rec, f, 290, 750, after=0.1)                       # ¿Comprar? (confirma)
for _ in range(60):                                     # espera la respuesta del servidor
    if rec.ev("() => !!(window.__nube.compras && window.__nube.compras.fundador)"):
        break
    time.sleep(0.2); rec.grab((f.x, f.y, False))
f.wait(rec, 2.0)
M['juego'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScene('Shop').scene.start('Game', { reto: false, nueva: true }); return 1; }")
rec.step(2)
setup_board(rec, BOARD, TRAYS, score=1840)
rec.ev(f"() => {{ const g = {G}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
f = Finger(980, 1820)
f.wait(rec, 0.3)
for i, (slot, r, c) in enumerate(MOVES):
    M[f'd{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.24, travel=0.36, after=0.2 if i < 4 else 1.4)
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
print('estado', rec.ev("() => { const s = JSON.parse(localStorage.getItem('bloquevilla_v1')); return JSON.stringify([s.theme, s.fundador, s.bricks, window.__nube.shadow]); }"))

c = M['d3'] - 6
segs = [(c, c + 60), (0, M['fin'])]
render(rec, OUT, [[('Mi juego ahora tiene', (255, 255, 255))], [('TEMAS EXCLUSIVOS', (190, 140, 255))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
