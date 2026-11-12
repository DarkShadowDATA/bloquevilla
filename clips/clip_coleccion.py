"""Clip BQ-07: la Colección y el tema Dragón. Cold open = combo con bloques de dragón. Luego: álbum al 100 % -> tocar la
carta del Dragón (se pone el tema) -> colina del Castillo con globo, estatua y copa -> cobrar el premio del 100 %.
Sin subtítulos propios: la voz (guion BQ-07.json) pone los suyos."""
import random, sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'coleccion.mp4'
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
rnd = random.Random(4)
BOARD = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
TRAYS = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
         [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}]]
MOVES = [(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4)]
TODOS = 'casa,panaderia,pozo,herreria,torre,plaza,muelle,barca,pescaderia,faro,astillero,mercado,granja,molino,biblioteca,mina,tesoreria,castillo'.split(',')
LOG = ['lineas', 'oro', 'bombas', 'hielo', 'partidas', 'puntos', 'combo', 'edificios', 'estrellas', 'cofres']


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


rec = Recorder({'bricks': 1860, 'record': 14200, 'games': 220, 'theme': 'clasico', 'oroVisto': True, 'misionesVistas': True, 'logrosVistos': True,
                'built': TODOS, 'finalVisto': True,
                'tienda': {'temas': ['neon', 'caramelo'], 'deco': ['arboles', 'farolas', 'flores', 'banderines', 'fuente'], 'visto': True},
                'aventura': {'estrellas': [3] * 60, 'premioMeta': True},
                'logros': {'c': {'lineas': 6000, 'oro': 600, 'bombas': 120, 'hielo': 240, 'partidas': 220, 'puntos': 16000, 'combo': 8, 'cofres': 60},
                           'cobrados': {k: 3 for k in LOG}},
                'coleccion': {'vistos': ['globo', 'estatua', 'copa'], 'premio': False},
                'peligros': {'bomba': True, 'hielo': True}, 'guia': {'vistos': ['basico']}},
               query='&evento=off')
# 1) partida con bloques de dragón (para el cold open)
rec.ev("() => { const s = window.__game.scene.getScenes(true)[0]; window.__game.registry; return 1; }")
rec.ev("() => { const d = JSON.parse(localStorage.getItem('bloquevilla_v1')); return d.theme; }")
rec.begin()
M = {}
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Coleccion'); return 1; }")
rec.step(2)
f = Finger(980, 1820)
M['album'] = len(rec.frames)
f.wait(rec, 0.2, visible=False)
f.move(rec, 620, 1500, 0.5)
f.wait(rec, 0.5)
M['tapdragon'] = len(rec.frames)
tap(rec, f, 178, 853, travel=0.6, after=1.8)                 # carta del Dragón: pone el tema
print('tema', rec.ev("() => JSON.parse(localStorage.getItem('bloquevilla_v1')).theme"))
M['pueblo'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Village', { zona: 3 }); return 1; }")
rec.step(2)
f.wait(rec, 3.2, visible=False)
M['premio'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Coleccion'); return 1; }")
rec.step(2)
f = Finger(980, 1820)
f.wait(rec, 0.3, visible=False)
tap(rec, f, 540, 1810, travel=0.5, after=4.8)                # 🎁 100 %: +300
M['juego'] = len(rec.frames)
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nueva: true }); return 1; }")
rec.step(2)
setup_board(rec, BOARD, TRAYS, score=2140)
f = Finger(980, 1820)
f.wait(rec, 0.2)
for i, (slot, r, c) in enumerate(MOVES):
    M[f'd{i}'] = len(rec.frames)
    drag(rec, f, slot, r, c, approach=0.24, travel=0.36, after=0.2 if i < 4 else 1.4)
M['fin'] = len(rec.frames)
print('estado', rec.ev("() => { const d = JSON.parse(localStorage.getItem('bloquevilla_v1')); return JSON.stringify([d.theme, d.bricks, d.coleccion]); }"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

c = M['d3'] - 6
segs = [(c, c + 80),                                   # cold open: combo con escamas de dragón
        (M['album'], M['album'] + 56),                 # el álbum
        (M['tapdragon'], M['tapdragon'] + 75),         # tocar el Dragón: se pone el tema
        (M['pueblo'] + 2, M['pueblo'] + 82),           # trofeos en la colina
        (M['premio'] + 2, M['premio'] + 95),           # cobrar el 100 %
        (M['premio'] + 97, M['premio'] + 160)]         # resultado
render(rec, OUT, [[('VENCÍ AL DRAGÓN…', (255, 255, 255))], [('¡Y ME DIO SUS ESCAMAS!', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
