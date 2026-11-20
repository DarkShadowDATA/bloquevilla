"""Genera acertijos de Bloquevilla con respuesta única (8x8, filas y columnas llenas se borran juntas).
Tipos:
  primero : 3 piezas, el tablero se limpia todo solo si empiezas con UNA pieza en particular.
  cual    : 3 piezas, solo UNA pieza (en algún lugar) deja el tablero vacío.
  donde   : 1 pieza y 3 lugares marcados A/B/C; solo uno deja el tablero vacío (los otros completan 1 línea o nada).
"""
import itertools, json, random, sys

N = 8
FULL_ROW = [sum(1 << (r * N + c) for c in range(N)) for r in range(N)]
FULL_COL = [sum(1 << (r * N + c) for r in range(N)) for c in range(N)]
LINES = FULL_ROW + FULL_COL

FORMAS = {
    'I3h': [[0, 0], [0, 1], [0, 2]], 'I3v': [[0, 0], [1, 0], [2, 0]],
    'I4h': [[0, 0], [0, 1], [0, 2], [0, 3]], 'I4v': [[0, 0], [1, 0], [2, 0], [3, 0]],
    'O': [[0, 0], [0, 1], [1, 0], [1, 1]],
    'L': [[0, 0], [1, 0], [2, 0], [2, 1]], 'J': [[0, 1], [1, 1], [2, 0], [2, 1]],
    'Lh': [[0, 0], [0, 1], [0, 2], [1, 0]], 'Lh2': [[0, 2], [1, 0], [1, 1], [1, 2]],
    'T': [[0, 0], [0, 1], [0, 2], [1, 1]], 'Tu': [[0, 1], [1, 0], [1, 1], [1, 2]],
    'S': [[0, 1], [0, 2], [1, 0], [1, 1]], 'Z': [[0, 0], [0, 1], [1, 1], [1, 2]],
    'l3': [[0, 0], [1, 0], [1, 1]], 'l3b': [[0, 0], [0, 1], [1, 0]], 'l3c': [[0, 1], [1, 0], [1, 1]],
    'I2h': [[0, 0], [0, 1]], 'I2v': [[0, 0], [1, 0]],
}


def mask(cells, r, c):
    m = 0
    for dr, dc in cells:
        rr, cc = r + dr, c + dc
        if not (0 <= rr < N and 0 <= cc < N): return None
        m |= 1 << (rr * N + cc)
    return m


PLAC = {k: [(r, c, mask(v, r, c)) for r in range(N) for c in range(N) if mask(v, r, c) is not None] for k, v in FORMAS.items()}


def colocar(b, m):
    """Pone la pieza y borra líneas. Devuelve (tablero, líneas) o None si no cabe."""
    if b & m: return None
    b |= m
    full = [L for L in LINES if b & L == L]
    for L in full: b &= ~L
    return b, len(full)


def soluciones_todas(b, piezas):
    """Todas las órdenes (índices) con las que se limpia todo el tablero usando las 3 piezas."""
    res = []
    for orden in itertools.permutations(range(len(piezas))):
        if _rec(b, [piezas[i] for i in orden]): res.append(orden)
    return res


def _rec(b, resto):
    if not resto: return b == 0
    for _, _, m in PLAC[resto[0]]:
        x = colocar(b, m)
        if x and _rec(x[0], resto[1:]): return True
    return False


def una_limpia(b, k):
    return [(r, c) for r, c, m in PLAC[k] if (x := colocar(b, m)) and x[0] == 0]


def bits(b):
    return bin(b).count('1')


def sin_lineas(b):
    return not any(b & L == L for L in LINES)


