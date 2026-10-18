// Renders the PWA icons in public/ from public/favicon.svg.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
// Full-bleed square (no rounded corners) for platforms that apply their own mask.
const square = svg.replace('rx="112"', 'rx="0"');
// Maskable: content shrunk into the 80% safe zone.
const maskable = square
  .replace(/(<rect width="512"[^>]*\/>)/, '$1<g transform="translate(51.2 51.2) scale(0.8)">')
  .replace('</svg>', '</g></svg>');

const out = (name, src, size) =>
  sharp(Buffer.from(src)).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/${name}`, import.meta.url)));

await out('icon-192.png', svg, 192);
await out('icon-512.png', svg, 512);
await out('apple-touch-icon.png', square, 180);
await out('icon-maskable-512.png', maskable, 512);
console.log('icons written');
