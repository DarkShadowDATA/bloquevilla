"""Capturas limpias para el devlog de la 1.5 (Logros): python capturas_logros.py <carpeta>"""
import io, os, random, sys
from PIL import Image
from cap import Recorder, FPS
from director import setup_board

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/devlog'
os.makedirs(OUT, exist_ok=True)
DIA = '2026-11-10'
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
LOG = {'c': {'lineas': 4999, 'oro': 160, 'bombas': 31, 'hielo': 12, 'partidas': 60, 'puntos': 9000, 'combo': 6, 'cofres': 16},
       'cobrados': {'lineas': 2, 'oro': 2, 'bombas': 2, 'hielo': 1, 'partidas': 1, 'puntos': 1, 'combo': 2, 'edificios': 1, 'estrellas': 1, 'cofres': 2}}
SAVE = {'bricks': 412, 'record': 9800, 'games': 60, 'built': ['casa', 'panaderia', 'pozo', 'herreria'], 'oroVisto': True,
        'daily': {'last': DIA, 'streak': 2}, 'reto': {'last': DIA, 'racha': 3}, 'tiempo': {'record': 5200, 'partidas': 3},
        'tienda': {'temas': [], 'deco': [], 'visto': True}, 'aventura': {'estrellas': [3, 3, 2, 3]},
        'misiones': {'dia': DIA, 'cofre': True, 'lista': [{'t': 'tiempo', 'n': 1, 'dif': 0, 'p': 1, 'cobrada': True},
                     {'t': 'reto', 'n': 1, 'dif': 1, 'p': 1, 'cobrada': True}, {'t': 'estrellas', 'n': 5, 'dif': 2, 'p': 5, 'cobrada': True}]},
        'misionesVistas': True, 'logros': LOG, 'logrosVistos': True}


def guardar(rec, nombre):
    rec.grab(None)
    Image.open(io.BytesIO(rec.frames[-1])).convert('RGB').save(os.path.join(OUT, nombre), quality=86)
    print('ok', nombre)


rec = Recorder(SAVE, query=f'&evento=off&fecha={DIA}')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Menu'); return 1; }")
rec.step(int(1.5 * FPS))
guardar(rec, 'menu.jpg')
rec.ev("() => { window.__game.scene.getScene('Menu').scene.start('Logros'); return 1; }")
rec.step(int(0.8 * FPS))
guardar(rec, 'logros.jpg')
rec.ev("() => { window.__game.scene.getScene('Logros').scene.start('Game', { reto: false, nueva: true }); return 1; }")
rec.step(3)
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
rnd = random.Random(4)
board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
setup_board(rec, board, [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}]], score=1840)
rec.ev(f"() => {{ const g = {G}; if (g._toast) {{ g._toast.destroy(); g._toast = null; }} g.place(g.pieces[0], 7, 0); return 1; }}")
rec.step(int(1.9 * FPS))
guardar(rec, 'medalla.jpg')
rec.close()
