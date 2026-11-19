import { describe, expect, test } from 'vitest';
import { ABS_VIEWS, LEGACY_ROUTE_ROOTS, resolveLegacyHashRoute } from './legacyRoutes';
import traffic from './__fixtures__/legacy-hash-traffic.json';

type Entry = { hits: number; hash: string };

const corpus = traffic as Entry[];

const rootOf = (hash: string) => hash.replace(/^#!?\/?/, '').split('/')[0];
const isRecognized = (hash: string) => LEGACY_ROUTE_ROOTS.includes(rootOf(hash));

const recognized = corpus.filter((e) => isRecognized(e.hash));
const unrecognized = corpus.filter((e) => !isRecognized(e.hash));

describe('real bumblebee traffic corpus', () => {
  test('probe: the fixture still covers the traffic it was built from', () => {
    expect(corpus.length).toBeGreaterThan(100);
    expect(recognized.length).toBeGreaterThan(unrecognized.length);
  });

  test.each(recognized.map((e) => [e.hash, e.hits] as const))('resolves %s (%i hits)', (hash) => {
    const target = resolveLegacyHashRoute(hash);

    expect(target, 'a recognized legacy root must resolve somewhere').not.toBeNull();
    expect(target).toMatch(/^\/[^/]/);
    expect(target).not.toContain('#');
  });

  test.each(unrecognized.map((e) => [e.hash] as const))('leaves %s alone', (hash) => {
    expect(resolveLegacyHashRoute(hash)).toBeNull();
  });

  describe('abs identifiers', () => {
    const absEntries = recognized.filter((e) => rootOf(e.hash) === 'abs');

    test('probe: the corpus is mostly abs routes, which is what this feature is for', () => {
      const absHits = absEntries.reduce((n, e) => n + e.hits, 0);
      const allHits = corpus.reduce((n, e) => n + e.hits, 0);
      expect(absHits / allHits).toBeGreaterThan(0.8);
    });

    test.each(absEntries.map((e) => [e.hash] as const))('%s lands on a view nectar serves', (hash) => {
      const target = resolveLegacyHashRoute(hash) as string;
      const segments = target.split('/').filter(Boolean);

      expect(segments[0]).toBe('abs');
      expect(ABS_VIEWS.has(segments[2])).toBe(true);
    });

    test.each(absEntries.map((e) => [e.hash] as const))('%s encodes the identifier as one segment', (hash) => {
      const target = resolveLegacyHashRoute(hash) as string;
      const id = target.split('/')[2];

      expect(id.length).toBeGreaterThan(0);
      expect(id).not.toContain('/');
      expect(id).not.toContain('&');
      expect(decodeURIComponent(id).length).toBeGreaterThan(0);
    });

    test.each(absEntries.map((e) => [e.hash] as const))('%s accounts for the whole fragment', (hash) => {
      const target = resolveLegacyHashRoute(hash) as string;
      const id = decodeURIComponent(target.split('/')[2]);
      const body = decodeURIComponent(hash.replace(/^#!?\/?abs\//, ''));

      expect(body.startsWith(id)).toBe(true);

      const remainder = body.slice(id.length);
      expect(remainder === '' || /^\/[^/]+(\/[^/]+)?$/.test(remainder)).toBe(true);
    });
  });
});
