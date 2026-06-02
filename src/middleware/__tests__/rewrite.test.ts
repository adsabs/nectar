import { describe, expect, test } from 'vitest';
import { NextRequest } from 'next/server';

import { normalizeAbsPath, rewriteAbsIdentifier } from '@/middleware';

const buildRequest = (path: string) => new NextRequest(`http://localhost:8000${path}`);

describe.concurrent('normalizeAbsPath', () => {
  test('rewrites multi-segment DOI with view', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320/citations');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/citations');
  });

  test('rewrites exportcitation with format', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320/exportcitation/bibtex');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/exportcitation/bibtex');
  });

  test('does not rewrite single-segment id with known view', () => {
    const result = normalizeAbsPath('/abs/2026JHEAp..5000470P/abstract');
    expect(result.shouldRewrite).toBe(false);
  });

  test('rewrites multi-segment id without explicit view to abstract', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/abstract');
  });

  test('preserves unknown trailing segment as part of DOI identifier', () => {
    // There is no safe way to distinguish an unknown view token from a DOI suffix
    // component — keep all segments rather than risk dropping a real DOI part.
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320/unknown');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320%2Funknown/abstract');
  });

  test('rewrites encoded id with unknown view to abstract', () => {
    const result = normalizeAbsPath('/abs/10.48550%2FarXiv.2507.19320/unknown');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/abstract');
  });

  test('skips rewrite for already encoded id', () => {
    const result = normalizeAbsPath('/abs/10.48550%2FarXiv.2507.19320/metrics');
    expect(result.shouldRewrite).toBe(false);
  });

  test('ignores non-abs paths', () => {
    const result = normalizeAbsPath('/search?q=test');
    expect(result.shouldRewrite).toBe(false);
  });

  test('reassembles multi-segment DOI with special chars when no view is present', () => {
    // Browser strips '#/abstract' from .../3.0.CO;2-#/abstract before sending to server.
    // The server receives the path without '#' and without the view segment.
    // The middleware should keep all segments (special chars rule out a view token).
    const result = normalizeAbsPath('/abs/10.1002/1521-3994(199908)320:4/5<163::AID-ASNA163>3.0.CO;2-');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe(
      '/abs/10.1002%2F1521-3994(199908)320%3A4%2F5%3C163%3A%3AAID-ASNA163%3E3.0.CO%3B2-/abstract',
    );
  });

  test('handles pre-encoded special chars in DOI without double-encoding', () => {
    // <> encoded as %3C/%3E in the URL — the middleware must not further encode the %
    // into %25, which would produce %253C and cause a no-results lookup.
    const result = normalizeAbsPath('/abs/10.1002/1521-3994(199908)320:4/5%3C163::AID-ASNA163%3E3.0.CO;2-');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe(
      '/abs/10.1002%2F1521-3994(199908)320%3A4%2F5%3C163%3A%3AAID-ASNA163%3E3.0.CO%3B2-/abstract',
    );
  });

  test('skips rewrite for pre-encoded # DOI — treated as single-segment id', () => {
    // When the link was generated with encodeURIComponent the # becomes %23 and the
    // whole DOI is a single path segment; no multi-segment rewrite needed.
    const result = normalizeAbsPath(
      '/abs/10.1002%2F1521-3994(199908)320%3A4%2F5%3C163%3A%3AAID-ASNA163%3E3.0.CO%3B2-%23/abstract',
    );
    expect(result.shouldRewrite).toBe(false);
  });
});

describe.concurrent('rewriteAbsIdentifier', () => {
  test('sets middleware rewrite header for multi-segment DOI', () => {
    const req = buildRequest('/abs/10.48550/arXiv.2507.19320/citations');
    const res = rewriteAbsIdentifier(req);
    expect(res).not.toBeNull();
    expect(res?.headers.get('x-middleware-rewrite')).toContain('/abs/10.48550%2FarXiv.2507.19320/citations');
  });

  test('returns null for single-segment id + view', () => {
    const req = buildRequest('/abs/2026JHEAp..5000470P/abstract');
    const res = rewriteAbsIdentifier(req);
    expect(res).toBeNull();
  });
});
