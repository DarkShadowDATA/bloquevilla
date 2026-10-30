# Bloquevilla: instrucciones del proyecto

## Publicación (darkshadow-studios.com)
- Cloudflare Pages publica el sitio directamente desde la carpeta `dist/` del repositorio, sin compilar nada en Cloudflare (sin comando de build).
- Por eso, **antes de cada push**: ejecuta `npm run build` y sube en el mismo commit el `dist/` actualizado (`dist/index.html`). Nunca hagas push de cambios en `src/` sin su `dist/` recompilado.
- Regenera también `itch/bloquevilla_itch.zip` (zip de `dist/index.html`) para que la versión de itch.io quede igual a la del dominio.

## Contenido para redes
- Todo contenido nuevo del juego va acompañado de videos para redes (los scripts están en `clips/`).
- Flujo desde oct 2026: cada contenido nuevo se entrega en dos partes al mismo tiempo: (1) lo jugable, publicado en el dominio, y (2) su video, guardado en la carpeta de la computadora de Alejandro `Videos/Bloquevilla` con nombre `AAAA-MM-DD HH-MM Título.mp4` (fecha y hora de publicación, cada 12 h a las 08:00 y 20:00) y su texto agregado a `00 Textos para publicar.txt`. Metricool llegó a su límite mensual, así que él los sube a mano desde esa carpeta.

### Reglas de los videos (la gente se iba en el segundo 1)
- El **primer cuadro ya es el mejor momento** de la partida (un combo, el tablero limpiándose, el premio). Nada de pantallas de título, menús quietos ni fundidos al principio.
- **Texto gancho grande** visible desde el cuadro 0.
- **Golpe de música** en el segundo 0.
- Todo el juego va **con subtítulos** (la mayoría lo ve sin sonido).
- **Cierre de 2 s** con la tarjeta "Juega GRATIS".
- **Unos 13 s en total.**
- En `clips/edit.py`, `render()` arma esto: `segs` pone primero el momento fuerte (cold open) y luego el resto; `subs` agrega los subtítulos.
