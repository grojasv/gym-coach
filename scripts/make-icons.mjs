// Builds the PWA icons from the mascot's head: node scripts/make-icons.mjs
// Writes icons/icon.svg, icon-192.png, icon-512.png and apple-touch-icon.png (180, opaque).
// PNGs are rasterized with resvg-py through uv (no npm dependencies).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const Titan = require(join(root, 'mascot.js'));
const outDir = join(root, 'icons');
mkdirSync(outDir, { recursive: true });

const NAVY = '#1b2340', RED = '#e63946', GOLD = '#ffc72c', INK = '#1a1a2e';

// Burst rays around the centre, alternating red and navy.
function burst(cx, cy, r, n = 20) {
  let out = '';
  for (let i = 0; i < n; i += 2) {
    const a0 = (i * 2 * Math.PI) / n, a1 = ((i + 1) * 2 * Math.PI) / n;
    const p = (a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    out += `<polygon points="${cx},${cy} ${p(a0)} ${p(a1)}" fill="${RED}" opacity="0.55"/>`;
  }
  return out;
}

// The head's viewBox is 108 wide; drawn at 340 px its mask stays well inside the
// maskable safe circle (radius 205 around 256,256).
const HEAD = 340;
const head = Titan.head('idle').replace(
  '<svg ',
  `<svg x="${256 - HEAD / 2}" y="${256 - HEAD / 2 - 6}" width="${HEAD}" height="${HEAD}" `,
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect width="512" height="512" fill="${NAVY}"/>
<clipPath id="safe"><circle cx="256" cy="256" r="205"/></clipPath>
<g clip-path="url(#safe)">${burst(256, 256, 260)}</g>
<circle cx="256" cy="256" r="196" fill="none" stroke="${GOLD}" stroke-width="12"/>
<circle cx="256" cy="256" r="182" fill="none" stroke="${RED}" stroke-width="6"/>
<circle cx="256" cy="256" r="202" fill="none" stroke="${INK}" stroke-width="3"/>
${head}
</svg>
`;

const svgPath = join(outDir, 'icon.svg');
writeFileSync(svgPath, svg);

const py = `
import sys, resvg_py
svg_path, outdir = sys.argv[1], sys.argv[2]
for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=size, height=size)
    with open(outdir + "/" + name, "wb") as f:
        f.write(bytes(data))
    print(name, size, len(data))
`;
const out = execFileSync('uv', ['run', '-q', '--with', 'resvg-py', 'python', '-I', '-c', py, svgPath, outDir], {
  encoding: 'utf8',
});
process.stdout.write('icon.svg\n' + out);
