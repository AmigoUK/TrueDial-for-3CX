// Renders assets/icon.svg to the PNG sizes WXT discovers automatically
// (public/icon/{size}.png → the manifest's `icons` map), plus the store's
// 440x280 promo tile from assets/promo-tile.svg. Run after changing either
// SVG: node scripts/generate-icons.mjs
import { Resvg } from '@resvg/resvg-js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIZES = [16, 32, 48, 128];

const svg = await readFile(join(root, 'assets/icon.svg'), 'utf8');
await mkdir(join(root, 'public/icon'), { recursive: true });

for (const size of SIZES) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(join(root, `public/icon/${size}.png`), png);
  console.log(`public/icon/${size}.png (${png.length} bytes)`);
}

// The promo tile carries text, so it needs real fonts rather than the default
// embedded-only rendering.
const promo = await readFile(join(root, 'assets/promo-tile.svg'), 'utf8');
await mkdir(join(root, 'docs/store/promo'), { recursive: true });
const tile = new Resvg(promo, {
  fitTo: { mode: 'width', value: 440 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans' },
})
  .render()
  .asPng();
await writeFile(join(root, 'docs/store/promo/small-tile-440x280.png'), tile);
console.log(`docs/store/promo/small-tile-440x280.png (${tile.length} bytes)`);
