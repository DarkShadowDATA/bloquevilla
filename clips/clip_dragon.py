"""Clip BQ-06: el Dragón, último jefe de la Aventura (nivel 60). Cold open = golpe final (combo x3, cae el dragón).
Luego: el dragón aparece (le quedan 9 vidas) -> 1 línea (-1) -> ataque (avienta tierra) -> 2 líneas (combo) -> 3 líneas y gana.
Sin subtítulos propios: la voz (guion BQ-06.json, skill voz-reels) pone los suyos."""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'dragon.mp4'
G = "window.__game.scene.getScene('Game')"
V = lambda n: [[i, 0] for i in range(n)]
BOARD = ['#......#',
         'rgbyp.ko',
         'oybkg.rp',
         'pkrog.by',
         'gby.rkop',
         'kro.ybgp',
         '.r....o.',
         '#gb..ry#']
TRAYS = [[{'cells': [[0, 0], [0, 1]], 'color': 'blue'}, {'cells': V(2), 'color': 'green'}, {'cells': V(3), 'color': 'purple'}]]

rec = Recorder({'bricks': 2400, 'record': 12800, 'games': 140, 'sound': True, 'oroVisto': True, 'misionesVistas': True, 'logrosVistos': True,
                'built': ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza', 'muelle', 'barca', 'pescaderia', 'faro', 'astillero', 'mercado'],
                'aventura': {'estrellas': [3] * 59, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}},
                'peligros': {'bomba': True, 'hielo': True}, 'guia': {'vistos': ['basico']}},
               query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 59 }); return 1; }")
rec.step(60)   # deja pasar la entrada automática del jefe
setup_board(rec, BOARD, TRAYS, score=8640)
rec.ev(f"() => {{ const g = {G}; g.av.progreso = 51; g.av.usadas = 47; g.avPintar(); return 1; }}")
rec.step(2)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
M['intro'] = len(rec.frames)
rec.ev(f"() => {{ {G}.jefeAparece(2.2); return 1; }}")
f.wait(rec, 2.9, visible=False)
M['m1'] = len(rec.frames)
drag(rec, f, 0, 7, 3, approach=0.3, travel=0.45, after=0.25)
M['ataque'] = len(rec.frames)
f.wait(rec, 2.4)
M['m2'] = len(rec.frames)
drag(rec, f, 1, 4, 3, approach=0.3, travel=0.45, after=0.9)
M['m3'] = len(rec.frames)
drag(rec, f, 2, 1, 5, approach=0.3, travel=0.45, after=0.1)
M['gana'] = len(rec.frames)
f.wait(rec, 5.5, visible=False)
M['fin'] = len(rec.frames)
print('estado', rec.ev(f"() => {{ const g = {G}; return JSON.stringify([g.av.progreso, g.av.usadas, g.av.fin, g.combo]); }}"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

m3 = M['m3'] + 14   # justo antes de soltar la última pieza
segs = [(m3, m3 + 78),                       # cold open: golpe final y cae (voz 0-2.5 s)
        (M['intro'], M['intro'] + 72),       # el dragón aparece, 9 vidas
        (M['m1'] + 6, M['m1'] + 60),         # 1 línea
        (M['ataque'] - 2, M['ataque'] + 58), # avienta bloques
        (M['m2'] + 4, M['m2'] + 58),         # combo
        (M['m3'] + 6, M['m3'] + 48),         # combo x3 y cae
        (M['gana'], M['gana'] + 92)]         # nivel superado + pregunta
render(rec, OUT, [[('EL ÚLTIMO JEFE…', (255, 255, 255))], [('¡ES UN DRAGÓN!', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
