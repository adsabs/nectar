import { afterEach, beforeEach, expect, test } from 'vitest';
import { clear, record, useFallbackStore } from './fallbackStore';

const entries = () => useFallbackStore.getState().entries;

// record() defers its store write to a microtask; flush before asserting.
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  process.env.NEXT_PUBLIC_SCIX_ID_HUD = 'true';
  clear();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SCIX_ID_HUD;
  clear();
});

test('dedupes by surface+reason, incrementing count and updating timestamp', async () => {
  record({ surface: 'abstract', reason: 'no-scix-id', bibcode: '2020A' });
  await flush();
  const firstAt = entries()[0].at;
  record({ surface: 'abstract', reason: 'no-scix-id', bibcode: '2020A' });
  await flush();

  expect(entries()).toHaveLength(1);
  expect(entries()[0].count).toBe(2);
  expect(entries()[0].at).toBeGreaterThanOrEqual(firstAt);
});

test('distinct keys coexist as separate entries', async () => {
  record({ surface: 'abstract', reason: 'no-scix-id' });
  record({ surface: 'abstract', reason: 'backend-requires-bibcode', scixId: 'sx1' });
  record({ surface: 'results', reason: 'no-scix-id' });
  await flush();

  expect(entries()).toHaveLength(3);
});

test('clear() empties the store', async () => {
  record({ surface: 'abstract', reason: 'no-scix-id' });
  await flush();
  expect(entries()).toHaveLength(1);

  clear();
  expect(entries()).toHaveLength(0);
});

test('record no-ops when debug is disabled', () => {
  delete process.env.NEXT_PUBLIC_SCIX_ID_HUD;
  record({ surface: 'abstract', reason: 'no-scix-id' });

  expect(entries()).toHaveLength(0);
});
