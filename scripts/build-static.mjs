import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const output = join(root, 'dist');
const excluded = new Set([
  '.git',
  'dist',
  'node_modules',
  'scripts',
  'MEMÓRIAS.md',
  'README.md',
  'webcopy-origin.txt',
  'agendamento (1).zip'
]);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (excluded.has(entry.name) || entry.name === 'package.json') continue;
  cpSync(join(root, entry.name), join(output, entry.name), {
    recursive: entry.isDirectory(),
    preserveTimestamps: true
  });
}

writeFileSync(join(output, '.nojekyll'), '');

const validation = spawnSync(
  process.execPath,
  [join(root, 'scripts', 'check-static.mjs'), output],
  { encoding: 'utf8' }
);

if (validation.stdout) process.stdout.write(validation.stdout);
if (validation.stderr) process.stderr.write(validation.stderr);
if (validation.status !== 0) {
  rmSync(output, { recursive: true, force: true });
  process.exit(validation.status || 1);
}

if (!existsSync(join(output, 'index.html'))) {
  rmSync(output, { recursive: true, force: true });
  throw new Error('Build output does not contain index.html');
}

console.log('Static production artifact created in dist/.');
