import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { normalizeAbsPath, rewriteAbsIdentifier } from '@/middleware';

const buildRequest = (path: string) => new NextRequest(`http://localhost:8000${path}`);

describe.concurrent('normalizeAbsPath', () => {
  it('rewrites multi-segment DOI with view', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320/citations');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/citations');
  });

  it('rewrites exportcitation with format', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320/exportcitation/bibtex');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/exportcitation/bibtex');
  });

  it('does not rewrite single-segment id with known view', () => {
    const result = normalizeAbsPath('/abs/2026JHEAp..5000470P/abstract');
    expect(result.shouldRewrite).toBe(false);
  });

  it('rewrites multi-segment id without explicit view to abstract', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/abstract');
  });

  it('rewrites unknown view to abstract when multi-segment id', () => {
    const result = normalizeAbsPath('/abs/10.48550/arXiv.2507.19320/unknown');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/abstract');
  });

  it('rewrites encoded id with unknown view to abstract', () => {
    const result = normalizeAbsPath('/abs/10.48550%2FarXiv.2507.19320/unknown');
    expect(result.shouldRewrite).toBe(true);
    expect(result.rewrittenPath).toBe('/abs/10.48550%2FarXiv.2507.19320/abstract');
  });

  it('skips rewrite for already encoded id', () => {
    const result = normalizeAbsPath('/abs/10.48550%2FarXiv.2507.19320/metrics');
    expect(result.shouldRewrite).toBe(false);
  });

  it('ignores non-abs paths', () => {
    const result = normalizeAbsPath('/search?q=test');
    expect(result.shouldRewrite).toBe(false);
  });
});

describe.concurrent('rewriteAbsIdentifier', () => {
  it('sets middleware rewrite header for multi-segment DOI', () => {
    const req = buildRequest('/abs/10.48550/arXiv.2507.19320/citations');
    const res = rewriteAbsIdentifier(req);
    expect(res).not.toBeNull();
    expect(res?.headers.get('x-middleware-rewrite')).toContain('/abs/10.48550%2FarXiv.2507.19320/citations');
  });

  it('returns null for single-segment id + view', () => {
    const req = buildRequest('/abs/2026JHEAp..5000470P/abstract');
    const res = rewriteAbsIdentifier(req);
    expect(res).toBeNull();
  });
});
