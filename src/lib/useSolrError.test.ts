import { describe, expect, test } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import { SOLR_ERROR, useSolrError } from './useSolrError';
import { solrErrorToCopy } from '@/components/SolrErrorAlert/SolrErrorAlert';

const makeAxiosError = (status: number, data: unknown = {}): AxiosError => {
  const response = { status, data, statusText: '', headers: {}, config: {} } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
};

describe('useSolrError 429 mapping', () => {
  test('maps an HTTP 429 to TOO_MANY_REQUESTS', () => {
    expect(useSolrError(makeAxiosError(429)).error).toBe(SOLR_ERROR.TOO_MANY_REQUESTS);
  });

  test('maps a solr body code 429 to TOO_MANY_REQUESTS', () => {
    const error = makeAxiosError(429, { error: { code: 429, msg: 'too many requests' } });
    expect(useSolrError(error).error).toBe(SOLR_ERROR.TOO_MANY_REQUESTS);
  });
});

describe('solrErrorToCopy for rate limiting', () => {
  const rlError = { error: SOLR_ERROR.TOO_MANY_REQUESTS, originalMsg: 'too many requests' };

  test('anonymous copy is the bare lead — the component appends the CTA and tail', () => {
    const copy = solrErrorToCopy(rlError, { isAuthenticated: false });
    expect(copy.title).toMatch(/rate limit/i);
    expect(copy.message).toMatch(/too many requests/i);
    expect(copy.message).not.toMatch(/try again later|higher limits|account/i);
  });

  test('authenticated copy completes with a try-again tail and no CTA', () => {
    const copy = solrErrorToCopy(rlError, { isAuthenticated: true });
    expect(copy.message).toMatch(/try again later/i);
    expect(copy.message).not.toMatch(/higher limits|account/i);
  });
});
