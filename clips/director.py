"""Acciones guionizadas sobre la partida: preparar tablero, arrastrar piezas, tocar edificios."""
from cap import FPS

CELL, BX, BY = 110, 100, 420
SLOTS = [230, 540, 850]
TRAY_Y = 1470
COLOR = {'r': 'red', 'o': 'orange', 'y': 'yellow', 'g': 'green', 'b': 'blue', 'p': 'purple', 'k': 'pink'}

SETUP_JS = """(cfg) => {
  const g = window.__game.scene.getScene('Game');
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (g.sprites[r][c]) g.sprites[r][c].destroy();
    g.sprites[r][c] = null; g.board[r][c] = null;
  }
  cfg.board.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '.') { g.board[r][c] = cfg.colors[ch]; g.addBlock(r, c, cfg.colors[ch], false); }
  }));
  g.nextOffer = 999;
  g.trayQueue = cfg.trays;
  g.newTray = function (animate) {
    this.pieces.forEach((p) => p.c && p.c.destroy());
    const defs = this.trayQueue.length ? this.trayQueue.shift() : [{cells:[[0,0]],color:'red'},{cells:[[0,0]],color:'blue'},{cells:[[0,0]],color:'green'}];
    this.pieces = defs.map((d, i) => this.makePiece(d, i, animate));
  };
  g.newTray(false);
  g.score = cfg.score || 0; g.addScore(0);
  if (g._toast) { g._toast.destroy(); g._toast = null; }
  return 1;
}"""


def setup_board(rec, board, trays, score=0):
    rec.ev(SETUP_JS, {'board': board, 'trays': trays, 'score': score, 'colors': COLOR})
    rec.step(2)


def ease(t):
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


class Finger:
    def __init__(self, x=900, y=1800):
        self.x, self.y = x, y

    def move(self, rec, x, y, seconds, pressed=False, js_each=None):
        n = max(1, int(round(seconds * FPS)))
        x0, y0 = self.x, self.y
        for i in range(1, n + 1):
            k = ease(i / n)
            self.x, self.y = lerp(x0, x, k), lerp(y0, y, k)
            if js_each:
                rec.ev(js_each, {'x': self.x, 'y': self.y})
            rec.grab((self.x, self.y, pressed))

    def wait(self, rec, seconds, pressed=False, visible=True):
        rec.hold(seconds, (self.x, self.y, pressed) if visible else None)


def drag(rec, finger, slot, r, c, approach=0.3, travel=0.6, after=0.45):
    """Arrastra la pieza de la bandeja `slot` para que su esquina superior izquierda quede en (r, c)."""
    info = rec.ev(f"() => {{ const p = window.__game.scene.getScene('Game').pieces[{slot}]; return {{rows: p.rows, cols: p.cols}}; }}")
    sx, sy = SLOTS[slot], TRAY_Y + 10
    finger.move(rec, sx, sy, approach)
    rec.ev(f"() => {{ const g = window.__game.scene.getScene('Game'); g.startDrag(g.pieces[{slot}], {{x: {sx}, y: {sy}}}); return 1; }}")
    finger.wait(rec, 0.07, pressed=True)
    cx = BX + c * CELL + info['cols'] * CELL / 2
    cy = BY + r * CELL + info['rows'] * CELL / 2
    tx, ty = cx, cy + info['rows'] * CELL / 2 + 110
    finger.move(rec, tx, ty, travel, pressed=True,
                js_each="(p) => { window.__game.scene.getScene('Game').onMove(p); return 1; }")
    finger.wait(rec, 0.05, pressed=True)
    rec.ev("() => { window.__game.scene.getScene('Game').onUp(); return 1; }")
    finger.wait(rec, after)
