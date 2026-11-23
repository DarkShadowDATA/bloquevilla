"""BQ-AD2: video para el anuncio pagado de Meta (20-25 s). Junta 8 tomas cortas grabadas aparte:
combo x7 (cold open) -> mapa de 60 niveles -> bomba -> hielo -> dragón -> poder Rayo -> tienda (ladrillos) -> pueblo -> «Juega GRATIS».
Sin Pozo, sin Shadow, sin premios en dinero. Cierre sin «link en mi perfil» (en el anuncio va el botón).
Voz: voz/BQ-AD2/BQ-AD2.json (los cortes cuadran con los tiempos de cada frase).
  python clip_anuncio.py out/BQ-AD2_sinvoz.mp4           (todo)
  python clip_anuncio.py out/x.mp4 combo,mapa            (solo esas tomas, para revisar)"""
import random, sys
from PIL import ImageDraw
from cap import Recorder, FPS
from director import setup_board, Finger, drag, SLOTS, TRAY_Y, BX, BY, CELL
import edit
from edit import render, F, W
from comun_bq import base, escena, tap
import os, pickle
from PIL import Image
edit.LOGO = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets', 'img', 'logo.webp')).convert('RGBA')
edit.LOGO = edit.LOGO.crop(edit.LOGO.getbbox())
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'tomas_ad2')
os.makedirs(CACHE, exist_ok=True)


def tablero(rec, board, trays, score):
    setup_board(rec, board, trays, score=score)
    rec.ev(f"() => {{ {G}.capturaSinMisiones = true; return 1; }}")   # sin avisos de logros ni misiones encima del tablero

OUT = sys.argv[1]
SOLO = sys.argv[2].split(',') if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None
G = "window.__game.scene.getScene('Game')"
H = lambda n: [[0, i] for i in range(n)]
V = lambda n: [[i, 0] for i in range(n)]
SQ = [[0, 0], [0, 1], [1, 0], [1, 1]]
AV = {'jefe': True, 'cadena': True, 'hueco': True, 'raras': True}
# cuánto dura cada toma en el video (sale de la voz: inicio de la frase siguiente − inicio de la suya)
DUR = {'combo': 2.90, 'mapa': 3.40, 'bomba': 2.45, 'hielo': 2.10, 'dragon': 2.90, 'rayo': 2.57, 'tienda': 2.57, 'pueblo': 1.39}
n = lambda s: int(round(s * FPS))


class Toma:
    """Lo grabado de una toma, ya sin navegador."""
    def __init__(self, rec, ini):
        self.frames, self.pointers, self.log, self.ini = rec.frames, rec.pointers, rec.sfx_log(), ini
        print('  cuadros', len(rec.frames), 'inicio', ini, 'errores', rec.errors)
        rec.close()


def t_combo():
    rnd = random.Random(4)
    GAPS = {0: [2, 3, 4], 1: [5, 6, 7], 2: [0, 1, 2, 3], 3: [3, 4], 4: [3, 4], 5: [1, 2], 6: [4, 5, 6, 7], 7: [0, 1, 2]}
    board = [''.join('.' if c in GAPS[r] else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
    trays = [[{'cells': H(3), 'color': 'orange'}, {'cells': H(3), 'color': 'blue'}, {'cells': H(2), 'color': 'pink'}],
             [{'cells': H(4), 'color': 'green'}, {'cells': H(4), 'color': 'purple'}, {'cells': H(3), 'color': 'red'}],
             [{'cells': SQ, 'color': 'yellow'}, {'cells': [[0, 0]], 'color': 'blue'}, {'cells': [[0, 0], [1, 0], [1, 1]], 'color': 'pink'}]]
    rec = Recorder(base(), query='&evento=off')
    escena(rec, 'Game', "{ reto: false, modo: null }")
    rec.step(20)
    tablero(rec, board, trays, score=1840)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.3, visible=False)
    marks = []
    for i, (slot, r, c) in enumerate([(0, 7, 0), (1, 0, 2), (2, 5, 1), (0, 2, 0), (1, 6, 4), (2, 1, 5), (0, 3, 3)]):
        marks.append(len(rec.frames))
        drag(rec, f, slot, r, c, approach=0.3, after=0.45 if i < 6 else 1.8)
    return Toma(rec, marks[6] - n(0.25))   # arranca ya con el dedo llevando la última pieza: el x7 limpia todo ~1 s después


def t_mapa():
    A = "window.__game.scene.getScene('Aventura')"
    rec = Recorder(base(aventura={'estrellas': [3] * 44 + [2, 3, 1] + [0] * 13, 'vistos': AV}), query='&evento=off')
    escena(rec, 'Aventura')
    rec.step(10)
    lo, hi = sorted(rec.ev(f"() => {{ const s = {A}; return [s.minY, s.maxY]; }}"))
    y = lambda i: max(lo, min(hi, 210 * i - 600))
    pon = lambda v: rec.ev(f"() => {{ const s = {A}; s.mapa.y = {v}; if (s.pintarFondo) s.pintarFondo(); return 1; }}")
    rec.begin()
    pon(y(1)); rec.hold(0.3, None)
    k = n(2.6)
    for i in range(k):
        t = (i + 1) / k; t = t * t * (3 - 2 * t)
        pon(y(1) + (y(46) - y(1)) * t); rec.grab(None)
    rec.hold(0.8, None)
    return Toma(rec, 0)


def t_bomba():
    rec = Recorder(base(), query='&evento=off')
    escena(rec, 'Game', "{ reto: false, modo: null }")
    rec.step(20)
    board = ['ro....yg', 'p.g..b..', 'rgob.Ipk', 'g..k....', 'pyB..gbr', '..r.y...', '........', 'k.y.....']
    trays = [[{'cells': H(3), 'color': 'orange'}, {'cells': V(2), 'color': 'blue'}, {'cells': SQ, 'color': 'green'}],
             [{'cells': H(2), 'color': 'pink'}, {'cells': [[0, 0]], 'color': 'yellow'}, {'cells': [[0, 0]], 'color': 'purple'}]]
    tablero(rec, board, trays, score=3640)
    rec.ev(f"() => {{ const g = {G}; const k = 4 * 8 + 2; g.bombas[k] = 3; g.pintarBomba(k); g.linesTotal = 12; g.nextOffer = 999; return 1; }}")
    rec.step(2)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.3, visible=False)
    m1 = len(rec.frames)
    drag(rec, f, 0, 6, 0, approach=0.3, travel=0.45, after=0.3)      # baja a 1
    m2 = len(rec.frames)
    drag(rec, f, 2, 6, 3, approach=0.3, travel=0.45, after=0.3)
    drag(rec, f, 0, 4, 3, approach=0.3, travel=0.5, after=1.4)       # limpia su fila: desactivada
    return Toma(rec, m2 - n(0.1))


