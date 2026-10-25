"""Clip: tablero trabado, nada cabe -> se usa el poder Rayo -> dos limpiezas seguidas con combo."""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag, SLOTS, TRAY_Y, BX, BY, CELL
from edit import render, big_center_text, to_video, F
from PIL import ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else 'salvada.mp4'
rnd = random.Random(11)
# Huecos: columna 3 en filas 0-2 y 5-7 (de 3 de alto), fila 3 col 0, fila 4 col 7.
HOLES = {(r, 3) for r in (0, 1, 2, 5, 6, 7)} | {(3, 0), (4, 7)}
board = [''.join('.' if (r, c) in HOLES else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
V = lambda n: [[i, 0] for i in range(n)]
SQ = [[r, c] for r in range(3) for c in range(3)]
trays = [[{'cells': V(4), 'color': 'blue'}, {'cells': V(4), 'color': 'orange'}, {'cells': SQ, 'color': 'green'}]]

rec = Recorder({'bricks': 214, 'record': 6950, 'games': 9, 'built': ['casa', 'panaderia', 'pozo'],
                'muertos': {'flores': 22, 'tema': False}})
rec.start_scene('Game')
setup_board(rec, board, trays, score=3870)
rec.ev("() => { const g = window.__game.scene.getScene('Game'); g.powers = ['rayo']; g.renderPowers(); return 1; }")
rec.step(2)
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.5, visible=False)

# 1) intenta meter el cuadrado 3x3: no cabe en ningún lado y regresa
sx, sy = SLOTS[2], TRAY_Y + 10
f.move(rec, sx, sy, 0.35)
rec.ev(f"() => {{ const g = window.__game.scene.getScene('Game'); g.startDrag(g.pieces[2], {{x: {sx}, y: {sy}}}); return 1; }}")
f.wait(rec, 0.07, pressed=True)
mv = "(p) => { window.__game.scene.getScene('Game').onMove(p); return 1; }"
f.move(rec, 560, 1150, 0.45, pressed=True, js_each=mv)
f.move(rec, 300, 1000, 0.35, pressed=True, js_each=mv)
f.move(rec, 760, 1060, 0.4, pressed=True, js_each=mv)
rec.ev("() => { window.__game.scene.getScene('Game').onUp(); return 1; }")
f.wait(rec, 0.3)
f.move(rec, 860, 1700, 0.3)
stuck_start = len(rec.frames)
rec.ev("() => { window.__game.scene.getScene('Game').checkStuck(); return 1; }")
f.wait(rec, 1.3)
stuck_end = len(rec.frames)

# 2) toca el poder Rayo y luego la casilla
f.move(rec, 430, 1785, 0.4)
rec.ev("() => { window.__game.scene.getScene('Game').activatePower(0); return 1; }")
f.wait(rec, 0.12, pressed=True)
f.wait(rec, 0.35)
tx, ty = BX + 3 * CELL + CELL / 2, BY + 4 * CELL + CELL / 2
f.move(rec, tx, ty, 0.5)
boom_at = len(rec.frames)
rec.ev(f"() => {{ window.__game.scene.getScene('Game').onBoardTap({{x: {tx}, y: {ty}}}); return 1; }}")
f.wait(rec, 0.12, pressed=True)
f.wait(rec, 0.9)

# 3) ahora sí caben: dos limpiezas seguidas
drag(rec, f, 0, 4, 3, approach=0.35, after=0.7)
drag(rec, f, 1, 0, 3, approach=0.35, after=1.4)
f.move(rec, 990, 1850, 0.3)
rec.hold(0.6, None)
print('frames', len(rec.frames), 'errores', rec.errors)


def overlay(img, i):
    if stuck_start <= i < stuck_end:
        big_center_text(img, '¡NO CABE NADA!', 104, (255, 90, 90), (i - stuck_start) / FPS, y=to_video(540, 900)[1])
    if boom_at <= i < boom_at + int(0.9 * FPS):
        big_center_text(img, '¡RAYO!', 140, (255, 230, 90), (i - boom_at) / FPS, y=to_video(540, 860)[1])


render(rec, OUT, [[('Estaba ', (255, 255, 255)), ('PERDIDO…', (255, 110, 110))],
                  [('hasta que usé ', (255, 255, 255)), ('ESTO', (255, 217, 61))]], overlay)
rec.close()
print('listo', OUT)
