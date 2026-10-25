# Bloquevilla

Block puzzle 8x8 para navegador: cada partida da ladrillos para reconstruir un pueblo, y en la partida eliges poderes con rareza.

## Correr el juego

```bash
npm install
npm run dev        # abre el juego en http://localhost:5173 (también desde tu celular en la misma red)
npm run build      # genera dist/index.html, un solo archivo listo para itch.io
```

Para itch.io: comprime `dist/index.html` en un .zip, súbelo como proyecto HTML y marca "This file will be played in the browser". Tamaño de ventana recomendado: 540 x 960.

## Publicar en darkshadow-studios.com (Cloudflare Pages)

El juego ya compilado está en `dist/index.html` (un solo archivo), así que Cloudflare no necesita compilar nada.

1. Cloudflare → Workers & Pages → Create → Pages → **Connect to Git** → elige `DarkShadowDATA/bloquevilla`.
2. Framework preset: **None**. Build command: *(vacío)*. Build output directory: **`dist`**.
3. Deploy. Después, en *Custom domains*, agrega `bloquevilla.darkshadow-studios.com`.

Cada vez que se suba una versión nueva a `main`, Cloudflare la publica solo.

## itch.io

`itch/bloquevilla_itch.zip` es la última versión lista para subir a itch.io.

## Imágenes de ChatGPT

1. Pon los PNG con su nombre exacto (block_red.png, bld_casa.png, etc.) en `src/assets/img/`.
2. `npm run optimizar` los reduce y los pasa a WebP (los originales quedan en `assets_originales/`).
3. `npm run build`. Cada imagen que exista reemplaza al gráfico dibujado con código; lo que falte se sigue dibujando.

## Dónde está cada cosa

| Archivo | Qué hace |
| --- | --- |
| `src/config.js` | Medidas, puntos, ladrillos, costos de edificios y regalo diario. Aquí se ajusta el balance. |
| `src/pieces.js` | Formas de piezas, generador justo y detección de líneas. |
| `src/powers.js` | Los 9 poderes, rarezas y probabilidades. |
| `src/save.js` | Guardado en el navegador. |
| `src/sfx.js` | Sonidos sintetizados y vibración. |
| `src/textures.js` | Gráficos de reemplazo dibujados con código. |
| `src/scenes/Game.js` | La partida: tablero, arrastre, combos, poderes y fin de partida. |
| `src/scenes/Village.js` | El pueblo y la reconstrucción. |
| `src/scenes/Menu.js` | Menú, ajustes y regalo diario. |

Para probar rápido en una computadora lenta, abre el juego con `?canvas` al final de la dirección.
