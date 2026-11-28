# Bloquevilla: instrucciones del proyecto

## Publicación (darkshadow-studios.com)
- Cloudflare Pages publica el sitio directamente desde la carpeta `dist/` del repositorio, sin compilar nada en Cloudflare (sin comando de build).
- Por eso, **antes de cada push**: ejecuta `npm run build` y sube en el mismo commit el `dist/` actualizado (desde 2.6: `dist/index.html` + `dist/assets/`, ya no es un solo archivo). Nunca hagas push de cambios en `src/` sin su `dist/` recompilado. Si `npm run build` dice `vite: not found`, corre `npm ci` antes (si no, el dist queda viejo sin avisar).
- itch.io (desde 30 oct 2026) ya no usa el zip: tiene subido `itch/bloquevilla_itch.html`, que abre la versión en línea (`?src=itch`) en un iframe. Cada push al dominio llega solo a itch; no hay que regenerar ni resubir nada.

## Contenido para redes
- **Desde el 11 nov 2026 ya no se hace un video con cada actualización.** Primero se avanza el juego; los videos se hacen cuando Alejandro los pida o toque una tanda, explicando «esto funciona así» (los scripts están en `clips/`). Los devlogs de itch van cada 2 o 3 fases o por actualización grande.
- Cuando sí se hace un video: va a la carpeta de la computadora de Alejandro `Videos/Bloquevilla` con nombre `AAAA-MM-DD HH-MM Título.mp4` (fecha y hora de publicación, cada 12 h a las 08:00 y 20:00) y su texto va en un `.txt` con el mismo nombre del video (y también se agrega a `00 Textos para publicar.txt`). Él los sube a mano desde esa carpeta. Todos llevan voz (skill voz-reels).

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

## Moneda Shadow (regla desde el 15 nov 2026)
- La Shadow se muestra **siempre con su imagen** (`src/assets/img/ui_shadow.webp`, la misma moneda de Noche de Leyendas), **nunca con emoji**. Junto a un número usa `shadowAmount(scene, x, y, n, size)` de `src/ui.js` (moneda del alto del texto); en botones `iconKey: 'ui_shadow'`. El 🔷 de «Piezas raras» no es Shadow y se queda.

## Carga rápida y anuncios (desde 2.6)
- Quien va directo a jugar (nuevo, partida a medias, reto de un amigo o link de anuncio) baja solo las imágenes de la partida (`esDePartida` en `src/assets.js`); el resto llega en segundo plano (escena `Fondo`, `src/carga.js`). Si abre otra pantalla antes, pasa por la escena `Carga` (barra corta). Quien abre el menú baja todo como antes. Imagen nueva que salga en la partida desde el primer cuadro: agregar su prefijo a `PARTIDA` en `src/assets.js`.
- Link de anuncio: `?src=fb_ads&campana=<etiqueta>` (o `ig_ads`): cae directo a jugar, sin la ventana de «Cómo jugar» (solo aviso y un dedo que señala). `esAnuncio()` en `src/stats.js`.
- Medición (tabla `bloquevilla_eventos`, solo acepta ciertos eventos): todos los eventos llevan en `datos` `llegada` (fb_ads, itch, estudio, directo…), `campana`, `sesion` y, si cambió, `primera`/`primeraCampana`. Primera pieza = evento `tiempo` con `tipo: 'primera_pieza'` (`s` = segundos desde que abrió); tiempo jugado = `tiempo` con `tipo: 'sesion'` (`s`, a los 1, 2, 3, 5, 10, 15, 20, 30 min y al salir; el máximo por `sesion` es lo que jugó).

## Comprar Shadow y Apoyar (desde 2.7)
- La ventana «Comprar Shadow» es la del estudio: `https://darkshadow-studios.com/ds-tienda.js` (async en `index.html`; el código vive en el repo de Mutantes, `client/public/ds-tienda.js`). Se abre con `abrirTienda()` de `src/nube.js`, **solo desde la pestaña Shadow de la Tienda**, nunca en la partida ni al perder. El juego no tiene CSP; si algún día se pone, permitir `darkshadow-studios.com`, `js.stripe.com`, `*.stripe.com` y `pay.google.com`.
- Si no le alcanza para algo: se guarda en `localStorage.bloquevilla_pendiente` (3 días) y se abre la ventana con `falta`; en cuanto llega la Shadow (al cerrar la ventana, al regresar con `?pago=` o al abrir la Tienda después de un pago en OXXO) la compra se hace sola (`Shop.completarPendiente`).
- `?pago=<orden>` (regreso de pestaña de pago u OXXO) abre directo la Tienda Shadow.
- «💜 Apoyar al creador» = `abrirTienda({ modo: 'apoyar' })` (insignia Patrocinador del estudio). El viejo «☕ Invítame un café» ya no se ofrece; la ruta `apoyo` de `/bq/comprar` sigue en el servidor para versiones viejas abiertas y la insignia ☕ de quien ya apoyó se queda.

## Más juegos de DarkShadow (desde 2.8)
- Botón «🎮 Más juegos de DarkShadow» (`src/masjuegos.js`) solo en el menú y debajo de las ventanas de fin de partida y de fin de nivel; nunca a media partida. Quien llegó por anuncio (`fb_ads`/`ig_ads`) no lo ve hasta terminar su primera partida o nivel (`puedeMostrar`).
- Abre una ventanita con tarjetas de los juegos PÚBLICOS (Piñatazo, Noche de Leyendas, ¡Ahí No!, Mutantes; MecaBestias solo en compu). Cada una abre su juego en pestaña nueva con `?src=bloquevilla&campana=cruce` (lo mide web_events). Imágenes `src/assets/img/mj_*.webp` (de los banners de la página del estudio). Nunca juegos privados o en pausa (Tierras del Umbral, Ruta Loca, ¡Jálale!, El Valle).
- Medición propia: evento `compartir` con `tipo: 'cruce_ver'` (abrió la ventana) y `tipo: 'cruce'` + `juego` (tocó una tarjeta).

## Únete a la comunidad (desde 2.9)
- Tarjeta en la ventana de Misiones del día (`src/comunidad.js` + `openMisiones` en `Menu.js`): un botón por red con link en `https://darkshadow-studios.com/comunidad.json` (`{"discord","telegram","whatsapp"}`, solo `https://`; vacío = no se muestra). Si el archivo no carga, el Discord fijo `https://discord.gg/7pUXuTXvxk`. Se pide 2.5 s después de arrancar (no frena la entrada a jugar). El archivo necesita `Access-Control-Allow-Origin` para que Bloquevilla lo lea desde su subdominio.
- Cada red da **25 ladrillos la primera vez que se toca** (`save.comunidad`, se junta con la nube para no cobrar dos veces); por confianza. Nunca Shadow ni nada de ranking, reto o Pozo. El link se abre en pestaña nueva en el mismo toque (`pointerup`) y la ventana se repinta al instante (con la pestaña nueva al frente el reloj del juego se detiene).
- Aviso discreto: «NUEVO» en el botón de Misiones mientras haya una red sin tocar que no haya visto (`save.comunidadVista`): vuelve solo cuando se agrega una red al archivo. Nunca en la partida.
- Medición: evento `compartir` con `tipo: 'comunidad'`, `red` y `primera`.
