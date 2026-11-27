#!/usr/bin/env tsx
/**
 * Regenerates src/lib/analytics/contract.json from the event registry.
 *
 * Usage: npx tsx scripts/export-analytics-contract.mts
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { contractToJson } from '../src/lib/analytics/contract';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const OUT = join(scriptDir, '../src/lib/analytics/contract.json');

await writeFile(OUT, contractToJson());

console.log(`Wrote analytics contract -> ${OUT}`);
