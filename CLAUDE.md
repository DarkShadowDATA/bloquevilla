# Bloquevilla: instrucciones del proyecto

## Publicación (darkshadow-studios.com)
- Cloudflare Pages publica el sitio directamente desde la carpeta `dist/` del repositorio, sin compilar nada en Cloudflare (sin comando de build).
- Por eso, **antes de cada push**: ejecuta `npm run build` y sube en el mismo commit el `dist/` actualizado (`dist/index.html`). Nunca hagas push de cambios en `src/` sin su `dist/` recompilado.
- Regenera también `itch/bloquevilla_itch.zip` (zip de `dist/index.html`) para que la versión de itch.io quede igual a la del dominio.

## Contenido para redes
- Todo contenido nuevo del juego va acompañado de videos para redes (los scripts están en `clips/`).
