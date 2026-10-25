"""Clips de la Tienda.
  python clip_tienda.py tienda out/tienda.mp4    -> menú > Tienda > compra Bomba y tema Neón > partida con bloques neón
  python clip_tienda.py pueblo out/decorar.mp4   -> el pueblo se va decorando: árboles, farolas, jardines, banderines y fuente
"""
import random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render, big_center_text, to_video, F
from PIL import ImageDraw

MODO, OUT = sys.argv[1], sys.argv[2]
G = lambda k: f"window.__game.scene.getScene('{k}')"
marks = []


def tap(rec, f, x, y, travel=0.45, after=0.5):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


if MODO == 'tienda':
    rec = Recorder({'bricks': 486, 'record': 9800, 'games': 20, 'built': ['casa', 'panaderia', 'pozo', 'herreria'],
                    'muertos': {'flores': 52, 'tema': False}, 'oroVisto': True, 'tiempo': {'record': 6608, 'partidas': 4},
                    'daily': {'last': '2026-10-24', 'streak': 1}, 'reto': {'last': '2026-10-24', 'racha': 1}})
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.6, visible=False)
    tap(rec, f, 705, 1418, after=0.7)           # botón Tienda
    marks.append(('Poderes para tu partida', len(rec.frames)))
    tap(rec, f, 290, 1180, after=0.9)           # comprar Bomba
    tap(rec, f, 790, 1180, after=0.9)           # comprar Rayo
    marks.append(('Temas para siempre', len(rec.frames)))
    tap(rec, f, 540, 265, after=0.6)            # pestaña Temas
    tap(rec, f, 290, 750, after=1.1)            # comprar Neón
    tap(rec, f, 880, 265, after=1.2)            # pestaña Pueblo
    marks.append(('¡Y juego con todo!', len(rec.frames)))
    rec.ev(f"() => {{ {G('Shop')}.scene.start('Game', {{ reto: false, modo: null }}); return 1; }}")
    rec.step(2)
    rnd = random.Random(3)
    GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
    board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
    H = lambda n: [[0, i] for i in range(n)]
    trays = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue', 'gold': 1}, {'cells': H(2), 'color': 'pink'}]]
    setup_board(rec, board, trays, score=1520)
    rec.ev(f"() => {{ const g = {G('Game')}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
    f = Finger(990, 1850)
    rec.hold(0.4, None)
    for i, (slot, r, c) in enumerate([(0, 7, 0), (1, 0, 2), (2, 5, 1)]):
        drag(rec, f, slot, r, c, approach=0.3, travel=0.5, after=0.4 if i < 2 else 1.0)
    f.move(rec, 990, 1850, 0.3)
    rec.hold(0.5, None)
    hook = [[('Mi juego ya tiene ', (255, 255, 255)), ('TIENDA', (255, 217, 61))], [('y todo se paga con ladrillos', (255, 255, 255))]]
else:
    rec = Recorder({'bricks': 300, 'record': 9800, 'games': 20, 'built': ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza'],
                    'muertos': {'flores': 52, 'tema': False}, 'tienda': {'temas': [], 'deco': [], 'visto': True}})
    rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Village'); return 1; }")
    rec.step(3)
    rec.ev(f"() => {{ const v = {G('Village')}; if (v._toast) {{ v._toast.destroy(); v._toast = null; }} return 1; }}")
    rec.begin()
    rec.hold(1.2, None)
    precios = {'arboles': 30, 'farolas': 40, 'flores': 50, 'banderines': 60, 'fuente': 90}
    nombres = {'arboles': 'Árboles', 'farolas': 'Farolas', 'flores': 'Jardines', 'banderines': 'Banderines', 'fuente': 'Fuente'}
    for id in ['arboles', 'farolas', 'flores', 'banderines', 'fuente']:
        marks.append((f'+ {nombres[id]}  ·  {precios[id]} ladrillos', len(rec.frames)))
        rec.ev(f"""() => {{ const v = {G('Village')}; const s = JSON.parse(localStorage.getItem('bloquevilla_v1'));
          v.decoraciones(['{id}'], true); return 1; }}""")
        rec.hold(1.3, None)
    marks.append(('¡Listo!', len(rec.frames)))
    rec.hold(1.6, None)
    hook = [[('Así decoré mi pueblo', (255, 255, 255))], [('con ', (255, 255, 255)), ('LADRILLOS', (255, 140, 60))]]

print('frames', len(rec.frames), 'marcas', marks, 'errores', rec.errors)


def overlay(img, i):
    actual = None
    for k, (t, fr) in enumerate(marks):
        if i >= fr:
            actual = (t, fr)
    if not actual or MODO == 'tienda' and actual[0] == '¡Y juego con todo!' and i > actual[1] + 45:
        return
    t, fr = actual
    d = ImageDraw.Draw(img)
    y = 1835 if MODO == 'pueblo' else 1835
    f = F(54)
    w = f.getlength(t) + 70
    d.rounded_rectangle([540 - w / 2, y - 50, 540 + w / 2, y + 50], radius=50, fill=(20, 12, 50))
    d.text((540, y), t, font=f, fill=(255, 217, 61), anchor='mm')


render(rec, OUT, hook, overlay)
rec.close()
print('listo', OUT)
