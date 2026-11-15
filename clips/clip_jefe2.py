"""Clips BQ-10 (Topo, nivel 10) y BQ-11 (Yeti, nivel 50): jefe aparece -> 1 línea -> ataque -> 2 líneas -> 3 líneas y gana.
Uso: python3 clip_jefe2.py topo|yeti salida.mp4. Los cortes van a la medida de la voz (BQ-10.json / BQ-11.json)."""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render

QUE = sys.argv[1]
OUT = sys.argv[2]
G = "window.__game.scene.getScene('Game')"
V = lambda n: [[i, 0] for i in range(n)]
F = 30
if QUE == 'topo':
    NIVEL, PROG, USADAS = 9, 3, 7
    BOARD = ['........', 'rgbyp.ko', 'oybkg.rp', 'pkrog.by', 'gbT.rkop', 'kro.yTgp', '.r....o.', 'rgb..ryo']
    HOOK = [[('EL PRIMER JEFE…', (255, 255, 255))], [('¡UN TOPO GIGANTE!', (255, 217, 61))]]
else:
    NIVEL, PROG, USADAS = 49, 27, 24
    BOARD = ['........', 'rgbyp.ko', 'oybkg.rp', 'pkrog.by', 'gbI.rkop', 'kro.ybgp', '.r....o.', 'rgb..ryo']
    HOOK = [[('ESTE YETI…', (255, 255, 255))], [('¡ME CONGELA EL TABLERO!', (120, 220, 255))]]
TRAYS = [[{'cells': [[0, 0], [0, 1]], 'color': 'blue'}, {'cells': V(2), 'color': 'green'}, {'cells': V(3), 'color': 'purple'}]]

rec = Recorder({'bricks': 1500, 'record': 11800, 'games': 120, 'sound': True, 'oroVisto': True, 'misionesVistas': True, 'logrosVistos': True,
                'built': ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza'],
                'aventura': {'estrellas': [3] * NIVEL, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}},
                'peligros': {'bomba': True, 'hielo': True}, 'guia': {'vistos': ['basico', 'jefe', 'bomba', 'hielo']}},
               query='&evento=off')
rec.ev(f"() => {{ window.__game.scene.getScenes(true)[0].scene.start('Game', {{ nivel: {NIVEL} }}); return 1; }}")
rec.step(60)
setup_board(rec, BOARD, TRAYS, score=4200)
rec.ev(f"() => {{ const g = {G}; g.av.progreso = {PROG}; g.av.usadas = {USADAS}; g.avPintar(); return 1; }}")
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
f.wait(rec, 2.6)
M['m2'] = len(rec.frames)
drag(rec, f, 1, 4, 3, approach=0.3, travel=0.45, after=0.9)
M['m3'] = len(rec.frames)
drag(rec, f, 2, 1, 5, approach=0.3, travel=0.45, after=0.1)
M['gana'] = len(rec.frames)
f.wait(rec, 3.5, visible=False)
print('estado', rec.ev(f"() => {{ const g = {G}; return JSON.stringify([g.av.progreso, g.av.usadas, g.av.fin, g.combo]); }}"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
d = lambda s: int(round(s * F))
if QUE == 'topo':   # voz: 2.40 | 2.44 | 1.85 | 2.51 | 2.05 | 2.08
    segs = [(M['ataque'] - 2, M['ataque'] - 2 + d(2.40)),     # el topo avienta tierra
            (M['intro'], M['intro'] + d(2.44)),                # aparece, 9/12
            (M['m1'] + 8, M['m1'] + 8 + d(1.85)),              # 1 línea
            (M['ataque'] - 2, M['ataque'] - 2 + d(2.51)),      # me llena de tierra
            (M['m2'] + 4, M['m2'] + 4 + d(2.05)),              # la tierra se limpia
            (M['m3'] + 6, M['m3'] + 6 + d(2.08))]              # golpe final y gana
else:               # voz: 1.69 | 2.56 | 2.20 | 2.36 | 2.01 | 2.16
    segs = [(M['ataque'] + 6, M['ataque'] + 6 + d(1.69)),     # avienta hielo
            (M['intro'], M['intro'] + d(2.56)),                # aparece en la montaña
            (M['m1'] + 14, M['m1'] + 14 + d(2.20)),            # línea + ataque de hielo
            (M['m2'] + 4, M['m2'] + 4 + d(2.36)),              # el hielo se agrieta
            (M['m3'] + 6, M['m3'] + 6 + d(2.01)),              # cada línea le quita vida
            (M['gana'] + 4, M['gana'] + 4 + d(2.16))]          # nivel superado
render(rec, OUT, HOOK, segs=segs, subs=None)
rec.close()
print('listo', OUT)
