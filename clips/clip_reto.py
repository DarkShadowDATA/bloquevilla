"""Clip 2: reto "¿Dónde la pondrías?" con cuenta regresiva y solución de 3 líneas."""
import sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag, SLOTS, TRAY_Y
from edit import render, big_center_text, to_video, F
from PIL import ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else 'reto.mp4'
board = [
    '..r.b...',
    '.g..y.k.',
    'bo.pr.gy',
    'r..g.bo.',
    '.yk..pgb',
    'gbr.oypk',
    'kpo.bgry',
    'ybg..rob',
]
trays = [[
    {'cells': [[0, 0], [0, 1], [0, 2], [1, 1]], 'color': 'orange'},
    {'cells': [[0, 0], [1, 0], [2, 0], [2, 1]], 'color': 'purple'},
    {'cells': [[0, 0], [1, 0]], 'color': 'green'},
]]

rec = Recorder({'bricks': 60, 'record': 4200})
rec.start_scene('Game')
setup_board(rec, board, trays, score=960)
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.6, visible=False)
f.move(rec, SLOTS[1] + 150, TRAY_Y - 40, 0.45)
cd_start = len(rec.frames)
f.wait(rec, 3.0)
cd_end = len(rec.frames)
drag(rec, f, 1, 5, 3, approach=0.3, travel=0.7, after=0.4)
f.move(rec, 990, 1850, 0.4)
outro_start = len(rec.frames)
rec.hold(1.9, None)
print('frames', len(rec.frames), 'errores', rec.errors)


def overlay(img, i):
    d = ImageDraw.Draw(img)
    if cd_start <= i < cd_end:
        k = i - cd_start
        num = 3 - k // FPS
        pr = (k % FPS) / FPS
        cx, cy = to_video(540, 860)
        big_center_text(img, str(num), 300, (255, 255, 255), pr, y=cy)
        # anillo que señala la pieza
        px, py = to_video(SLOTS[1], TRAY_Y)
        r = 150 + 18 * abs(((k % 20) / 10) - 1)
        d.ellipse([px - r, py - r, px + r, py + r], outline=(255, 217, 61), width=10)
    if i >= outro_start:
        pr = (i - outro_start) / FPS
        big_center_text(img, '¿Le atinaste?', 104, (255, 217, 61), pr, y=1560)
        if pr > 0.3:
            d.text((540, 1680), 'Dímelo en los comentarios', font=F(52), fill=(255, 255, 255), anchor='mm',
                   stroke_width=8, stroke_fill=(30, 10, 60))


render(rec, OUT, [[('¿Dónde la pondrías', (255, 255, 255))],
                  [('para limpiar ', (255, 255, 255)), ('3 LÍNEAS', (255, 217, 61)), ('?', (255, 255, 255))]], overlay)
rec.close()
print('listo', OUT)
