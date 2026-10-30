"""Clip: Ranking semanal. Contrarreloj que termina con récord y entra al top 3; luego la tabla de la semana."""
import json, random, sys
from cap import Recorder, FPS
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'ranking.mp4'
G = "window.__game.scene.getScene('Game')"
PUNTOS = 0
TOP = [
    {'lugar': 1, 'apodo': 'Rayo_MX', 'puntos': 8210, 'soy_yo': False},
    {'lugar': 2, 'apodo': 'Lupita22', 'puntos': 7905, 'soy_yo': False},
    {'lugar': 3, 'apodo': 'Alex', 'puntos': PUNTOS, 'soy_yo': True},
    {'lugar': 4, 'apodo': 'ElBloques', 'puntos': 6115, 'soy_yo': False},
    {'lugar': 5, 'apodo': 'Kari.mty', 'puntos': 5740, 'soy_yo': False},
    {'lugar': 6, 'apodo': 'Toño_gdl', 'puntos': 5302, 'soy_yo': False},
    {'lugar': 7, 'apodo': 'pixelzz', 'puntos': 4890, 'soy_yo': False},
    {'lugar': 8, 'apodo': 'Fer', 'puntos': 4411, 'soy_yo': False},
    {'lugar': 9, 'apodo': 'NinjaCubo', 'puntos': 3988, 'soy_yo': False},
    {'lugar': 10, 'apodo': 'Mari', 'puntos': 3560, 'soy_yo': False},
]
rnd = random.Random(9)
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
H = lambda n: [[0, i] for i in range(n)]
trays = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}]]

rec = Recorder({'bricks': 300, 'record': 9800, 'games': 40, 'built': ['casa', 'panaderia', 'pozo', 'herreria'],
                'oroVisto': True, 'apodo': 'Alex', 'tiempo': {'record': 6100, 'partidas': 12}}, query='&evento=off')
rec.ev(f"() => {{ window.__fakeTop = {json.dumps(TOP)}; window.__game.scene.getScenes(true)[0].scene.start('Game', {{ reto: false, modo: 'tiempo' }}); return 1; }}")
rec.step(3)
setup_board(rec, board, trays, score=6290)
rec.ev(f"() => {{ const g = {G}; g.arrancarTiempo(); g.tiempoRest = 2600; g.combo = 3; g.updateComboText(); g.drawTimer(); if (g._toast) {{ g._toast.destroy(); g._toast = null; }} return 1; }}")
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
for i, (slot, r, c) in enumerate([(0, 7, 0), (1, 0, 2), (2, 5, 1)]):
    M[f'm{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.25, travel=0.4, after=0.2)
f.move(rec, 990, 1850, 0.3)
for _ in range(int(6 * FPS)):
    if rec.ev(f"() => {G}.over"):
        break
    rec.grab(None)
M['fin_juego'] = len(rec.frames)
rec.hold(1.4, None)
M['resumen'] = len(rec.frames)
PUNTOS = rec.ev(f"() => {G}.score")
TOP[2]['puntos'] = PUNTOS
rec.ev(f"() => {{ window.__fakeTop = {json.dumps(TOP)}; return 1; }}")
rec.ev(f"() => {{ const g = {G}; if (g.rankTxt) g.rankTxt.setText('Ranking semanal: lugar #3').setColor('#e0901a'); return 1; }}")
rec.hold(1.0, None)
M['tabla'] = len(rec.frames)
rec.ev(f"() => {{ {G}.scene.start('Ranking'); return 1; }}")
rec.hold(3.0, None)
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

segs = [(M['tabla'] + 20, M['tabla'] + 62), (0, M['fin'])]
subs = [
    (M['tabla'] + 20, M['tabla'] + 62, '¡Entré al TOP 3 de la semana!', 0),
    (0, M['fin_juego'], 'Contrarreloj: últimos segundos…', 1),
    (M['fin_juego'], M['tabla'], f'¡{PUNTOS:,} puntos! ¿Alcanza para el ranking?', 1),
    (M['tabla'], M['fin'], 'Top 3 gana ladrillos cada lunes. ¿Me ganas?', 1),
]
render(rec, OUT, [[('RANKING ', (255, 217, 61)), ('SEMANAL', (255, 255, 255))],
                  [('¿Me sacas del top 3?', (255, 255, 255))]], segs=segs, subs=subs)
rec.close()
print('listo', OUT)
