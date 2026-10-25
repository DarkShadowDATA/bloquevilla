"""Edición de clips: arma el video vertical final con gancho, dedo, tarjeta final y audio."""
import math, os, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from cap import frame_image, FPS, ROOT

W, H = 1080, 1920
BAND = 300                      # franja superior con el texto gancho
S = (H - BAND) / 1920           # escala del juego dentro del video
GW, GH = int(1080 * S), H - BAND
GX = (W - GW) // 2
SR = 44100
FD = '/usr/share/fonts/truetype/google-fonts/'
_fc = {}


def F(size, w='Bold'):
    k = (int(size), w)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FD + f'Poppins-{w}.ttf', int(size))
    return _fc[k]


def to_video(x, y):
    return GX + x * S, BAND + y * S


# ---------------- audio ----------------
def _tone(buf, t0, freq, dur, typ='sine', vol=0.14, when=0.0, slide=0.0):
    start = int((t0 + when) * SR)
    n = int((dur + 0.02) * SR)
    if start < 0 or start >= len(buf):
        return
    n = min(n, len(buf) - start)
    t = np.arange(n) / SR
    if slide:
        f = freq * (max(40, freq * slide) / freq) ** np.clip(t / dur, 0, 1)
    else:
        f = np.full(n, freq)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if typ == 'sine':
        w = np.sin(ph)
    elif typ == 'triangle':
        w = 2 / np.pi * np.arcsin(np.sin(ph))
    elif typ == 'square':
        w = np.sign(np.sin(ph)) * 0.6
    else:
        w = ((ph / (2 * np.pi)) % 1) * 2 - 1
    with np.errstate(over='ignore', invalid='ignore'):
        env = np.where(t < 0.01, 0.0001 * (vol / 0.0001) ** (t / 0.01), vol * (0.0001 / vol) ** np.clip((t - 0.01) / max(dur - 0.01, 1e-3), 0, 1))
    env[t > dur] = 0
    buf[start:start + n] += w * env


def _semis(base, n):
    return base * 2 ** (n / 12)


SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]


def play_sfx(buf, name, args, t):
    T = lambda *a, **k: _tone(buf, t, *a, **k)
    if name == 'click': T(660, 0.06, 'triangle', 0.08)
    elif name == 'pick': T(420, 0.07, 'triangle', 0.07, slide=1.4)
    elif name == 'place': T(180, 0.09, 'triangle', 0.16, slide=0.7)
    elif name == 'back': T(300, 0.1, 'sine', 0.06, slide=0.6)
    elif name == 'clear':
        combo = args[0] if args else 1
        f = _semis(523, SCALE[min(combo - 1, len(SCALE) - 1)])
        T(f, 0.22, 'sine', 0.13); T(f * 1.5, 0.28, 'sine', 0.07, when=0.05)
    elif name == 'combo':
        n = args[0] if args else 2
        for i in range(min(n + 1, 5)):
            T(_semis(784, SCALE[i]), 0.14, 'square', 0.04, when=0.08 + i * 0.06)
    elif name == 'power':
        for i, s in enumerate([0, 4, 7, 12]): T(_semis(523, s), 0.18, 'sine', 0.1, when=i * 0.07)
    elif name == 'tick': T(1250, 0.05, 'square', 0.05)
    elif name == 'error': T(160, 0.12, 'square', 0.05)
    elif name == 'boom': T(120, 0.35, 'saw', 0.12, slide=0.3)
    elif name == 'coin': T(988, 0.08, 'sine', 0.08); T(1318, 0.14, 'sine', 0.08, when=0.07)
    elif name == 'build':
        T(110, 0.25, 'triangle', 0.2, slide=0.6)
        for i, s in enumerate([0, 4, 7, 12, 16]): T(_semis(523, s), 0.2, 'sine', 0.09, when=0.25 + i * 0.08)
    elif name == 'over':
        for i, s in enumerate([7, 4, 0, -5]): T(_semis(392, s), 0.25, 'triangle', 0.1, when=i * 0.14)


def music(dur):
    """Música de fondo suave: acordes C-Am-F-G con arpegio."""
    buf = np.zeros(int(dur * SR) + SR)
    beat = 60 / 100
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    mid = lambda m: 440 * 2 ** ((m - 69) / 12)
    t = 0.0
    i = 0
    while t < dur:
        ch = chords[i % 4]
        for m in ch:  # colchón
            _tone(buf, t, mid(m - 12), beat * 4, 'sine', 0.035)
        for k in range(8):  # arpegio en corcheas
            m = ch[k % 3] + (12 if k >= 4 else 0)
            _tone(buf, t + k * beat / 2, mid(m), 0.25, 'triangle', 0.035)
        for k in range(4):  # golpe suave
            _tone(buf, t + k * beat, 70, 0.18, 'sine', 0.18, slide=0.5)
        t += beat * 4
        i += 1
    return buf[:int(dur * SR)]


