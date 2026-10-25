"""Grabador de clips de Bloquevilla.

Abre el juego en modo captura (?capture), lo avanza cuadro por cuadro y guarda cada
cuadro en 1080x1920. También devuelve el registro de sonidos para rearmar el audio.
Uso desde los guiones de cada clip (clip_*.py).
"""
import base64, io, json, subprocess, time, os, socket
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
FPS = 30
DT = 1000 / FPS


def free_port():
    s = socket.socket(); s.bind(('', 0)); p = s.getsockname()[1]; s.close(); return p


class Recorder:
    def __init__(self, storage=None, webgl=True, query=''):
        self.port = free_port()
        self.srv = subprocess.Popen(['python3', '-m', 'http.server', str(self.port), '-d', DIST],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.8)
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        ctx = self.browser.new_context(viewport={'width': 540, 'height': 960})
        st = {'games': 5, 'sound': True}
        st.update(storage or {})
        ctx.add_init_script(f"localStorage.setItem('bloquevilla_v1', {json.dumps(json.dumps(st))});")
        self.page = ctx.new_page()
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.route('**/fonts.g*/**', lambda r: r.abort())
        q = ('capture' if webgl else 'capture,canvas') + query
        self.page.goto(f'http://localhost:{self.port}/index.html?{q}', wait_until='domcontentloaded')
        self.page.wait_for_function('() => window.__capReady === true', timeout=30000)
        # deja que cargue Boot y pase al menú
        for _ in range(200):
            self.step(2)
            if self.scene_active('Menu'):
                break
            time.sleep(0.03)
        self.frames = []      # jpg bytes
        self.pointers = []    # (x, y, pressed) en coordenadas del juego, o None
        self.t0 = None

    def ev(self, js, arg=None):
        return self.page.evaluate(js, arg)

    def step(self, n=1):
        return self.ev(f'() => window.__step({n}, {DT})')

    def scene_active(self, key):
        return self.ev(f"() => window.__game.scene.isActive('{key}')")

    def start_scene(self, key, data=None):
        self.ev(f"() => {{ const s = window.__game.scene.getScenes(true)[0]; s.scene.start('{key}'); return 1; }}")
        for _ in range(10):
            self.step(1)

    def begin(self):
        self.t0 = self.ev('() => window.__capTime')
        self.ev('() => { window.__sfxLog.length = 0; return 1; }')

    def grab(self, pointer=None):
        """Avanza un cuadro y lo guarda."""
        self.step(1)
        data = self.ev("() => window.__game.canvas.toDataURL('image/webp', 0.92)")
        self.frames.append(base64.b64decode(data.split(',', 1)[1]))
        self.pointers.append(pointer)

    def hold(self, seconds, pointer=None):
        for _ in range(int(round(seconds * FPS))):
            self.grab(pointer)

    def sfx_log(self):
        log = self.ev('() => window.__sfxLog')
        return [(name, args, (t - self.t0) / 1000.0) for name, args, t in log]

    def close(self):
        try:
            self.browser.close(); self.pw.stop()
        finally:
            self.srv.terminate()


def frame_image(jpg):
    return Image.open(io.BytesIO(jpg)).convert('RGB')
