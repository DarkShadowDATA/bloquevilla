"""Clip: Zona 2, el Muelle. Pueblo completo -> "Ir al Muelle" -> todo en ruinas -> se reconstruye el Muelle
con el panel y luego los otros 5 seguidos, cada uno con su bono. Cold open: el Faro levantándose."""
import sys
from cap import Recorder, FPS
from director import Finger
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'muelle.mp4'
V = "window.__game.scene.getScene('Village')"
IDS = ['muelle', 'barca', 'pescaderia', 'faro', 'astillero', 'mercado']
BONO = {'muelle': '+10% de ladrillos', 'barca': 'regalo diario DOBLE', 'pescaderia': 'más bloques dorados',
        'faro': 'bombas +2 turnos', 'astillero': '3er espacio de poder', 'mercado': '20% de descuento'}
NOMBRE = {'muelle': 'Muelle', 'barca': 'Barca', 'pescaderia': 'Pescadería', 'faro': 'Faro', 'astillero': 'Astillero', 'mercado': 'Mercado'}


def tap(rec, f, x, y, travel=0.4, after=0.5):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


rec = Recorder({'bricks': 2600, 'record': 9800, 'games': 60, 'built': ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza'],
                'oroVisto': True, 'tienda': {'temas': [], 'deco': ['arboles', 'farolas', 'flores'], 'visto': True}}, query='&evento=off')
rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Village', { zona: 1 }); return 1; }")
rec.step(3)
rec.ev(f"() => {{ const v = {V}; if (v._toast) {{ v._toast.destroy(); v._toast = null; }} return 1; }}")
rec.begin()
M = {}
f = Finger(980, 1820)
f.wait(rec, 0.1, visible=False)
f.wait(rec, 0.2)
M['ir'] = len(rec.frames)
tap(rec, f, 540, 345, travel=0.35, after=0.7)        # Ir al Muelle
M['ruinas'] = len(rec.frames)
tap(rec, f, 250, 720, travel=0.4, after=0.5)        # Muelle
tap(rec, f, 540, 1300, travel=0.35, after=1.25)      # Reconstruir
M['muelle'] = M['ruinas']
for i, id in enumerate(IDS[1:], start=1):
    M[id] = len(rec.frames)
    rec.ev(f"() => {{ const v = {V}; if (v._toast) {{ v._toast.destroy(); v._toast = null; }} v.build(v.lista[{i}], {i}); return 1; }}")
    rec.hold(1.05 if id != 'mercado' else 1.35, None)
M['todo'] = len(rec.frames)
rec.hold(0.7, None)
M['fin'] = len(rec.frames)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)

c = M['faro'] + 12
segs = [(c, c + 36), (0, M['fin'])]
subs = [(c, c + 36, f"Faro: {BONO['faro']}", 0),
        (0, M['ruinas'], 'Mi pueblo ya estaba completo…', 1),
        (M['ruinas'], M['ruinas'] + 30, '¡Se abrió la Zona 2: el MUELLE!', 1),
        (M['ruinas'] + 30, M['barca'], f"Muelle: {BONO['muelle']}", 1)]
for k, id in enumerate(IDS[1:], start=1):
    fin = M[IDS[k + 1]] if k + 1 < len(IDS) else M['todo']
    subs.append((M[id], fin, f"{NOMBRE[id]}: {BONO[id]}", 1))
subs.append((M['todo'], M['fin'], '¿Cuál bono quieres primero?', 1))
render(rec, OUT, [[('Mi pueblo ahora tiene ', (255, 255, 255)), ('PUERTO', (90, 200, 255))],
                  [('y cada edificio da un BONO', (255, 217, 61))]], segs=segs, subs=subs, sub_y=1800)
rec.close()
print('listo', OUT)
