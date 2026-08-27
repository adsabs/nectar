#!/usr/bin/env node
/**
 * Writes a size manifest from a finished build.
 *
 * Per route, first load is the shared /_app chunks plus that route's own —
 * what someone arriving cold has to download.
 *
 * Usage: node scripts/bundle-sizes.mjs [distDir] [outFile]
 */
import { gzipSync } from 'node:zlib';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = process.argv[2] || 'dist';
const OUT = process.argv[3] || 'bundle-sizes.json';

const manifest = JSON.parse(await readFile(join(DIST, 'build-manifest.json'), 'utf8'));

/** @type {Map<string, {raw: number, gzip: number}>} */
const fileSizes = new Map();
const missing = [];

async function measure(file) {
  const cached = fileSizes.get(file);
  if (cached) {
    return cached;
  }
  let size = { raw: 0, gzip: 0 };
  try {
    const buf = await readFile(join(DIST, file));
    size = { raw: buf.byteLength, gzip: gzipSync(buf).byteLength };
  } catch (err) {
    // Dev-only manifest entries are never emitted; anything else is a real gap
    // and would otherwise read as a size drop.
    if (err.code !== 'ENOENT') {
      throw err;
    }
    missing.push(file);
  }
  fileSizes.set(file, size);
  return size;
}

const isJs = (f) => f.endsWith('.js');
const shared = (manifest.pages['/_app'] ?? []).filter(isJs);
const polyfills = (manifest.polyfillFiles ?? []).filter(isJs);
// Not navigable routes; /_app is already reported as the shared baseline.
const PSEUDO_ROUTES = new Set(['/_app', '/_document']);

/** @type {Record<string, {raw: number, gzip: number, files: number}>} */
const pages = {};

for (const [route, files] of Object.entries(manifest.pages)) {
  if (PSEUDO_ROUTES.has(route)) {
    continue;
  }
  const all = [...new Set([...polyfills, ...shared, ...files.filter(isJs)])];
  let raw = 0;
  let gzip = 0;
  for (const file of all) {
    const size = await measure(file);
    raw += size.raw;
    gzip += size.gzip;
  }
  pages[route] = { raw, gzip, files: all.length };
}

// Reported on its own, so growth in _app doesn't read as 60 separate ones.
let sharedRaw = 0;
let sharedGzip = 0;
for (const file of [...new Set([...polyfills, ...shared])]) {
  const size = await measure(file);
  sharedRaw += size.raw;
  sharedGzip += size.gzip;
}

const result = {
  generatedAt: new Date().toISOString(),
  shared: { raw: sharedRaw, gzip: sharedGzip },
  missing,
  pages,
};

await writeFile(OUT, `${JSON.stringify(result, null, 2)}\n`);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
if (missing.length > 0) {
  console.warn(`Warning: ${missing.length} manifest file(s) not emitted: ${missing.join(', ')}`);
}
console.log(`Shared by all pages: ${kb(sharedGzip)} gzip (${kb(sharedRaw)} raw)`);
console.log(`Measured ${Object.keys(pages).length} routes -> ${OUT}`);
