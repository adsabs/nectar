import { useBatchedSearch } from '@lib/useBatchedSearch';
import { DefaultProviders } from '@test-utils';
import { renderHook } from '@testing-library/react-hooks';
import { expect, test } from 'vitest';

const setup = (initialProps: Parameters<typeof useBatchedSearch>) => {
  const utils = renderHook<Parameters<typeof useBatchedSearch>, ReturnType<typeof useBatchedSearch>>(
    (args) => useBatchedSearch(...args),
    {
      initialProps,
      wrapper: ({ children }) => {
        return <DefaultProviders>{children}</DefaultProviders>;
      },
    },
  );

  return utils;
};

test.skip('basic case works without crashing', async () => {
  const batches = 5;
  const rows = 10;
  const { result, waitFor } = setup([
    { q: 'star', rows, fl: ['bibcode'] },
    { batches, intervalDelay: 1 },
  ]);
  await waitFor(() => !!result.current.data, { timeout: 3000 });
  expect(result.current.data.numFound).toEqual(batches * rows);
  expect(result.current.data.docs).toHaveLength(batches * rows);
});
