import { describe, expect, it } from 'vitest';
import { pickTracingHeaders, TRACING_HEADERS } from '@/config';

describe('pickTracingHeaders', () => {
  it('extracts tracing headers from lowercase IncomingHttpHeaders', () => {
    const headers = {
      'x-original-uri': '/some/path',
      'x-amzn-trace-id': 'Root=1-abc-def',
      'content-type': 'application/json',
    };

    const result = pickTracingHeaders(headers);

    expect(result).toEqual({
      'X-Original-Uri': '/some/path',
      'X-Amzn-Trace-Id': 'Root=1-abc-def',
    });
  });

  it('handles missing headers gracefully', () => {
    const result = pickTracingHeaders({});
    expect(result).toEqual({});
  });

  it('ignores array-valued headers', () => {
    const headers = {
      'x-forwarded-for': ['1.2.3.4', '5.6.7.8'],
    };

    const result = pickTracingHeaders(headers as Record<string, string | string[]>);
    expect(result).toEqual({});
  });

  it('preserves original key casing from TRACING_HEADERS', () => {
    const headers = {
      'x-original-uri': '/path',
      'x-original-forwarded-for': '1.2.3.4',
      'x-forwarded-for': '5.6.7.8',
      'x-amzn-trace-id': 'Root=1-abc',
    };

    const result = pickTracingHeaders(headers);

    // Keys should match TRACING_HEADERS casing, not the lowercased input
    expect(Object.keys(result)).toEqual(TRACING_HEADERS);
  });
});
