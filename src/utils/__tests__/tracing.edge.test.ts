import { describe, expect, it, vi } from 'vitest';
import { pickTracingHeadersEdge } from '@/utils/tracing.edge';

describe('pickTracingHeadersEdge', () => {
  it('extracts tracing headers from a Request-like headers object', () => {
    const headers = new Headers({
      'X-Amzn-Trace-Id': 'Root=1-abc-def',
      'X-Forwarded-For': '10.0.0.1',
      'Content-Type': 'text/html',
    });

    const result = pickTracingHeadersEdge(headers);

    expect(result).toEqual({
      'X-Amzn-Trace-Id': 'Root=1-abc-def',
      'X-Forwarded-For': '10.0.0.1',
    });
  });

  it('handles missing headers gracefully', () => {
    const result = pickTracingHeadersEdge(new Headers());
    expect(result).toEqual({});
  });

  it('sanitizes control characters from header values', () => {
    // jsdom Headers rejects control characters per Fetch spec, but real
    // edge runtimes can receive them from upstream proxies. Stub .get()
    // to simulate a value containing control characters.
    const headers = new Headers();
    vi.spyOn(headers, 'get').mockImplementation((key: string) => {
      if (key.toLowerCase() === 'x-amzn-trace-id') {
        return 'Root=1-abc\r\ndef';
      }
      return null;
    });

    const result = pickTracingHeadersEdge(headers);

    expect(result['X-Amzn-Trace-Id']).toBe('Root=1-abcdef');
  });
});
