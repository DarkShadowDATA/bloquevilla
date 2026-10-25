# Clips para redes

Graba el juego real cuadro por cuadro y arma videos verticales 1080x1920 con gancho, dedo, audio y tarjeta final.

```bash
npm run build                          # primero compila el juego
pip install playwright numpy pillow    # una sola vez
python -m playwright install chromium  # una sola vez
cd clips
python clip_combo.py out/combo.mp4
python clip_reto.py out/reto.mp4
python clip_pueblo.py out/pueblo.mp4
```

| Archivo | Qué hace |
| --- | --- |
| `cap.py` | Abre el juego en modo captura (`?capture`) y guarda cada cuadro y cada sonido. |
| `director.py` | Prepara tableros y hace jugadas: arrastrar piezas, tocar edificios. |
| `edit.py` | Arma el video: franja con gancho, dedo, tarjeta final y audio (sonidos del juego + música). |
| `clip_*.py` | El guion de cada video. Copia uno para hacer un clip nuevo. |

Cada clip tarda unos minutos en grabarse: el juego avanza un cuadro a la vez para que el video salga fluido.
