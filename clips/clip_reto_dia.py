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
f.wait(rec, 1.0, visible=False)
f.move(rec, 540, TRAY_Y + 120, 0.4)
cd_start = len(rec.frames)
f.wait(rec, 3.0)
cd_end = len(rec.frames)
for i, s in enumerate(R['sol']):
    drag(rec, f, s['slot'], s['r'], s['c'], approach=0.3, travel=0.6, after=0.5 if i < 2 else 0.3)
f.move(rec, 990, 1850, 0.3)
outro = len(rec.frames)
rec.hold(2.2, None)
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
    if i >= outro:
        pr = (i - outro) / FPS
        big_center_text(img, '¿Lo resolviste igual?', 84, (255, 217, 61), pr, y=1560)
        if pr > 0.3:
            d.text((540, 1675), 'Juega el reto de hoy GRATIS', font=F(50), fill=(255, 255, 255), anchor='mm',
                   stroke_width=8, stroke_fill=(30, 10, 60))


render(rec, OUT, [[('RETO DEL DÍA ', (255, 217, 61)), (f"#{R['numero']}", (255, 255, 255))],
                  [(f"{R['meta']} líneas con 3 piezas", (255, 255, 255))]], overlay)
rec.close()
print('listo', OUT)
