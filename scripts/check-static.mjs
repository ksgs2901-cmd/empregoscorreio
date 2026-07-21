import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, dirname, join, sep } from 'node:path';

const root = resolve(process.argv[2] || '.');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);
const failures = [];
let htmlCount = 0;
let referenceCount = 0;

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) checkHtml(path);
  }
}

function checkHtml(file) {
  htmlCount += 1;
  const source = readFileSync(file, 'utf8');
  const relativeFile = relative(root, file);
  const documentPath = `/${relativeFile.split(sep).join('/')}`;
  const tagPattern = /<(script|link|img)\b[^>]*>/gi;

  for (const match of source.matchAll(tagPattern)) {
    const [tag] = match;
    const type = match[1].toLowerCase();
    const attribute = type === 'link' ? 'href' : 'src';
    const value = tag.match(new RegExp(`\\b${attribute}\\s*=\\s*([\"'])(.*?)\\1`, 'i'))?.[2];
    if (!value || shouldIgnore(value)) continue;

    if (type === 'link') {
      const rel = tag.match(/\brel\s*=\s*([\"'])(.*?)\1/i)?.[2]?.toLowerCase() || '';
      if (!/(^|\s)(stylesheet|icon|preload)(\s|$)/.test(rel)) continue;
    }

    referenceCount += 1;
    const url = new URL(value, `https://static.invalid${documentPath}`);
    let pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = resolve(root, pathname);

    if (!target.startsWith(`${root}${sep}`) && target !== root) {
      failures.push(`${relativeFile}: reference escapes build root: ${value}`);
    } else if (!existsSync(target) || (existsSync(target) && statSync(target).isDirectory())) {
      failures.push(`${relativeFile}: missing ${type} asset: ${value}`);
    }
  }
}

function shouldIgnore(value) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(value) || value.includes('${');
}

walk(root);

if (failures.length) {
  console.error(`Static validation failed with ${failures.length} missing assets:`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Static validation passed: ${htmlCount} HTML files, ${referenceCount} local assets.`);
