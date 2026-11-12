"""Clip BQ-08: terminar el pueblo. Cold open = escena final con fuegos artificiales. Luego: zona 1 completa -> Muelle ->
colina con el Castillo en ruinas -> tocarlo, Reconstruir -> se levanta -> escena final.
Sin subtítulos propios: la voz (guion BQ-08.json) pone los suyos."""
import sys
from cap import Recorder
from director import Finger
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'castillo.mp4'
TODOS = 'casa,panaderia,pozo,herreria,torre,plaza,muelle,barca,pescaderia,faro,astillero,mercado,granja,molino,biblioteca,mina,tesoreria'.split(',')


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


def ir(rec, zona):
    rec.ev(f"() => {{ window.__game.scene.getScenes(true)[0].scene.start('Village', {{ zona: {zona} }}); return 1; }}")
    rec.step(2)


rec = Recorder({'bricks': 1310, 'record': 13400, 'games': 186, 'oroVisto': True, 'misionesVistas': True, 'logrosVistos': True, 'built': TODOS,
                'tienda': {'temas': [], 'deco': ['arboles', 'farolas', 'flores', 'banderines', 'fuente'], 'visto': True},
                'logros': {'c': {'lineas': 4210, 'partidas': 186, 'puntos': 13400}}, 'guia': {'vistos': ['basico']}},
               query='&evento=off')
rec.begin()
M = {}
f = Finger(980, 1820)
M['z1'] = len(rec.frames)
ir(rec, 1)
f.wait(rec, 2.0, visible=False)
M['z2'] = len(rec.frames)
ir(rec, 2)
f.wait(rec, 2.0, visible=False)
M['z3'] = len(rec.frames)
ir(rec, 3)
f.wait(rec, 1.6, visible=False)
f.wait(rec, 0.3)
M['tap'] = len(rec.frames)
tap(rec, f, 540, 690, travel=0.5, after=0.9)          # el Castillo en ruinas
M['build'] = len(rec.frames)
tap(rec, f, 540, 1300, travel=0.45, after=2.6)        # Reconstruir
M['final'] = len(rec.frames)
f.wait(rec, 5.0, visible=False)
M['fin'] = len(rec.frames)
print('estado', rec.ev("() => { const d = JSON.parse(localStorage.getItem('bloquevilla_v1')); return JSON.stringify([d.built.length, d.bricks, d.finalVisto]); }"))
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

segs = [(M['final'] + 40, M['final'] + 120),       # cold open: escena final con fuegos
        (M['z1'] + 2, M['z1'] + 50),                # el pueblo
        (M['z2'] + 2, M['z2'] + 42),                # el muelle
        (M['z3'] + 2, M['z3'] + 50),                # la colina, castillo en ruinas
        (M['tap'], M['build'] + 70),                # tocar y reconstruir
        (M['build'] + 70, M['final'] + 40),         # se levanta el castillo
        (M['final'] + 120, M['final'] + 150)]       # final
render(rec, OUT, [[('TERMINÉ MI PUEBLO…', (255, 255, 255))], [('¡18 EDIFICIOS DESPUÉS!', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
