import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SOURCES = {
  gptbot: 'https://openai.com/gptbot.json',
  duckduckbot: 'https://duckduckgo.com/duckduckbot.json',
};

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'middlewares',
  'crawler-ranges.generated.json',
);

const fetchRanges = async (name, url) => {
  const res = await fetch(url, { headers: { 'user-agent': 'nectar-crawler-range-sync' } });
  if (!res.ok) {
    throw new Error(`${name}: ${url} responded ${res.status}`);
  }

  const body = await res.json();
  const prefixes = (body.prefixes ?? [])
    .map((entry) => entry.ipv4Prefix ?? entry.ipv6Prefix)
    .filter((prefix) => typeof prefix === 'string');

  if (prefixes.length === 0) {
    throw new Error(`${name}: no prefixes parsed from ${url}`);
  }

  return { creationTime: body.creationTime ?? null, prefixes };
};

const main = async () => {
  const entries = await Promise.all(
    Object.entries(SOURCES).map(async ([name, url]) => {
      const { creationTime, prefixes } = await fetchRanges(name, url);
      console.log(`${name}: ${prefixes.length} prefixes (published ${creationTime ?? 'unknown'})`);
      return [name, { source: url, creationTime, prefixes }];
    }),
  );

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    crawlers: Object.fromEntries(entries),
  };

  await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`\nwrote ${path.relative(process.cwd(), OUT)}`);
};

await main();
