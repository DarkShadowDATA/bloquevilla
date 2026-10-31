"""Capturas limpias (sin texto encima) para el devlog de itch: python capturas_devlog.py <carpeta>"""
import io, os, sys
from PIL import Image
from cap import Recorder, FPS
from director import setup_board

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/devlog'
os.makedirs(OUT, exist_ok=True)
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
TODO = ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza']


def guardar(rec, nombre):
    rec.grab(None)
    Image.open(io.BytesIO(rec.frames[-1])).convert('RGB').save(os.path.join(OUT, nombre), quality=86)
    print('ok', nombre)


def limpiar_toast(rec, escena):
    rec.ev(f"() => {{ const s = window.__game.scene.getScene('{escena}'); if (s._toast) {{ s._toast.destroy(); s._toast = null; }} return 1; }}")


# 1) Modo Aventura: nivel 20 superado con 3 estrellas
rec = Recorder({'bricks': 640, 'games': 40, 'built': TODO[:4], 'oroVisto': True, 'peligros': {'bomba': True, 'hielo': True},
                'aventura': {'estrellas': [3] * 19}}, query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { reto: false, nivel: 19 }); return 1; }")
rec.step(5)
rec.ev(f"""() => {{ const g = {G}; const T = [[{{cells:[[0,0],[0,1]],color:'orange'}},{{cells:[[0,0],[0,1]],color:'blue'}},{{cells:[[0,0],[0,1]],color:'pink'}}],[{{cells:[[0,0],[0,1]],color:'green'}},{{cells:[[0,0]],color:'yellow'}},{{cells:[[0,0]],color:'red'}}]];
  g.trayQueue = T; g.newTray = function (a) {{ this.pieces.forEach((p) => p.c && p.c.destroy()); const d = this.trayQueue.shift(); this.pieces = d.map((x, i) => this.makePiece(x, i, a)); }};
  g.newTray(false); return 1; }}""")
for slot, r, c in [(0, 0, 2), (1, 0, 5), (2, 7, 1), (0, 7, 5)]:
    rec.ev(f"() => {{ const g = {G}; g.place(g.pieces[{slot}], {r}, {c}); return 1; }}")
    rec.hold(0.8, None)
rec.hold(3.5, None)
guardar(rec, 'aventura.jpg')
rec.ev("() => { window.__game.scene.getScene('Game').scene.start('Aventura'); return 1; }")
rec.step(int(1.0 * FPS))
guardar(rec, 'aventura_mapa.jpg')
rec.close()

# 2) Zona 2: el Muelle completo
rec = Recorder({'bricks': 300, 'games': 60, 'built': TODO + ['muelle', 'barca', 'pescaderia', 'faro', 'astillero', 'mercado'], 'oroVisto': True}, query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Village', { zona: 2 }); return 1; }")
rec.step(int(1.0 * FPS))
limpiar_toast(rec, 'Village')
rec.step(3)
guardar(rec, 'muelle.jpg')
rec.close()

# 3) Reta a un amigo: mismas piezas que Juan y ya lo superaste
rec = Recorder({'bricks': 300, 'record': 9800, 'games': 40, 'built': TODO[:4], 'oroVisto': True, 'apodo': 'Alex'}, query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { reto: false, vs: { s: 4242, p: 2340, n: 'Juan', m: 'n' } }); return 1; }")
rec.step(5)
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
import random
rnd = random.Random(9)
board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
setup_board(rec, board, [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}]], score=2290)
rec.ev(f"() => {{ const g = {G}; g.place(g.pieces[2], 7, 0); return 1; }}")
rec.hold(0.6, None)
rec.ev(f"() => {{ {G}.addScore(60); return 1; }}")
rec.hold(0.5, None)
limpiar_toast(rec, 'Game')
guardar(rec, 'reto_amigo.jpg')
rec.close()

# 4) Bloques peligrosos: bomba a punto de explotar y hielo (entero y agrietado)
rec = Recorder({'bricks': 300, 'record': 9800, 'games': 40, 'built': TODO[:4], 'oroVisto': True, 'peligros': {'bomba': True, 'hielo': True}}, query='&evento=off')
rec.start_scene('Game')
board = ['........', '.rr..I..', 'gyB.bppk', '..g..o..', '.I...ob.', 'rp.kky.g', '..b.I...', 'oo.y..pp']
setup_board(rec, board, [[{'cells': H(3), 'color': 'orange'}, {'cells': [[0, 0], [1, 0]], 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}]], score=3120)
rec.ev(f"() => {{ const g = {G}; const k = 2 * 8 + 2; g.bombas[k] = 2; g.pintarBomba(k); g.board[4][1] = 'hielo2'; g.sprites[4][1].setTexture(g.blockTex('hielo2')); return 1; }}")
rec.step(int(0.5 * FPS))
guardar(rec, 'bomba_hielo.jpg')
rec.close()
