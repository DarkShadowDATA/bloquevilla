// Reduce las imágenes de ChatGPT al tamaño que usa el juego y las pasa a WebP.
// Uso: pon los PNG en src/assets/img/ y corre "npm run optimizar".
// Los originales se guardan en assets_originales/ por si los necesitas.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/assets/img';
const KEEP = 'assets_originales';
const MARKETING = 'marketing';

// prefijo del nombre -> tamaño máximo [ancho, alto]
const SIZES = [
  ['block_', [128, 128]],
  ['water_', [128, 128]],
  ['muertos_', [128, 128]],
  ['deco_', [1100, 1100]],
  ['evento_', [1100, 400]],
  ['bg_', [1080, 1920]],
  ['bld_', [400, 400]],
  ['pw_', [200, 200]],
  ['card_', [320, 460]],
  ['ui_', [128, 128]],
  ['logo', [1000, 700]],
];

fs.mkdirSync(KEEP, { recursive: true });
fs.mkdirSync(MARKETING, { recursive: true });

const files = fs.readdirSync(DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (!files.length) console.log('No hay PNG/JPG nuevos en', DIR);

for (const f of files) {
  const src = path.join(DIR, f);
  const name = f.replace(/\.(png|jpe?g)$/i, '');
  if (name.startsWith('cover_')) {
    fs.renameSync(src, path.join(MARKETING, f));
    console.log('Portada movida a marketing/:', f);
    continue;
  }
  const rule = SIZES.find(([p]) => name.startsWith(p));
  const [w, h] = rule ? rule[1] : [512, 512];
  const isBg = name.startsWith('bg_');
  const isBlock = name.startsWith('block_') || name.startsWith('water_') || name.startsWith('muertos_');
  const fit = isBg ? 'cover' : isBlock ? 'fill' : 'inside';
  // Quita el margen transparente para que cada imagen llene su espacio en el juego
  const trimmed = isBg ? await sharp(src).toBuffer() : await sharp(src).trim({ threshold: 8 }).toBuffer();
  await sharp(trimmed).resize(w, h, { fit, withoutEnlargement: true }).webp({ quality: 86 }).toFile(path.join(DIR, name + '.webp'));
  fs.renameSync(src, path.join(KEEP, f));
  console.log('Listo:', name + '.webp');
}
