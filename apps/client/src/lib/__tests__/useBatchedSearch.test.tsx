import { useBatchedSearch } from '@/lib/useBatchedSearch';
import { createServerListenerMocks, renderHook, urls } from '@/test-utils';
import { expect, test, TestContext } from 'vitest';
import { waitFor } from '@testing-library/dom';

// beforeEach(() => {
//   vi.useFakeTimers();
// });
// afterEach(() => {
//   vi.restoreAllMocks();
// });

test('basic case works without crashing', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  const batches = 1;
  const rows = 10;
  const { result } = renderHook<typeof useBatchedSearch>(
    (props) => useBatchedSearch(...props),
    {},
    {
      initialProps: [
        { q: 'star', rows, fl: ['bibcode'] },
        { batches, intervalDelay: 1 },
      ],
    },
  );

  await waitFor(() => expect(result.current.data.numFound).toEqual(20));
  expect(urls(onRequest).filter((v) => v === '/search/query')).toHaveLength(2);
});

test.skip('properly handles weird batches and rows', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  const batches = 17;
  const rows = 43;
  const { result } = renderHook<typeof useBatchedSearch>(
    (props) => useBatchedSearch(...props),
    {},
    {
      initialProps: [
        { q: 'star', rows, fl: ['bibcode'] },
        { batches, intervalDelay: 1 },
      ],
    },
  );

  await waitFor(() => expect(result.current.data.numFound).toEqual(731));
  expect(urls(onRequest).filter((v) => v === '/search/query')).toHaveLength(17);
});