def construir(pasos, rng):
    """pasos: lista de piezas en orden. Construye un tablero hacia atrás que se limpia todo con ese orden."""
    S = 0
    plan = []
    for k in reversed(pasos):
        for _ in range(400):
            nl = rng.choice([1, 2, 2, 3])
            Ls = rng.sample(LINES, nl)
            U = 0
            for L in Ls: U |= L
            if S & U: continue
            R = S | U
            cand = [(r, c, m) for r, c, m in PLAC[k] if m & R == m and m & U]
            if not cand: continue
            r, c, m = rng.choice(cand)
            prev = R & ~m
            if not sin_lineas(prev): continue
            x = colocar(prev, m)
            if x and x[0] == S:
                S = prev; plan.append((k, r, c)); break
        else:
            return None, None
    return S, list(reversed(plan))


def gen_primero(rng, objetivo_primero):
    """objetivo_primero: índice en la bandeja (0,1,2) de la pieza que debe ir primero."""
    nombres = list(FORMAS)
    for _ in range(20000):
        piezas = rng.sample(nombres, 3)
        if len({bits(mask(FORMAS[p], 0, 0)) for p in piezas}) < 2: continue
        orden = rng.sample(range(3), 3)
        if orden[0] != objetivo_primero: orden = [objetivo_primero] + [i for i in range(3) if i != objetivo_primero]
        b, plan = construir([piezas[i] for i in orden], rng)
        if b is None or not (26 <= bits(b) <= 40): continue
        sols = soluciones_todas(b, piezas)
        if sols and all(s[0] == objetivo_primero for s in sols):
            return b, piezas, plan, sols
    return None


def gen_cual(rng, objetivo):
    nombres = list(FORMAS)
    for _ in range(50000):
        piezas = rng.sample(nombres, 3)
        b, plan = construir([piezas[objetivo]], rng)
        if b is None or not (14 <= bits(b) <= 30): continue
        ok = [i for i in range(3) if una_limpia(b, piezas[i])]
        if ok == [objetivo] and len(una_limpia(b, piezas[objetivo])) == 1:
            # las otras tienen que caber en algún lado (si no, es obvio)
            if all(any(not (b & m) for _, _, m in PLAC[piezas[i]]) for i in range(3)):
                return b, piezas, plan
    return None


def gen_donde(rng, objetivo):
    """Una pieza (la del medio de la bandeja), tres lugares; el lugar `objetivo` limpia todo."""
    nombres = list(FORMAS)
    for _ in range(50000):
        k = rng.choice([n for n in nombres if len(FORMAS[n]) >= 3])
        b, plan = construir([k], rng)
        if b is None or not (18 <= bits(b) <= 36): continue
        buenos = una_limpia(b, k)
        if len(buenos) != 1: continue
        # señuelos: lugares legales que completan exactamente 1 línea (parecen buenos)
        br, bc = buenos[0]
        seno = [(-x[1], abs(r - br) + abs(c - bc), rng.random(), (r, c)) for r, c, m in PLAC[k]
                if (x := colocar(b, m)) and x[0] != 0 and abs(r - br) + abs(c - bc) >= 3]
        if len(seno) < 2: continue
        seno.sort()
        sen = [seno[0][3]] + [t[3] for t in seno[1:] if abs(t[3][0] - seno[0][3][0]) + abs(t[3][1] - seno[0][3][1]) >= 3][:1]
        if len(sen) < 2: continue
        lug = sen[:]
        lug.insert(objetivo, buenos[0])
        # que no se encimen los marcos
        ms = [mask(FORMAS[k], r, c) for r, c in lug]
        if any(ms[i] & ms[j] for i in range(3) for j in range(i + 1, 3)): continue
        otras = rng.sample([n for n in nombres if n != k], 2)
        return b, k, otras, lug
    return None


def tablero_txt(b, rng):
    col = 'roygbpk'
    return [''.join(rng.choice(col) if b >> (r * N + c) & 1 else '.' for c in range(N)) for r in range(N)]


