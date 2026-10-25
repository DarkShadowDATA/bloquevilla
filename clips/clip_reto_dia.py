"""Clip del Reto del día: muestra el tablero real de esa fecha, cuenta regresiva y la solución.
Uso: python clip_reto_dia.py 2026-10-26 out/reto_3.mp4
"""
import sys
from cap import Recorder, FPS
from director import Finger, drag, SLOTS, TRAY_Y
from edit import render, big_center_text, to_video, F
from PIL import ImageDraw

FECHA, OUT = sys.argv[1], sys.argv[2]
rec = Recorder({'bricks': 180, 'record': 4200, 'games': 9, 'built': ['casa', 'panaderia']}, query=f'&fecha={FECHA}')
rec.ev("() => { const s = window.__game.scene.getScenes(true)[0]; s.scene.start('Game', { reto: true }); return 1; }")
rec.step(3)
R = rec.ev("() => { const g = window.__game.scene.getScene('Game'); return { numero: g.reto.numero, meta: g.reto.meta, sol: g.reto.solucion }; }")
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.move(rec, 540, TRAY_Y + 120, 0.4)
cd_start = len(rec.frames)
f.wait(rec, 3.0)
cd_end = len(rec.frames)
ultimo = None
for i, s in enumerate(R['sol']):
    if i == 2:
        ultimo = len(rec.frames)
    drag(rec, f, s['slot'], s['r'], s['c'], approach=0.3, travel=0.6, after=0.5 if i < 2 else 0.3)
f.move(rec, 990, 1850, 0.3)
outro = len(rec.frames)
rec.hold(1.5, None)
fin = len(rec.frames)
print('reto', R['numero'], 'meta', R['meta'], 'frames', len(rec.frames), 'errores', rec.errors)


def overlay(img, i):
    d = ImageDraw.Draw(img)
    if cd_start <= i < cd_end:
        k = i - cd_start
        num = 3 - k // FPS
        cx, cy = to_video(540, 860)
        big_center_text(img, str(num), 300, (255, 255, 255), (k % FPS) / FPS, y=cy)
        px, py = to_video(540, TRAY_Y)
        w = 470 + 20 * abs(((k % 20) / 10) - 1)
        d.rounded_rectangle([px - w, py - 120, px + w, py + 120], radius=40, outline=(255, 217, 61), width=10)


segs = [(ultimo + 26, ultimo + 66), (0, fin)]
subs = [
    (ultimo + 26, ultimo + 66, 'Así se resuelve el reto de hoy', 0),
    (0, cd_start, f"Limpia {R['meta']} líneas con solo 3 piezas", 1),
    (cd_start, cd_end, '¿Lo ves? Tienes 3 segundos…', 1),
    (cd_end, outro, 'La solución:', 1),
    (outro, fin, '¿Lo resolviste igual? Comenta', 1),
]
render(rec, OUT, [[('RETO DEL DÍA ', (255, 217, 61)), (f"#{R['numero']}", (255, 255, 255))],
                  [(f"{R['meta']} líneas con 3 piezas", (255, 255, 255))]], overlay, segs=segs, subs=subs, sub_y=1780)
rec.close()
print('listo', OUT)