def t_hielo():
    BOARD = ['..p.....', '..o.....', '..y.....', '..k.....', 'rgIybko.', '..b.....', '..r.....', '........']
    ONE = lambda col: {'cells': [[0, 0]], 'color': col}
    rec = Recorder(base(aventura={'estrellas': [3] * 34, 'vistos': AV}), query='&evento=off')
    rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 34 }); return 1; }")
    rec.step(90)
    tablero(rec, BOARD, [[ONE('green'), ONE('blue'), ONE('orange')]], score=1640)
    rec.ev(f"() => {{ const g = {G}; g.av.progreso = 1; g.av.usadas = 5; g.avPintar(); return 1; }}")
    rec.step(2)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.3, visible=False)
    m1 = len(rec.frames)
    drag(rec, f, 0, 4, 7, approach=0.25, travel=0.4, after=0.45)    # fila: el hielo se agrieta
    drag(rec, f, 1, 7, 2, approach=0.25, travel=0.4, after=1.2)     # columna: se rompe
    return Toma(rec, m1 + n(0.2))


def t_dragon():
    BOARD = ['#......#', 'rgbyp.ko', 'oybkg.rp', 'pkrog.by', 'gby.rkop', 'kro.ybgp', '.r....o.', '#gb..ry#']
    TRAYS = [[{'cells': [[0, 0], [0, 1]], 'color': 'blue'}, {'cells': V(2), 'color': 'green'}, {'cells': V(3), 'color': 'purple'}]]
    rec = Recorder(base(bricks=2400, built=['casa', 'panaderia', 'pozo', 'herreria', 'torre', 'plaza', 'muelle', 'barca', 'pescaderia', 'faro', 'astillero', 'mercado'],
                        aventura={'estrellas': [3] * 59, 'vistos': AV}), query='&evento=off')
    rec.ev("() => { window.__game.scene.getScenes(true)[0].scene.start('Game', { nivel: 59 }); return 1; }")
    rec.step(60)
    tablero(rec, BOARD, TRAYS, score=8640)
    rec.ev(f"() => {{ const g = {G}; g.av.progreso = 51; g.av.usadas = 47; g.avPintar(); return 1; }}")
    rec.step(2)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.1, visible=False)
    m1 = len(rec.frames)
    drag(rec, f, 0, 7, 3, approach=0.3, travel=0.45, after=0.25)    # 1 línea: -1 vida
    f.wait(rec, 2.6)                                                  # ataque: avienta bloques
    return Toma(rec, m1 + n(0.35))


