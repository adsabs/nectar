import { AdsAPIClient } from 'adsapi';
import { test, vi } from 'vitest';

const requestMock = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: () => ({
      request: requestMock,
    }),
    isAxiosError: () => false,
  },
}));

test('api', async () => {
  const adsAPI = new AdsAPIClient({ baseURL: 'http://localhost:3000' });
  const searchService = adsAPI.getSearchService();
  requestMock.mockResolvedValueOnce({ data: 'test', status: 200, headers: {} });
  await searchService.search({ query: { q: 'test' } });
  expect(requestMock).toHaveBeenCalledWith({
    method: 'GET',
    url: '/search/query',
    params: {
      query: { q: 'test' },
    },
  });
});
