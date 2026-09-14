import { beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryFunctionContext } from '@tanstack/react-query';
import api from '@/api/api';
import { ApiTargets } from '@/api/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { fetchVaultExecuteQuery, fetchVaultSearch } from '@/api/vault/vault';

vi.mock('@/api/api', () => ({
  default: { request: vi.fn().mockResolvedValue({ data: {} }) },
}));

const request = vi.mocked(api.request);

const ctx = (params: Record<string, unknown>) =>
  ({ meta: { params }, queryKey: [], signal: new AbortController().signal } as unknown as QueryFunctionContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchVaultExecuteQuery', () => {
  // Dead in production: useVaultExecuteQuery calls fetchVaultSearch, not this.
  test('tags the replayed query', async () => {
    await fetchVaultExecuteQuery(ctx({ qid: 'abc123' }));

    const config = request.mock.calls[0][0];
    expect(config.url).toEqual(`${ApiTargets.MYADS_STORAGE}/execute_query/abc123`);
    expect((config.params as IADSApiSearchParams).ui_tag).toEqual('vault/execute-query');
  });

  test('keeps the qid in the path, not the tag', async () => {
    await fetchVaultExecuteQuery(ctx({ qid: 'some-user-qid' }));

    const config = request.mock.calls[0][0];
    expect(JSON.stringify(config.params)).not.toContain('some-user-qid');
  });
});

describe('fetchVaultSearch', () => {
  // Inert: the qid hash keys on q/fq only, so a tag here never reaches Solr.
  test('does not tag the stored query', async () => {
    await fetchVaultSearch(ctx({ q: 'star', fl: ['bibcode'] }));

    const config = request.mock.calls[0][0];
    expect(config.url).toEqual(ApiTargets.MYADS_STORAGE_QUERY);
    expect(config.params).toBeUndefined();
    expect(JSON.stringify(config.data)).not.toContain('ui_tag');
  });
});
