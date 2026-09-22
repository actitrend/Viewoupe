import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const distDir = path.join(root, 'dist');
const files = ['viewoupe.js', 'viewoupe-memory.js'];

fs.mkdirSync(distDir, { recursive: true });
for (const file of files) {
  const src = path.join(root, 'src', file);
  if (!fs.existsSync(src)) continue;
  const dist = path.join(distDir, file);
  fs.copyFileSync(src, dist);
  console.log(`Built ${path.relative(root, dist)}`);
}