if __name__ == '__main__':
    rng = random.Random(int(sys.argv[1]) if len(sys.argv) > 1 else 7)
    out = {}
    r = gen_primero(rng, 1); out['BQ-20'] = {'tipo': 'primero', 'board': tablero_txt(r[0], rng), 'piezas': r[1], 'plan': r[2], 'resp': 2, 'sols': r[3]}
    r = gen_donde(rng, 1); out['BQ-21'] = {'tipo': 'donde', 'board': tablero_txt(r[0], rng), 'pieza': r[1], 'otras': r[2], 'lugares': r[3], 'resp': 'B'}
    r = gen_cual(rng, 2); out['BQ-22'] = {'tipo': 'cual', 'board': tablero_txt(r[0], rng), 'piezas': r[1], 'plan': r[2], 'resp': 3}
    r = gen_primero(rng, 0); out['BQ-23'] = {'tipo': 'primero', 'board': tablero_txt(r[0], rng), 'piezas': r[1], 'plan': r[2], 'resp': 1, 'sols': r[3]}
    r = gen_donde(rng, 2); out['BQ-24'] = {'tipo': 'donde', 'board': tablero_txt(r[0], rng), 'pieza': r[1], 'otras': r[2], 'lugares': r[3], 'resp': 'C'}
    json.dump(out, open('acertijos.json', 'w'), indent=1)
    for k, v in out.items():
        print(k, v['tipo'], v.get('piezas') or v.get('pieza'), v.get('plan') or v.get('lugares'), v.get('sols', ''))
        print('\n'.join(v['board']))


def _lineas_por(m):
    return [L for L in LINES if L & m]


def gen_denso(rng, k, meta=3, n_senuelos=2, densidad=0.45):
    """Tablero lleno y natural: la pieza k en un lugar limpia `meta` líneas; en los señuelos limpia 1.
    Devuelve (tablero, lugar_bueno, señuelos)."""
    for _ in range(20000):
        r, c, m = rng.choice(PLAC[k])
        cand = _lineas_por(m)
        if len(cand) < meta: continue
        Ls = rng.sample(cand, meta)
        b = 0
        for L in Ls: b |= L
        b &= ~m
        sen = []
        for _ in range(n_senuelos):
            for _ in range(50):
                r2, c2, m2 = rng.choice(PLAC[k])
                if m2 & (m | b) or any(m2 & mask(FORMAS[k], *s) for s in sen) or abs(r2 - r) + abs(c2 - c) < 3: continue
                L2 = rng.choice(_lineas_por(m2))
                if L2 & m: continue
                b2 = (b | L2) & ~m2
                if b2 & m: continue
                b = b2; sen.append((r2, c2)); break
        if len(sen) < n_senuelos: continue
        prot = m
        for s in sen: prot |= mask(FORMAS[k], *s)
        for i in range(64):
            if not (prot >> i & 1) and not (b >> i & 1) and rng.random() < densidad:
                nb = b | (1 << i)
                if sin_lineas(nb): b = nb
        if not sin_lineas(b): continue
        res = [(x[1], (rr, cc)) for rr, cc, mm in PLAC[k] if (x := colocar(b, mm))]
        mejores = [p for n, p in res if n >= meta]
        if mejores != [(r, c)]: continue
        if any(colocar(b, mask(FORMAS[k], *s))[1] != 1 for s in sen): continue
        if not (34 <= bits(b) <= 46): continue
        return b, (r, c), sen
    return None


def gen_cual_denso(rng, objetivo, meta=3):
    """Tres piezas; solo la `objetivo` puede limpiar `meta` líneas (las otras, como mucho 1)."""
    nombres = [n for n in FORMAS if len(FORMAS[n]) >= 3]
    for _ in range(3000):
        piezas = rng.sample(nombres, 3)
        if len({len(FORMAS[p]) for p in piezas}) == 1 and rng.random() < 0.5: continue
        g = gen_denso(rng, piezas[objetivo], meta, n_senuelos=1)
        if not g: continue
        b = g[0]
        mx = [max([x[1] for _, _, mm in PLAC[p] if (x := colocar(b, mm))] or [-1]) for p in piezas]
        if mx[objetivo] >= meta and all(0 <= mx[i] <= 1 for i in range(3) if i != objetivo):
            return b, piezas, g[1]
    return None
