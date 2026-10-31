# Prompts para ChatGPT: Modo Aventura y Zona 2 (el Muelle)

Pega primero el **estilo base** y después cada prompt. Guarda cada imagen como **PNG** con el **nombre exacto** que se indica y mándamelas sueltas (sin zip). Los fondos (`bg_`) van sin transparencia; todo lo demás con **fondo transparente**.

Para que los edificios nuevos se vean igual que los del pueblo, **adjunta `bld_casa.png`** (o una captura de tu pueblo) junto con cada prompt de edificio y empieza con: *"Mismo estilo exacto, grosor de contorno, iluminación y ángulo de cámara que la imagen adjunta."*

**Estilo base (pégalo antes de cada prompt):**
> Estilo de juego móvil casual, ilustración 2D cartoon con volumen suave, colores vivos y saturados, contornos limpios, iluminación desde arriba a la izquierda, como el arte de Bloquevilla (pueblo europeo acogedor, bloques de gelatina brillante). Sin texto, sin números, sin letras.

## Modo Aventura (4 imágenes)
El juego dibuja encima el camino de puntitos, el número del nivel, las estrellas y el candado; por eso las imágenes van **vacías en el centro**.

| Archivo | Prompt |
| --- | --- |
| `bg_aventura.png` | Fondo vertical 1080x1920 para el mapa de niveles: praderas verdes suaves con colinas, algunos árboles, flores y un río pequeño a los lados, cielo claro arriba. Colores suaves y poco contraste en el centro (ahí van los botones de los niveles). **Sin camino dibujado**, sin edificios grandes, sin personajes. |
| `nivel_abierto.png` | Botón redondo de nivel para un mapa de juego: disco azul brillante tipo gema con borde grueso blanco y un aro dorado delgado, con brillo arriba a la izquierda. **Centro liso y vacío** (ahí va el número). Vista frontal, 512x512, fondo transparente. |
| `nivel_actual.png` | El mismo botón redondo, pero en naranja-dorado brillante con un resplandor suave alrededor y pequeñas chispas, para marcar el nivel donde va el jugador. **Centro liso y vacío.** Vista frontal, 512x512, fondo transparente. |
| `nivel_cerrado.png` | El mismo botón redondo, pero de piedra gris apagada, sin brillo, con pequeñas grietas en el borde. **Centro liso y vacío** (el juego pone el candado). Vista frontal, 512x512, fondo transparente. |

## Zona 2: el Muelle (13 imágenes)

### Fondo
| Archivo | Prompt |
| --- | --- |
| `bg_muelle.png` | Fondo vertical 1080x1920 de un puerto pesquero pequeño y acogedor, vista desde arriba en ángulo 3/4 como un tablero de juego. **Arriba (primer 30%)**: cielo azul claro con nubes suaves. **Franja del medio (30% a 52%)**: mar azul turquesa tranquilo con olas pequeñas; a la izquierda y a la derecha, dos zonas de agua libre donde irán un muelle y un barco (déjalas vacías). **Abajo (52% al final)**: playa de arena clara con **4 terrenos planos y vacíos** (2 a la izquierda y 2 a la derecha, uno arriba del otro) y un camino de tablas de madera que baja por el centro hasta el borde inferior. Sin edificios, sin barcos, sin personas. |

### Edificios terminados
Vista frontal en 3/4 como los del pueblo, el edificio completo y centrado, **apoyado en la parte de abajo de la imagen**, 1024x1024, fondo transparente, sin piso ni sombra.

| Archivo | Prompt |
| --- | --- |
| `bld_muelle.png` | Un muelle de madera sobre pilotes, con tablas cafés, un poste con un salvavidas blanco y rojo, unas cajas de madera y una cuerda enrollada. Debajo, un poco de agua azul alrededor de los pilotes. |
| `bld_barca.png` | Una barca de pesca de madera pintada de azul y blanco, con una vela blanca, una banderita roja arriba del mástil, redes y una cubeta con pescados. Flotando sobre un poco de agua azul. |
| `bld_pescaderia.png` | Una pescadería pequeña de pueblo, paredes azul claro, techo de tejas azules, toldo de rayas azules y blancas, mostrador con pescados de colores sobre hielo y un letrero con la forma de un pez (sin letras). |
| `bld_faro.png` | Un faro alto con rayas rojas y blancas, cúpula roja, linterna amarilla encendida con rayos de luz suaves, sobre una base de rocas grises. Debe ser más alto que ancho. |
| `bld_astillero.png` | Un astillero: cobertizo grande de madera con techo café, el portón abierto y adentro el esqueleto de madera de un barco en construcción, herramientas y tablas apiladas a un lado. |
| `bld_mercado.png` | Un mercado del puerto con dos puestos de toldos de rayas (uno naranja y blanco, otro verde y blanco), cajas con frutas y verduras de colores, canastas y banderines pequeños. |

### Edificios en ruinas
Las mismas 6 escenas, pero destruidas y abandonadas, con el mismo ángulo y tamaño, 1024x1024, fondo transparente. Mándalas con estos nombres:

| Archivo | Prompt |
| --- | --- |
| `bld_muelle_ruina.png` | El muelle roto: pilotes chuecos, tablas faltantes y flotando, salvavidas roto. |
| `bld_barca_ruina.png` | La barca volcada y encallada, con la vela rota, el mástil caído y agujeros en el casco. |
| `bld_pescaderia_ruina.png` | La pescadería en ruinas: techo hundido, toldo roto y caído, paredes agrietadas, mostrador vacío. |
| `bld_faro_ruina.png` | El faro roto: la parte de arriba caída, cúpula sin vidrio, linterna apagada, piedras alrededor. |
| `bld_astillero_ruina.png` | El astillero derrumbado: techo caído, tablas regadas, el barco a medio hacer roto. |
| `bld_mercado_ruina.png` | Los puestos del mercado tirados: toldos rotos, cajas volteadas y vacías, palos caídos. |

---
Cuando me las mandes: las meto al juego, las publico y **entonces sí grabo los videos** de la Aventura y del Muelle (ya con el arte final).
