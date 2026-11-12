"""Clip BQ-09 (formato A, desafío): cadenas. Cold open = lleno la fila y el bloque encadenado (parado) no se rompe.
Luego: la misma jugada -> completo su columna y se rompe -> la cadena acostada se rompe con su fila -> nivel superado.
Sin subtítulos propios: la voz (guion BQ-09.json) pone los suyos."""
import sys
from cap import Recorder
from director import setup_board, Finger, drag
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'cadenas.mp4'
G = "window.__game.scene.getScene('Game')"
BOARD = ['..r.....',
         'rob.kHyg',
         '..y.....',
         '..g.....',
         'rgVyb.op',
         '..p.....',
         '........',
         '........']
TRAYS = [[{'cells': [[0, 0]], 'color': 'green'}, {'cells': [[0, 0], [1, 0]], 'color': 'orange'}, {'cells': [[0, 0], [0, 1]], 'color': 'blue'}]]

rec = Recorder({'bricks': 640, 'record': 9100, 'games': 90, 'oroVisto': True, 'misionesVistas': True, 'logrosVistos': True,
                'built': ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza'],
                'aventura': {'estrellas': [3] * 22, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}},
                'peligros': {'bomba': True, 'hielo': True}, 'guia': {'vistos': ['basico']}},
               query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 22 }); return 1; }")
rec.step(90)
setup_board(rec, BOARD, TRAYS, score=1260)
rec.ev(f"() => {{ const g = {G}; g.av.progreso = 0; g.av.usadas = 3; g.avPintar(); return 1; }}")
rec.step(2)
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.5)
M['m1'] = len(rec.frames)
drag(rec, f, 0, 4, 5, approach=0.35, travel=0.5, after=1.6)
M['m2'] = len(rec.frames)
drag(rec, f, 1, 6, 2, approach=0.35, travel=0.5, after=1.2)
M['m3'] = len(rec.frames)
drag(rec, f, 2, 1, 2, approach=0.35, travel=0.6, after=0.2)
M['gana'] = len(rec.frames)
f.wait(rec, 4.5, visible=False)
print('estado', rec.ev(f"() => {{ const g = {G}; return JSON.stringify([g.av.progreso, g.av.usadas, g.av.fin]); }}"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

segs = [(M['m1'] + 22, M['m2'] - 4),                  # cold open: la fila se limpia y la cadena se queda
        (M['m1'] - 10, M['m1'] + 30),                 # la misma jugada, desde antes
        (M['m2'], M['m3'] - 4),                       # completo la columna: se rompe
        (M['m3'], M['gana'] + 25),                    # la acostada con su fila
        (M['gana'] + 25, M['gana'] + 130)]            # nivel superado
render(rec, OUT, [[('LLENÉ LA FILA…', (255, 255, 255))], [('¿Y NO SE ROMPIÓ?', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
