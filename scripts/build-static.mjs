import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname, relative, resolve, join, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const output = join(root, 'dist');
const excluded = new Set([
  '.git',
  'dist',
  'node_modules',
  'scripts',
  'BACKEND_DEPENDENCIES.md',
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

const fontDirectory = join(output, 'fonts');
mkdirSync(fontDirectory, { recursive: true });
for (const font of ['400', '400i', '500', '600', '700', '900']) {
  cpSync(
    join(root, 's', '19714', `rawline-${font}.woff`),
    join(fontDirectory, `rawline-${font}.woff`)
  );
}

rewriteCssFontReferences(output);

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

const routeValidation = spawnSync(
  process.execPath,
  [join(root, 'scripts', 'check-routes.mjs'), output],
  { encoding: 'utf8' }
);

if (routeValidation.stdout) process.stdout.write(routeValidation.stdout);
if (routeValidation.stderr) process.stderr.write(routeValidation.stderr);
if (routeValidation.status !== 0) {
  rmSync(output, { recursive: true, force: true });
  process.exit(routeValidation.status || 1);
}

if (!existsSync(join(output, 'index.html'))) {
  rmSync(output, { recursive: true, force: true });
  throw new Error('Build output does not contain index.html');
}

console.log('Static production artifact created in dist/.');

function rewriteCssFontReferences(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      rewriteCssFontReferences(path);
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      const source = readFileSync(path, 'utf8');
      const fontPrefix = relative(dirname(path), fontDirectory).split(sep).join('/') || '.';
      const updated = source
        .replace(
          /\/fonts\/(rawline-(?:400i?|500|600|700|900))\.woff2/g,
          `${fontPrefix}/$1.woff`
        )
        .replace(/format\\((['\"])woff2\\1\\)/g, 'format(\"woff\")');
      if (updated !== source) writeFileSync(path, updated);
    }
  }
}
