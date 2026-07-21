import { afterEach, beforeEach, expect, test } from 'vitest';
import { bibcodeForApi, getCanonicalId, getEncodedCanonicalId } from './canonicalId';
import { clear, useFallbackStore } from './fallbackStore';

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

test('getCanonicalId returns scix_id when present and records nothing', async () => {
  const id = getCanonicalId({ scix_id: 'scix:123', bibcode: '2020A' }, { surface: 'abstract' });
  await flush();

  expect(id).toBe('scix:123');
  expect(entries()).toHaveLength(0);
});

test('getCanonicalId falls back to bibcode and records no-scix-id when scix_id absent', async () => {
  const id = getCanonicalId({ bibcode: '2020A' }, { surface: 'abstract' });
  await flush();

  expect(id).toBe('2020A');
  expect(entries()).toHaveLength(1);
  expect(entries()[0]).toMatchObject({ reason: 'no-scix-id', surface: 'abstract', bibcode: '2020A' });
});

test('getCanonicalId returns empty string when both ids are missing', () => {
  expect(getCanonicalId({}, { surface: 'abstract' })).toBe('');
});

test('getEncodedCanonicalId encodes the canonical id', () => {
  const encoded = getEncodedCanonicalId({ bibcode: '2020A&A...1..1X' }, { surface: 'results' });

  expect(encoded).toBe(encodeURIComponent('2020A&A...1..1X'));
});

test('bibcodeForApi always returns bibcode and records only when scix_id present', async () => {
  const withScix = bibcodeForApi({ scix_id: 'scix:9', bibcode: '2021B' }, { surface: 'export' });
  await flush();
  expect(withScix).toBe('2021B');
  expect(entries()).toHaveLength(1);
  expect(entries()[0]).toMatchObject({
    reason: 'backend-requires-bibcode',
    surface: 'export',
    bibcode: '2021B',
    scixId: 'scix:9',
  });

  clear();
  const withoutScix = bibcodeForApi({ bibcode: '2021B' }, { surface: 'export' });
  await flush();
  expect(withoutScix).toBe('2021B');
  expect(entries()).toHaveLength(0);
});
