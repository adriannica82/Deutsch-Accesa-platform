// Pregătește directorul web al aplicației iOS: rulează build.py (dacă nu e --no-build) și copiază deutsch.html ca www/index.html, plus version.json (versiunea din pachet, pentru actualizarea automată).
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const www = resolve(here, '..', 'www');

if (!process.argv.includes('--no-build')) {
  const r = spawnSync('python3', ['build.py'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('build.py a eșuat; aplicația nu a fost actualizată.');
    process.exit(r.status ?? 1);
  }
}

mkdirSync(www, { recursive: true });
copyFileSync(resolve(root, 'deutsch.html'), resolve(www, 'index.html'));
copyFileSync(resolve(root, 'version.json'), resolve(www, 'version.json'));
console.log(`www/index.html actualizat din deutsch.html (${Math.round(statSync(resolve(www, 'index.html')).size / 1024)} KB)`);
