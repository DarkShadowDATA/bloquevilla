"""Clip 3: de ruinas a pueblo completo, edificio por edificio."""
import sys
from cap import Recorder
from director import Finger
from edit import render

OUT = sys.argv[1] if len(sys.argv) > 1 else 'pueblo.mp4'
BUILDINGS = [
    {'id': 'casa', 'name': 'Casa', 'cost': 20, 'unlock': 'Poder Deshacer'},
    {'id': 'panaderia', 'name': 'Panadería', 'cost': 60, 'unlock': 'Recompensa diaria'},
    {'id': 'pozo', 'name': 'Pozo', 'cost': 120, 'unlock': 'Tema de bloques "Agua"'},
    {'id': 'herreria', 'name': 'Herrería', 'cost': 200, 'unlock': 'Poder Doble ladrillo'},
    {'id': 'torre', 'name': 'Torre', 'cost': 300, 'unlock': 'Poder Segunda oportunidad'},
    {'id': 'plaza', 'name': 'Plaza', 'cost': 450, 'unlock': 'Zona 2 (próximamente)'},
]
PLOTS = [[245, 750], [840, 770], [245, 1140], [840, 1160], [245, 1550], [845, 1570]]

rec = Recorder({'bricks': 1150, 'built': []})
rec.start_scene('Village')
rec.ev("() => { const s = window.__game.scene.getScene('Village'); if (s._toast) { s._toast.destroy(); s._toast = null; } return 1; }")
rec.step(2)
rec.begin()
f = Finger(980, 1820)
f.wait(rec, 0.9, visible=False)
for i, b in enumerate(BUILDINGS):
    x, gy = PLOTS[i]
    f.move(rec, x + 40, gy - 120, 0.35)
    f.wait(rec, 0.08, pressed=True)
    rec.ev(f"(b) => {{ window.__game.scene.getScene('Village').build(b, {i}); return 1; }}", b)
    f.wait(rec, 1.05 if i < 5 else 1.4)
f.move(rec, 990, 1850, 0.4)
rec.hold(1.5, None)
print('frames', len(rec.frames), 'errores', rec.errors)
render(rec, OUT, [[('De ', (255, 255, 255)), ('RUINAS', (190, 190, 205)), (' a ', (255, 255, 255)), ('PUEBLO', (120, 230, 120))],
                  [('¿Cuánto te tardarías tú?', (255, 255, 255))]])
rec.close()
print('listo', OUT)
