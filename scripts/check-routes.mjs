import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, join, sep } from 'node:path';

const root = resolve(process.argv[2] || '.');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);
const knownMissing = new Map([
  ['/endereco', 'a página original não está presente no repositório'],
  ['/final', 'a página final original não está presente no repositório'],
  ['/acesso-informacao', 'a página institucional não está presente no repositório']
]);
const failures = [];
const warnings = new Map();
let routeCount = 0;

walk(root);

if (failures.length) {
  console.error(`Route validation failed with ${failures.length} broken links:`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

for (const [route, reason] of warnings) {
  console.warn(`Known unresolved route ${route}: ${reason}.`);
}
console.log(`Route validation passed: ${routeCount} internal navigation references.`);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) checkHtml(path);
  }
}

function checkHtml(file) {
  const source = readFileSync(file, 'utf8');
  const relativeFile = relative(root, file);
  const documentPath = `/${relativeFile.split(sep).join('/')}`;
  const candidates = [];

  for (const match of source.matchAll(/<a\b[^>]*\bhref\s*=\s*([\"'])(.*?)\1/gi)) {
    candidates.push(match[2]);
  }
  for (const match of source.matchAll(/(?:window\.)?location\.href\s*=\s*([\"'`])(.+?)\1/g)) {
    if (isLineComment(source, match.index)) continue;
    candidates.push(match[2]);
  }
  for (const match of source.matchAll(/\bredirectUrl\s*=\s*([\"'`])(.+?)\1/g)) {
    if (isLineComment(source, match.index)) continue;
    candidates.push(match[2]);
  }

  for (const candidate of candidates) checkRoute(candidate, documentPath, relativeFile);
}

function checkRoute(candidate, documentPath, relativeFile) {
  if (!candidate || /^(?:[a-z]+:|\/\/|#)/i.test(candidate)) return;

  const staticPart = candidate.replace(/\$\{.*$/s, '').split('?')[0].split('#')[0];
  if (!staticPart || hasFileExtension(staticPart)) return;

  routeCount += 1;
  const url = new URL(staticPart, `https://static.invalid${documentPath}`);
  const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
  const knownReason = knownMissing.get(pathname);
  if (knownReason) {
    warnings.set(pathname, knownReason);
    return;
  }

  const target = pathname === '/'
    ? join(root, 'index.html')
    : join(root, pathname.replace(/^\/+/, ''), 'index.html');
  if (!existsSync(target) || !statSync(target).isFile()) {
    failures.push(`${relativeFile}: missing route ${candidate}`);
  }
}

function hasFileExtension(pathname) {
  return /\/[^/]+\.[a-z0-9]+$/i.test(pathname);
}

function isLineComment(source, index) {
  const lineStart = source.lastIndexOf('\n', index) + 1;
  return source.slice(lineStart, index).includes('//');
}