def t_rayo():
    rnd = random.Random(11)
    HOLES = {(r, 3) for r in (0, 1, 2, 5, 6, 7)} | {(3, 0), (4, 7)}
    board = [''.join('.' if (r, c) in HOLES else rnd.choice('roygbpk') for c in range(8)) for r in range(8)]
    SQ3 = [[r, c] for r in range(3) for c in range(3)]
    rec = Recorder(base(), query='&evento=off')
    escena(rec, 'Game', "{ reto: false, modo: null }")
    rec.step(20)
    tablero(rec, board, [[{'cells': V(4), 'color': 'blue'}, {'cells': V(4), 'color': 'orange'}, {'cells': SQ3, 'color': 'green'}]], score=3870)
    rec.ev(f"() => {{ const g = {G}; g.powers = ['rayo']; g.renderPowers(); return 1; }}")
    rec.step(2)
    rec.begin()
    f = Finger(860, 1700)
    f.wait(rec, 0.2, visible=False)
    ini = len(rec.frames)
    f.move(rec, 430, 1785, 0.35)
    rec.ev(f"() => {{ {G}.activatePower(0); return 1; }}")
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, 0.2)
    tx, ty = BX + 3 * CELL + CELL / 2, BY + 4 * CELL + CELL / 2
    f.move(rec, tx, ty, 0.4)
    rec.ev(f"() => {{ {G}.onBoardTap({{x: {tx}, y: {ty}}}); return 1; }}")
    f.wait(rec, 0.12, pressed=True)
    f.wait(rec, 0.5)
    drag(rec, f, 0, 4, 3, approach=0.3, travel=0.45, after=1.0)       # cabe y limpia
    return Toma(rec, ini)


def t_tienda():
    rec = Recorder(base(bricks=1480, tienda={'temas': [], 'deco': [], 'visto': True}), query='&evento=off')
    escena(rec, 'Shop', "{ tab: 'poderes' }")
    rec.step(20)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, 0.15, visible=False)
    tap(rec, f, 290, 750, travel=0.35, after=0.45)    # compra un poder con ladrillos
    tap(rec, f, 415, 265, travel=0.3, after=0.25)     # pestaña Temas
    tap(rec, f, 290, 750, travel=0.3, after=1.2)      # compra un tema
    return Toma(rec, 0)


def t_pueblo():
    rec = Recorder(base(bricks=900, built=['casa', 'panaderia', 'pozo', 'herreria', 'torre']), query='&evento=off')
    escena(rec, 'Village', "{ zona: 1 }")
    rec.step(20)
    rec.ev("() => { const s = window.__game.scene.getScene('Village'); if (s._toast) { s._toast.destroy(); s._toast = null; } return 1; }")
    rec.begin()
    f = Finger(700, 1300)
    f.wait(rec, 0.1, visible=False)
    ini = len(rec.frames)
    f.move(rec, 885, 1450, 0.2)
    f.wait(rec, 0.08, pressed=True)
    rec.ev("() => { const v = window.__game.scene.getScene('Village'); const i = v.lista.findIndex(b => b.id === 'plaza'); v.build(v.lista[i], i); return 1; }")
    f.wait(rec, 1.6)
    return Toma(rec, ini)


ORDEN = ['combo', 'mapa', 'bomba', 'hielo', 'dragon', 'rayo', 'tienda', 'pueblo']
TOMAS = {'combo': t_combo, 'mapa': t_mapa, 'bomba': t_bomba, 'hielo': t_hielo, 'dragon': t_dragon, 'rayo': t_rayo, 'tienda': t_tienda, 'pueblo': t_pueblo}


class Junta:
    """Todas las tomas una tras otra, con el formato que espera edit.render."""
    def __init__(self, tomas):
        self.frames, self.pointers, self.log, self.segs = [], [], [], []
        for nombre, t in tomas:
            off = len(self.frames)
            self.frames += t.frames
            self.pointers += t.pointers
            self.log += [(a, b, s + off / FPS) for a, b, s in t.log]
            a = off + t.ini
            b = min(off + len(t.frames), a + n(DUR[nombre]))
            if b - a < n(DUR[nombre]):
                print(f'  ojo: a la toma {nombre} le faltan {(n(DUR[nombre]) - (b - a)) / FPS:.2f} s')
            self.segs.append((a, b))

    def sfx_log(self):
        return self.log


if __name__ == '__main__':
    nombres = [x for x in ORDEN if not SOLO or x in SOLO]
    tomas = []
    for x in nombres:
        pk = os.path.join(CACHE, x + '.pkl')
        if os.path.exists(pk) and '--regrabar' not in sys.argv:
            print('toma', x, '(guardada)'); t = pickle.load(open(pk, 'rb'))
        else:
            print('toma', x); t = TOMAS[x](); pickle.dump(t, open(pk, 'wb'))
        tomas.append((x, t))
    J = Junta(tomas)
    viejo = edit.end_card
    edit.end_card = lambda last, k, total: cierre_con(viejo, last, k, total)

    def cierre_con(orig, last, k, total):
        img = orig(last, k, total)
        if k > 0.45 * FPS:
            d = ImageDraw.Draw(img)
            d.rounded_rectangle([190, 1090, 890, 1210], radius=60, fill=(90, 200, 90))
            d.text((W / 2, 1150), 'Toca el botón de abajo', font=F(48), fill=(255, 255, 255), anchor='mm')
        return img
    hook = [[('COMBO x7…', (255, 255, 255))], [('¡Y EL TABLERO LIMPIO!', (255, 217, 61))]]
    render(J, OUT, hook, segs=J.segs, subs=None, end_seconds=2.5 if not SOLO else 0.5)
    print('listo', OUT)
