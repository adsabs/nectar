import { QueryFunctionContext } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '@/api/api';
import { ApiTargets } from '@/api/models';
import { resolveObjectQuery } from '@/api/objects/objects';
import { IADSApiSearchParams } from '@/api/search/types';
import { fetchAuthorNetwork, fetchPaperNetwork, fetchResultsGraph, fetchWordCloud } from '@/api/vis/vis';

vi.mock('@/api/api', () => ({
  default: { request: vi.fn().mockResolvedValue({ data: {} }) },
}));

vi.mock('@/api/objects/objects', () => ({
  resolveObjectQuery: vi.fn().mockResolvedValue({ query: 'abs:LMC' }),
}));

const request = vi.mocked(api.request);
const resolve = vi.mocked(resolveObjectQuery);

const ctx = (params: IADSApiSearchParams) =>
  ({ meta: { params }, queryKey: [], signal: new AbortController().signal } as unknown as QueryFunctionContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe.each([
  ['fetchAuthorNetwork', fetchAuthorNetwork, ApiTargets.SERVICE_AUTHOR_NETWORK],
  ['fetchPaperNetwork', fetchPaperNetwork, ApiTargets.SERVICE_PAPER_NETWORK],
  ['fetchWordCloud', fetchWordCloud, ApiTargets.SERVICE_WORDCLOUD],
] as const)('%s', (_, fetcher, target) => {
  test('resolves object terms before building the request', async () => {
    await fetcher(ctx({ q: 'object:LMC', rows: 10 }));

    expect(resolve).toHaveBeenCalledWith({ query: 'object:LMC' });
    const config = request.mock.calls[0][0];
    expect(config.url).toEqual(target);
    expect(JSON.stringify(config.data)).toContain('abs:LMC');
    expect(JSON.stringify(config.data)).not.toContain('object:LMC');
  });

  test('skips the object service when no object term is present', async () => {
    await fetcher(ctx({ q: 'star', rows: 10 }));

    expect(resolve).not.toHaveBeenCalled();
    expect(JSON.stringify(request.mock.calls[0][0].data)).toContain('star');
  });
});

describe('fetchResultsGraph', () => {
  test('resolves object terms before querying search', async () => {
    await fetchResultsGraph(ctx({ q: 'object:LMC' }));

    expect(resolve).toHaveBeenCalledWith({ query: 'object:LMC' });
    const config = request.mock.calls[0][0];
    expect(config.url).toEqual(ApiTargets.SEARCH);
    expect((config.params as IADSApiSearchParams).q).toEqual('abs:LMC');
  });

  test('skips the object service when no object term is present', async () => {
    await fetchResultsGraph(ctx({ q: 'star' }));

    expect(resolve).not.toHaveBeenCalled();
    expect((request.mock.calls[0][0].params as IADSApiSearchParams).q).toEqual('star');
  });
});
