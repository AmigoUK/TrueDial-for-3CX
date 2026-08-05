// Renders assets/icon.svg to the PNG sizes WXT discovers automatically
// (public/icon/{size}.png → the manifest's `icons` map). Run after changing
// the SVG: node scripts/generate-icons.mjs
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
