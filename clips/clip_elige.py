"""Clip: "¿Cuál poder elegirías? 1, 2 o 3". Tablero trabado, salen 3 cartas, pausa para comentar,
se elige la Bomba y una pieza 3x3 limpia 3 filas y 3 columnas de golpe."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag, BX, BY, CELL
from edit import render, big_center_text, to_video, F
from PIL import ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else 'elige.mp4'
rnd = random.Random(8)
HOLES = {(2, 3), (3, 2), (3, 4), (4, 3), (0, 0), (1, 6), (5, 1), (6, 7), (7, 5)}
board = [''.join('.' if (r, c) in HOLES else rnd.choice('robpkg') for c in range(8)) for r in range(8)]
SQ = [[r, c] for r in range(3) for c in range(3)]
trays = [[{'cells': SQ, 'color': 'orange', 'gold': 4}, {'cells': [[0, 0], [0, 1]], 'color': 'blue'}, {'cells': [[0, 0], [1, 0]], 'color': 'pink'}]]

rec = Recorder({'bricks': 205, 'record': 9800, 'games': 15, 'built': ['casa', 'panaderia', 'pozo'],
                'muertos': {'flores': 50, 'tema': False}, 'oroVisto': True})
rec.start_scene('Game')
setup_board(rec, board, trays, score=4120)
G = "window.__game.scene.getScene('Game')"
rec.ev("() => { window.__forceOffer = ['martillo', 'bomba', 'rayo']; return 1; }")
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.8, visible=False)
rec.ev(f"() => {{ {G}.showOffer(); return 1; }}")
rec.hold(1.0, None)
pausa0 = len(rec.frames)
rec.hold(3.0, None)
pausa1 = len(rec.frames)
f = Finger(900, 1500)
f.move(rec, 540, 990, 0.45)
rec.ev(f"() => {{ {G}._offerCards[1].emit('pointerdown'); return 1; }}")
f.wait(rec, 0.12, pressed=True)
f.wait(rec, 0.9)
f.move(rec, 430, 1785, 0.45)
rec.ev(f"() => {{ {G}.activatePower(0); return 1; }}")
f.wait(rec, 0.12, pressed=True)
f.wait(rec, 0.3)
tx, ty = BX + 3 * CELL + CELL / 2, BY + 3 * CELL + CELL / 2
f.move(rec, tx, ty, 0.5)
rec.ev(f"() => {{ {G}.onBoardTap({{x: {tx}, y: {ty}}}); return 1; }}")
f.wait(rec, 0.12, pressed=True)
f.wait(rec, 0.8)
drag(rec, f, 0, 2, 2, approach=0.35, travel=0.6, after=2.2)
fin = len(rec.frames)
f.move(rec, 990, 1850, 0.3)
rec.hold(0.4, None)
print('frames', len(rec.frames), 'errores', rec.errors)


def overlay(img, i):
    d = ImageDraw.Draw(img)
    if pausa0 <= i < pausa1:
        for k in range(3):
            x, y = to_video(220 + k * 320, 700)
            d.ellipse([x - 52, y - 52, x + 52, y + 52], fill=(255, 217, 61), outline=(70, 20, 90), width=8)
            d.text((x, y + 2), str(k + 1), font=F(70), fill=(70, 20, 90), anchor='mm')
        n = 3 - (i - pausa0) // FPS
        big_center_text(img, f'¿Cuál eliges?  {n}', 92, (255, 255, 255), ((i - pausa0) % FPS) / FPS, y=to_video(540, 1350)[1])
    if i >= fin - int(0.9 * FPS):
        big_center_text(img, '¿Tú cuál elegiste?', 84, (255, 217, 61), (i - fin + 0.9 * FPS) / FPS, y=to_video(540, 330)[1] + 150)


render(rec, OUT, [[('¿Cuál poder ', (255, 255, 255)), ('ELEGIRÍAS', (255, 217, 61)), ('?', (255, 255, 255))],
                  [('Comenta: 1, 2 o 3', (255, 255, 255))]], overlay)
rec.close()
print('listo', OUT)
