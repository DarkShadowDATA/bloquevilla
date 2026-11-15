"""Ayudas comunes de la tanda BQ-10 a BQ-19."""
F = 30
d = lambda s: int(round(s * F))
BASE = {'bricks': 1500, 'record': 11800, 'games': 120, 'sound': True, 'oroVisto': True, 'misionesVistas': True, 'logrosVistos': True,
        'built': ['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza'],
        'peligros': {'bomba': True, 'hielo': True},
        'guia': {'vistos': ['basico', 'jefe', 'bomba', 'hielo', 'oro', 'cadena', 'hueco', 'raras']}}


def base(**kw):
    s = dict(BASE)
    s.update(kw)
    return s


def tap(rec, f, x, y, travel=0.35, after=0.4):
    f.move(rec, x, y, travel)
    rec.page.mouse.click(x * 0.5, y * 0.5)
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, after)


def escena(rec, key, data='{}'):
    rec.ev(f"() => {{ window.__game.scene.getScenes(true)[0].scene.start('{key}', {data}); return 1; }}")
    rec.step(2)


def celda(r, c):
    return 100 + c * 110 + 55, 420 + r * 110 + 55


def cortes(marcas_y_duraciones):
    """[(inicio, segundos)] -> [(inicio, fin)]"""
    return [(a, a + d(s)) for a, s in marcas_y_duraciones]
