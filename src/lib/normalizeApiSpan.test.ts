import { test, expect, describe } from 'vitest';

import { beforeSendApiSpan, type SpanJSON } from '@/lib/normalizeApiSpan';

function makeSpan(partial: Partial<SpanJSON>): SpanJSON {
  return {
    data: {},
    span_id: 'span',
    trace_id: 'trace',
    start_timestamp: 0,
    ...partial,
  };
}

function tag(description: string): { domain?: unknown; endpoint?: unknown } {
  const span = beforeSendApiSpan(makeSpan({ op: 'http.client', description }));
  return { domain: span.data['api.domain'], endpoint: span.data['api.endpoint'] };
}

describe('beforeSendApiSpan', () => {
  test('tags a bare endpoint (client host)', () => {
    expect(tag('GET https://scixplorer.org/v1/accounts/bootstrap')).toEqual({
      domain: 'accounts',
      endpoint: '/v1/accounts/bootstrap',
    });
  });

  test('tags an internal SSR host', () => {
    expect(tag('GET http://api-gateway-nectar/v1/search/query')).toEqual({
      domain: 'search',
      endpoint: '/v1/search/query',
    });
  });

  test('strips the query string', () => {
    expect(tag('GET https://scixplorer.org/v1/search/query?q=star&rows=10')).toEqual({
      domain: 'search',
      endpoint: '/v1/search/query',
    });
  });

  test('parameterizes a base64url library id', () => {
    expect(tag('GET https://scixplorer.org/v1/biblib/libraries/BoDFB3aLS0epIdTMiFbxvg')).toEqual({
      domain: 'biblib',
      endpoint: '/v1/biblib/libraries/{id}',
    });
  });

  test('parameterizes an ORCID id but keeps static sub-resources', () => {
    expect(tag('GET https://scixplorer.org/v1/orcid/0000-0002-1825-0097/orcid-profile/full')).toEqual({
      domain: 'orcid',
      endpoint: '/v1/orcid/{id}/orcid-profile/full',
    });
  });

  test('parameterizes a multi-id path (notes by library + bibcode)', () => {
    expect(tag('PUT https://scixplorer.org/v1/biblib/notes/aBcDeF12/2023ApJ...123')).toEqual({
      domain: 'biblib',
      endpoint: '/v1/biblib/notes/{id}/{id}',
    });
  });

  test('treats an email segment as dynamic (no PII leak)', () => {
    const { endpoint } = tag('POST https://scixplorer.org/v1/accounts/user/reset-password/bob@example.com');
    expect(endpoint).toBe('/v1/accounts/user/reset-password/{id}');
  });

  test('keeps a short static export format intact', () => {
    expect(tag('POST https://scixplorer.org/v1/export/bibtex')).toEqual({
      domain: 'export',
      endpoint: '/v1/export/bibtex',
    });
  });

  test('keeps a long static route word intact (site_wide_message, 17 chars)', () => {
    expect(tag('GET https://scixplorer.org/v1/vault/configuration/site_wide_message')).toEqual({
      domain: 'vault',
      endpoint: '/v1/vault/configuration/site_wide_message',
    });
  });

  test('keeps a long hyphenated/underscored static word intact (notification_query)', () => {
    expect(tag('GET https://scixplorer.org/v1/vault/notification_query')).toEqual({
      domain: 'vault',
      endpoint: '/v1/vault/notification_query',
    });
  });

  test('parameterizes a long opaque token that is not a plain route word', () => {
    const { endpoint } = tag('GET https://scixplorer.org/v1/biblib/libraries/abc+def=ghijklmnop');
    expect(endpoint).toBe('/v1/biblib/libraries/{id}');
  });

  test('handles a relative target with no host', () => {
    expect(tag('GET /v1/metrics')).toEqual({
      domain: 'metrics',
      endpoint: '/v1/metrics',
    });
  });

  test('strips a fragment on a relative target', () => {
    expect(tag('GET /v1/search/query#section')).toEqual({
      domain: 'search',
      endpoint: '/v1/search/query',
    });
  });

  test('clamps an unknown first segment to the `other` domain', () => {
    expect(tag('GET https://scixplorer.org/v1/mystery/thing')).toEqual({
      domain: 'other',
      endpoint: '/v1/mystery/thing',
    });
  });

  test('redacts a dynamic first segment so it cannot leak as a raw value', () => {
    expect(tag('GET https://scixplorer.org/v1/bob@example.com/reset')).toEqual({
      domain: 'other',
      endpoint: '/v1/{id}/reset',
    });
  });

  test('redacts a token-like first segment', () => {
    expect(tag('GET https://scixplorer.org/v1/BoDFB3aLS0epIdTMiFbxvg/thing')).toEqual({
      domain: 'other',
      endpoint: '/v1/{id}/thing',
    });
  });

  test('preserves pre-existing span.data', () => {
    const span = beforeSendApiSpan(
      makeSpan({
        op: 'http.client',
        description: 'GET https://scixplorer.org/v1/search/query',
        data: { 'http.request.method': 'GET' },
      }),
    );
    expect(span.data['http.request.method']).toBe('GET');
    expect(span.data['api.domain']).toBe('search');
  });

  test('ignores non-http.client spans', () => {
    const span = beforeSendApiSpan(makeSpan({ op: 'ui.render', description: 'GET /v1/search/query' }));
    expect(span.data['api.domain']).toBeUndefined();
  });

  test('ignores http.client spans that are not /v1 API calls', () => {
    const span = beforeSendApiSpan(
      makeSpan({ op: 'http.client', description: 'GET https://www.google-analytics.com/g/collect' }),
    );
    expect(span.data['api.domain']).toBeUndefined();
    expect(span.data['api.endpoint']).toBeUndefined();
  });

  test('passes through a span with no description', () => {
    const span = beforeSendApiSpan(makeSpan({ op: 'http.client' }));
    expect(span.data['api.domain']).toBeUndefined();
  });
});
