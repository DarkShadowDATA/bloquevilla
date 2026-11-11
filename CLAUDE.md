# Bloquevilla: instrucciones del proyecto

## Publicación (darkshadow-studios.com)
- Cloudflare Pages publica el sitio directamente desde la carpeta `dist/` del repositorio, sin compilar nada en Cloudflare (sin comando de build).
- Por eso, **antes de cada push**: ejecuta `npm run build` y sube en el mismo commit el `dist/` actualizado (`dist/index.html`). Nunca hagas push de cambios en `src/` sin su `dist/` recompilado.
- itch.io (desde 30 oct 2026) ya no usa el zip: tiene subido `itch/bloquevilla_itch.html`, que abre la versión en línea (`?src=itch`) en un iframe. Cada push al dominio llega solo a itch; no hay que regenerar ni resubir nada.

## Contenido para redes
- **Desde el 11 nov 2026 ya no se hace un video con cada actualización.** Primero se avanza el juego; los videos se hacen cuando Alejandro los pida o toque una tanda, explicando «esto funciona así» (los scripts están en `clips/`). Los devlogs de itch van cada 2 o 3 fases o por actualización grande.
- Cuando sí se hace un video: va a la carpeta de la computadora de Alejandro `Videos/Bloquevilla` con nombre `AAAA-MM-DD HH-MM Título.mp4` (fecha y hora de publicación, cada 12 h a las 08:00 y 20:00) y su texto se agrega a `00 Textos para publicar.txt`. Él los sube a mano desde esa carpeta. Todos llevan voz (skill voz-reels).

### Reglas de los videos (la gente se iba en el segundo 1)
- **Si el contenido nuevo necesita imágenes de ChatGPT, primero se entregan los prompts y NO se graba el video hasta que Alejandro mande las imágenes finales.** El juego puede publicarse con el arte dibujado con código, pero el video se graba una sola vez, ya con el arte final.
- El **primer cuadro ya es el mejor momento** de la partida (un combo, el tablero limpiándose, el premio). Nada de pantallas de título, menús quietos ni fundidos al principio.
- **Texto gancho grande** visible desde el cuadro 0.
- **Golpe de música** en el segundo 0.
- Todo el juego va **con subtítulos** (la mayoría lo ve sin sonido).
- **Cierre de 2 s** con la tarjeta "Juega GRATIS".
- **Unos 13 s en total.**
- En `clips/edit.py`, `render()` arma esto: `segs` pone primero el momento fuerte (cold open) y luego el resto; `subs` agrega los subtítulos.

## Idiomas (desde v2.0)
- El juego se escribe en español y `src/i18n.js` lo traduce al mostrarse (parcha `Text.setText`). Inglés y portugués según el navegador o Ajustes → Idioma (`save.idioma`); en modo captura siempre español (`?lang=en` o `?lang=pt` para probar).
- **Cada texto nuevo que se vea en pantalla necesita su inglés en `src/i18n_en.js` y su portugués en `src/i18n_pt.js`** (clave = el español igual que en el código; `{}` = variable). Para revisar: `?lang=en` y buscar textos que sigan en español.
