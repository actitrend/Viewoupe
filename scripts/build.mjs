import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'src', 'viewoupe.js');
const distDir = path.join(root, 'dist');
const dist = path.join(distDir, 'viewoupe.js');

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(src, dist);
console.log(`Built ${path.relative(root, dist)}`);
