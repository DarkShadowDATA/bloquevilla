"""Acertijos BQ-20..24 (formato del reto del 25 oct, para las 6 am).
Paso 1 (grabar):  python clip_acertijo.py grabar BQ-20      -> out/BQ-20.rec (cuadros + dedo + sonidos)
Paso 2 (armar):   python clip_acertijo.py armar BQ-20 voz/BQ-20/BQ-20.json out/BQ-20_sinvoz.mp4
El cuadro 0 ya es el reto congelado con la pregunta grande; luego cuenta de 3 y la respuesta jugada.
Los tableros salen de acertijos.json (acertijos_gen.py comprueba que solo hay una respuesta).
"""
import json, os, pickle, sys
from PIL import Image, ImageDraw

from cap import FPS
from director import setup_board, Finger, drag, SLOTS, TRAY_Y, CELL, BX, BY
from comun_bq import base

AQUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(AQUI, 'acertijos.json'), encoding='utf-8'))
FORMAS = __import__('acertijos_gen').FORMAS
COL = ['blue', 'orange', 'purple']
QUIETO = 15.0     # segundos de tablero quieto grabados (alcanza para la pregunta + la cuenta)

HOOK = {
    'BQ-20': ('¿CUÁL PIEZA VA PRIMERO?', 'para dejar el tablero VACÍO'),
    'BQ-21': ('¿DÓNDE LA PONDRÍAS?', 'para limpiar 3 LÍNEAS'),
    'BQ-22': ('¿CUÁL PIEZA LIMPIA', '3 LÍNEAS DE UN JALÓN?'),
    'BQ-23': ('¿CUÁL PIEZA VA PRIMERO?', 'para dejar el tablero VACÍO'),
    'BQ-24': ('¿DÓNDE LA PONDRÍAS?', 'para limpiar MÁS LÍNEAS'),
}


def bandeja(v):
    if v['tipo'] == 'donde':
        ps = [v['otras'][0], v['pieza'], v['otras'][1]]
    else:
        ps = v['piezas']
    return [[{'cells': FORMAS[p], 'color': COL[i]} for i, p in enumerate(ps)]]


def grabar(id):
    from cap import Recorder
    v = D[id]
    rec = Recorder(base(), query='&evento=off')
    rec.start_scene('Game')
    rec.step(30)
    setup_board(rec, v['board'], bandeja(v), score=0)
    rec.step(20)
    rec.begin()
    f = Finger(980, 1820)
    f.wait(rec, QUIETO, visible=False)
    marcas = {'jugada': len(rec.frames)}
    f.x, f.y = 540, 1700
    if v['tipo'] == 'donde':
        r, c = v['lugares']['ABC'.index(v['resp'])]
        drag(rec, f, 1, r, c, approach=0.35, travel=0.9, after=2.6)
    elif v['tipo'] == 'cual':
        _, r, c = v['plan'][0]
        drag(rec, f, int(v['resp']) - 1, r, c, approach=0.35, travel=0.9, after=2.6)
    else:
        for k, (nombre, r, c) in enumerate(v['plan']):
            slot = v['piezas'].index(nombre)
            marcas[f'p{k}'] = len(rec.frames)
            drag(rec, f, slot, r, c, approach=0.3, travel=0.65, after=0.5 if k < 2 else 2.6)
    f.move(rec, 990, 1880, 0.4)
    rec.hold(1.0, None)
    marcas['fin'] = len(rec.frames)
    print(id, 'cuadros', len(rec.frames), marcas, 'errores', rec.errors)
    print('tablero', rec.ev("() => JSON.stringify(window.__game.scene.getScene('Game').board.map(r => r.map(x => x ? 1 : 0).join('')))"))
    pickle.dump({'frames': rec.frames, 'pointers': rec.pointers, 'sfx': rec.sfx_log(), 'marcas': marcas},
                open(os.path.join(AQUI, 'out', f'{id}.rec'), 'wb'))
    rec.close()


class Grabado:
    def __init__(self, d):
        self.frames, self.pointers, self._sfx, self.marcas = d['frames'], d['pointers'], d['sfx'], d['marcas']

    def sfx_log(self):
        return self._sfx


