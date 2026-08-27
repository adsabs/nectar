#!/usr/bin/env node
/**
 * Diffs two size manifests into a markdown report for a PR comment.
 *
 * Reports but does not gate. Set BUNDLE_FAIL_THRESHOLD_KB to fail when the
 * shared baseline grows past it.
 *
 * Usage: node scripts/compare-bundle-sizes.mjs <base.json> <head.json> [out.md]
 */
import { readFile, writeFile } from 'node:fs/promises';

const [basePath, headPath, outPath = 'bundle-report.md'] = process.argv.slice(2);

if (!basePath || !headPath) {
  console.error('Usage: compare-bundle-sizes.mjs <base.json> <head.json> [out.md]');
  process.exit(1);
}

const readJson = async (path) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
};

const head = await readJson(headPath);
if (!head) {
  console.error(`Could not read head manifest at ${headPath}`);
  process.exit(1);
}
const base = await readJson(basePath);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const delta = (d) => {
  if (d === 0) {
    return '—';
  }
  const sign = d > 0 ? '+' : '';
  return `${sign}${(d / 1024).toFixed(1)} kB`;
};
// Anything under a kB is build noise, not a real move.
const NOISE_FLOOR = 1024;
const icon = (d) => {
  if (d > NOISE_FLOOR) {
    return '🔴';
  }
  if (d < -NOISE_FLOOR) {
    return '🟢';
  }
  return '⚪';
};

const lines = ['## Bundle size', ''];

if (!base) {
  lines.push('No baseline found for the target branch — reporting absolute sizes only.', '');
  lines.push('| Route | First load (gzip) |', '| --- | ---: |');
  lines.push(`| **Shared by all** | **${kb(head.shared.gzip)}** |`);
  const sorted = Object.entries(head.pages).sort(([a], [b]) => a.localeCompare(b));
  for (const [route, size] of sorted) {
    lines.push(`| \`${route}\` | ${kb(size.gzip)} |`);
  }
} else {
  const sharedDelta = head.shared.gzip - base.shared.gzip;
  lines.push(
    `**Shared by all pages: ${kb(head.shared.gzip)}** ` +
      `(${delta(sharedDelta)}) ${icon(sharedDelta)}`,
    '',
  );

  const routes = [...new Set([...Object.keys(base.pages), ...Object.keys(head.pages)])];
  const rows = routes
    .map((route) => {
      const b = base.pages[route]?.gzip ?? null;
      const h = head.pages[route]?.gzip ?? null;
      return { route, base: b, head: h, diff: b === null || h === null ? null : h - b };
    })
    .filter((r) => r.diff === null || Math.abs(r.diff) > NOISE_FLOOR)
    .sort((a, b) => Math.abs(b.diff ?? Infinity) - Math.abs(a.diff ?? Infinity));

  if (rows.length === 0) {
    lines.push('No route changed by more than 1 kB. ✅');
  } else {
    lines.push('| Route | Base | Head | Change |', '| --- | ---: | ---: | ---: |');
    for (const row of rows.slice(0, 30)) {
      if (row.base === null) {
        lines.push(`| \`${row.route}\` | — | ${kb(row.head)} | 🆕 added |`);
      } else if (row.head === null) {
        lines.push(`| \`${row.route}\` | ${kb(row.base)} | — | 🗑️ removed |`);
      } else {
        const change = `${delta(row.diff)} ${icon(row.diff)}`;
        lines.push(`| \`${row.route}\` | ${kb(row.base)} | ${kb(row.head)} | ${change} |`);
      }
    }
    if (rows.length > 30) {
      lines.push('', `_…and ${rows.length - 30} more routes changed._`);
    }
  }

  const raw = process.env.BUNDLE_FAIL_THRESHOLD_KB;
  const threshold = raw === undefined || raw === '' ? 0 : Number(raw);
  if (!Number.isFinite(threshold)) {
    console.error(`Ignoring BUNDLE_FAIL_THRESHOLD_KB="${raw}": not a number.`);
  } else if (threshold > 0 && sharedDelta > threshold * 1024) {
    lines.push('', `> ⚠️ Shared baseline grew by more than the ${threshold} kB threshold.`);
    console.error(`Shared baseline grew ${kb(sharedDelta)} (threshold ${threshold} kB)`);
    // Report still gets written below, so the comment explains the failure.
    process.exitCode = 1;
  }
}

lines.push('', '<sub>First load = polyfills + shared `_app` chunks + route chunks, gzipped.</sub>');

await writeFile(outPath, `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
