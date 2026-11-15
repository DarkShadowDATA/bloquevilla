"""BQ-18: 60 niveles en 3 mundos. Voz: 2.24 | 1.23 | 0.88 | 1.61 | 3.02 | 2.31"""
import sys
from cap import Recorder
from director import Finger
from edit import render
from comun_bq import base, cortes, escena

OUT = sys.argv[1]
A = "window.__game.scene.getScene('Aventura')"
rec = Recorder(base(aventura={'estrellas': [3] * 44 + [2, 3, 1] + [0] * 13, 'vistos': {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}}), query='&evento=off')
escena(rec, 'Aventura')
rec.step(10)
lim = rec.ev(f"() => {{ const s = {A}; return [s.minY, s.maxY]; }}")
print('limites', lim)
lo, hi = min(lim), max(lim)


def ir(y0, y1, seg):
    n = int(seg * 30)
    for k in range(n):
        t = (k + 1) / n
        t = t * t * (3 - 2 * t)
        y = y0 + (y1 - y0) * t
        rec.ev(f"() => {{ const s = {A}; s.mapa.y = {y}; if (s.pintarFondo) s.pintarFondo(); return 1; }}")
        rec.grab(None)


def quieto(y, seg):
    rec.ev(f"() => {{ const s = {A}; s.mapa.y = {y}; if (s.pintarFondo) s.pintarFondo(); return 1; }}")
    rec.hold(seg, None)


y = lambda i: max(lo, min(hi, 210 * i - 600))
rec.begin()
M = {}
M['pradera'] = len(rec.frames)
quieto(y(2), 1.0)
ir(y(2), y(16), 1.2)
M['puerto'] = len(rec.frames)
ir(y(16), y(30), 1.2)
quieto(y(30), 0.4)
M['montana'] = len(rec.frames)
ir(y(30), y(55), 1.6)
quieto(y(55), 2.6)
M['abrir'] = len(rec.frames)
rec.ev(f"() => {{ {A}.abrir(45); return 1; }}")
rec.hold(5.6, None)
print('frames', len(rec.frames), 'marcas', M, 'errores', rec.errors)
segs = cortes([(M['montana'] + 48, 2.24), (M['pradera'], 1.23), (M['puerto'] + 4, 0.88), (M['montana'] + 34, 1.61), (M['abrir'] + 2, 3.02), (M['abrir'] + 93, 2.31)])
render(rec, OUT, [[('60 NIVELES…', (255, 255, 255))], [('¡Y 3 MUNDOS!', (255, 217, 61))]], segs=segs, subs=None)
rec.close()
print('listo', OUT)