def armar(id, guion, out):
    import edit
    from edit import render, to_video, F, W, BAND
    sys.path.insert(0, os.path.dirname(os.path.abspath(guion)) + '/..')
    import voz_reel, io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        _, lineas = voz_reel.voz_track(guion)
    if isinstance(lineas, list) and len(lineas) > 2:
        pass
    v = D[id]
    g = Grabado(pickle.load(open(os.path.join(AQUI, 'out', f'{id}.rec'), 'rb')))
    t_cuenta = lineas[1]['end'] + 0.25            # la cuenta empieza al terminar «Comenta tu respuesta»
    t_resp = t_cuenta + 3.0                       # 3, 2, 1 → respuesta
    Q = int(round(t_resp * FPS))
    a = g.marcas['jugada']
    assert Q <= a, 'falta tablero quieto'
    # la respuesta («¡Es la …!») suena justo cuando acaba la cuenta: se guarda el guion con ese tiempo fijo
    gj = json.load(open(guion, encoding='utf-8'))
    gj['voz']['lines'][2]['at'] = round(t_resp + 0.1, 2)
    json.dump(gj, open(guion, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with contextlib.redirect_stdout(io.StringIO()):
        _, lineas = voz_reel.voz_track(guion)
    fin_voz = lineas[-1]['end'] + 0.6
    b = min(g.marcas['fin'], a + int(round((fin_voz - t_resp) * FPS)))
    segs = [(0, Q), (a, b)]

    def tvid(i):
        return i / FPS if i < Q else t_resp + (i - a) / FPS

    S = edit.S
    def cel(r, c):
        x, y = to_video(BX + c * CELL, BY + r * CELL)
        return x, y, CELL * S

    resp = v['resp']
    etiquetas = []                                  # (texto, x, y, es_respuesta)
    if v['tipo'] == 'donde':
        for k, (r, c) in enumerate(v['lugares']):
            cells = [(r + dr, c + dc) for dr, dc in FORMAS[v['pieza']]]
            etiquetas.append(('ABC'[k], cells, 'ABC'[k] == resp))
    else:
        for k in range(3):
            etiquetas.append((str(k + 1), SLOTS[k], str(k + 1) == resp))

    def pill(img, y, texto, fill, color, size=58):
        d = ImageDraw.Draw(img)
        f = F(size)
        w = f.getlength(texto)
        lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(lay).rounded_rectangle([W / 2 - w / 2 - 40, y - 48, W / 2 + w / 2 + 40, y + 48], radius=48, fill=fill)
        img.paste(lay, (0, 0), lay)
        d.text((W / 2, y), texto, font=f, fill=color, anchor='mm', stroke_width=4, stroke_fill=(20, 10, 45))

    def flecha(img, x, y, color):
        d = ImageDraw.Draw(img)
        d.polygon([(x - 20, y - 14), (x + 20, y - 14), (x, y + 14)], fill=color)

    def overlay(img, i):
        t = tvid(i)
        d = ImageDraw.Draw(img)
        antes = t < t_resp
        lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(lay)
        for texto, pos, ok in etiquetas:
            if not antes and not ok:
                continue
            if t > t_resp + 1.2:
                continue                              # ya se ve la jugada: se quitan las marcas
            col = (255, 217, 61) if antes else (90, 220, 110)
            if v['tipo'] == 'donde':
                for r, c in pos:
                    x, y, s = cel(r, c)
                    ld.rounded_rectangle([x + 4, y + 4, x + s - 4, y + s - 4], radius=14, fill=col + (70,), outline=col + (255,), width=6)
                xs = [cel(r, c)[0] for r, c in pos]; ys = [cel(r, c)[1] for r, c in pos]
                cx, cy = (min(xs) + max(xs) + CELL * S) / 2, (min(ys) + max(ys) + CELL * S) / 2
            else:
                cx, cy = to_video(pos, TRAY_Y - 105)
            ld.ellipse([cx - 42, cy - 42, cx + 42, cy + 42], fill=(25, 12, 60, 235), outline=col + (255,), width=6)
        img.paste(lay, (0, 0), lay)
        for texto, pos, ok in etiquetas:
            if (not antes and not ok) or t > t_resp + 1.2:
                continue
            col = (255, 217, 61) if antes else (90, 220, 110)
            if v['tipo'] == 'donde':
                xs = [cel(r, c)[0] for r, c in pos]; ys = [cel(r, c)[1] for r, c in pos]
                cx, cy = (min(xs) + max(xs) + CELL * S) / 2, (min(ys) + max(ys) + CELL * S) / 2
            else:
                cx, cy = to_video(pos, TRAY_Y - 105)
            d.text((cx, cy), texto, font=F(54), fill=col, anchor='mm')
        if v['tipo'] == 'donde' and antes:           # la pieza de la pregunta, señalada en la bandeja
            px, py = to_video(SLOTS[1], TRAY_Y)
            d.ellipse([px - 120, py - 120, px + 120, py + 120], outline=(255, 217, 61), width=8)
        # aviso arriba del tablero
        if antes:
            pill(img, 585, 'Comenta tu respuesta    ', (25, 12, 60, 220), (255, 255, 255), 52)
            flecha(img, W / 2 + F(52).getlength('Comenta tu respuesta    ') / 2 - 22, 585, (255, 217, 61))
        else:
            pill(img, 585, f'RESPUESTA: {resp}', (40, 140, 70, 235), (255, 255, 255), 60)
        # cuenta 3-2-1 sobre el tablero
        if t_cuenta <= t < t_resp:
            k = t - t_cuenta
            n = 3 - int(k)
            pr = k - int(k)
            x0, y0 = to_video(BX, BY); x1, y1 = to_video(BX + 8 * CELL, BY + 8 * CELL)
            sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
            ImageDraw.Draw(sh).rounded_rectangle([x0, y0, x1, y1], radius=30, fill=(10, 6, 30, 120))
            img.paste(sh, (0, 0), sh)
            sc = 1.25 - 0.25 * min(1, pr * 4)
            d.text(((x0 + x1) / 2, (y0 + y1) / 2), str(n), font=F(int(300 * sc)), fill=(255, 255, 255), anchor='mm',
                   stroke_width=14, stroke_fill=(30, 10, 60))

    h1, h2 = HOOK[id]
    hook = [[(h1, (255, 255, 255))], [(h2, (255, 217, 61))]]
    edit.end_card = lambda last, k, n: None      # sin tarjeta final: un solo llamado a la acción
    render(g, out, hook, overlay, end_seconds=0.0, segs=segs, subs=None)
    print(f'{id}: cuenta {t_cuenta:.2f}–{t_resp:.2f} s, voz hasta {lineas[-1]["end"]:.2f} s, video {(Q + b - a) / FPS:.2f} s')


if __name__ == '__main__':
    if sys.argv[1] == 'grabar':
        grabar(sys.argv[2])
    else:
        armar(sys.argv[2], sys.argv[3], sys.argv[4])