def build_audio(sfx_log, dur, path, end_at=None):
    buf = np.zeros(int(dur * SR))
    for name, args, t in sfx_log:
        if 0 <= t < dur:
            play_sfx(buf, name, args, t)
    if end_at is not None:
        play_sfx(buf, 'power', [], end_at)
    mix = buf * 1.6 + music(dur) * 0.8
    peak = np.max(np.abs(mix)) or 1
    mix = mix / peak * 0.9
    fade = int(0.4 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


# ---------------- imagen ----------------
def background(game):
    small = game.resize((108, 192)).filter(ImageFilter.GaussianBlur(6))
    bg = small.resize((W, H), Image.BILINEAR)
    return Image.blend(bg, Image.new('RGB', (W, H), (10, 8, 30)), 0.45)


def draw_hook(img, lines, alpha=1.0):
    """lines: lista de listas de (texto, color)."""
    lay = Image.new('RGBA', (W, BAND), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = F(76)
    lh = 92
    y0 = BAND / 2 - (len(lines) - 1) * lh / 2
    for i, parts in enumerate(lines):
        fl = f
        total = sum(fl.getlength(t) for t, _ in parts)
        if total > W - 80:  # la línea no cabe: se achica hasta que quepa
            fl = F(int(76 * (W - 80) / total))
            total = sum(fl.getlength(t) for t, _ in parts)
        x = W / 2 - total / 2
        for t, col in parts:
            d.text((x, y0 + i * lh), t, font=fl, fill=col + (int(255 * alpha),), anchor='lm',
                   stroke_width=8, stroke_fill=(20, 10, 45, int(255 * alpha)))
            x += fl.getlength(t)
    img.paste(lay, (0, 0), lay)


def draw_finger(img, p):
    if not p:
        return
    x, y, pressed = p
    X, Y = to_video(x, y)
    lay = Image.new('RGBA', (220, 220), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    c = 110
    r = 40 * (0.82 if pressed else 1)
    if pressed:
        d.ellipse([c - r - 26, c - r - 26, c + r + 26, c + r + 26], outline=(255, 255, 255, 150), width=6)
    d.ellipse([c - r + 5, c - r + 10, c + r + 5, c + r + 10], fill=(0, 0, 0, 80))
    d.ellipse([c - r, c - r, c + r, c + r], fill=(255, 255, 255, 225), outline=(200, 200, 225, 255), width=5)
    img.paste(lay, (int(X - c), int(Y - c)), lay)


def big_center_text(img, text, size, color, prog=1.0, y=None, stroke=(30, 10, 60)):
    sc = 0.3 + 0.7 * min(1, prog * 3) if prog < 0.34 else 1.0
    f = F(size * sc)
    d = ImageDraw.Draw(img)
    d.text((W / 2, y or H / 2), text, font=f, fill=color, anchor='mm', stroke_width=int(12 * sc), stroke_fill=stroke)


LOGO = None


def end_card(last_game, k, n):
    global LOGO
    if LOGO is None:
        p = os.path.join(ROOT, 'assets_originales', 'logo.png')
        LOGO = Image.open(p).convert('RGBA')
        LOGO = LOGO.crop(LOGO.getbbox())
    img = background(last_game)
    img = Image.blend(img, Image.new('RGB', (W, H), (20, 12, 50)), 0.35)
    pr = min(1, k / (0.35 * FPS))
    e = 1 - (1 - pr) ** 3
    lw = int(880 * (0.6 + 0.4 * e))
    lg = LOGO.resize((lw, int(LOGO.height * lw / LOGO.width)))
    img.paste(lg, (W // 2 - lw // 2, 560 - lg.height // 2), lg)
    d = ImageDraw.Draw(img)
    if k > 0.2 * FPS:
        d.text((W / 2, 860), 'Juega GRATIS', font=F(96), fill=(255, 217, 61), anchor='mm', stroke_width=10, stroke_fill=(70, 20, 90))
        d.text((W / 2, 975), 'Sin descargar · Sin registro', font=F(54), fill=(255, 255, 255), anchor='mm', stroke_width=8, stroke_fill=(40, 15, 70))
    if k > 0.45 * FPS:
        d.rounded_rectangle([190, 1090, 890, 1210], radius=60, fill=(90, 200, 90))
        d.text((W / 2, 1150), 'Toca el link de mi perfil', font=F(46), fill=(255, 255, 255), anchor='mm')
        d.text((W / 2, 1290), 'y juegas al instante', font=F(48, 'Medium'), fill=(230, 230, 250), anchor='mm', stroke_width=6, stroke_fill=(40, 15, 70))
    return img


def render(rec, out, hook, overlay=None, end_seconds=2.6):
    """rec: Recorder ya grabado. hook: líneas del gancho. overlay(img, i): dibujos extra por cuadro."""
    n = len(rec.frames)
    end_n = int(end_seconds * FPS)
    dur = (n + end_n) / FPS
    wav = out.replace('.mp4', '.wav')
    build_audio(rec.sfx_log(), dur, wav, end_at=n / FPS)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
           '-i', '-', '-i', wav, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
           '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None
    for i, jpg in enumerate(rec.frames):
        game = frame_image(jpg)
        last = game
        img = background(game)
        img.paste(game.resize((GW, GH), Image.LANCZOS), (GX, BAND))
        draw_hook(img, hook)
        if overlay:
            overlay(img, i)
        draw_finger(img, rec.pointers[i])
        p.stdin.write(img.tobytes())
    for k in range(end_n):
        p.stdin.write(end_card(last, k, end_n).tobytes())
    p.stdin.close()
    p.wait()
    os.remove(wav)
    return out
