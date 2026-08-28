import { createServerListenerMocks, render, waitFor } from '@/test-utils';
import { expect, test } from 'vitest';
import type { TestContext } from 'vitest';
import { IDocsEntity } from '@/api/search/types';
import { SimpleResultList } from './SimpleResultList';

const makeDocs = (withAbstract: boolean): IDocsEntity[] =>
  ['2020ApJ...900..1A', '2020ApJ...900..2B', '2020ApJ...900..3C'].map((bibcode, i) => ({
    bibcode,
    title: [`Title ${i}`],
    ...(withAbstract ? { abstract: `Abstract for ${bibcode}` } : {}),
  })) as IDocsEntity[];

const searchRequestCount = (onRequest: { mock: { calls: { 0: { url: URL } }[] } }) =>
  onRequest.mock.calls.map((call) => call[0].url).filter((url) => url.pathname.endsWith('/search/query')).length;

test('issues one bulk abstract fetch when showAbstracts is on and results lack abstracts', async ({
  server,
}: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  render(<SimpleResultList docs={makeDocs(false)} />, { initialStore: { showAbstracts: true } });

  await waitFor(() => expect(searchRequestCount(onRequest)).toBe(1));
});

test('does not issue any abstract fetch when the results already carry abstracts', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  render(<SimpleResultList docs={makeDocs(true)} />, { initialStore: { showAbstracts: true } });

  // allow any (unwanted) bulk or per-item fetch a chance to fire
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(searchRequestCount(onRequest)).toBe(0);
});

test('does not bulk-fetch abstracts when allowAbstracts is false, even with the global toggle on', async ({
  server,
}: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  // latestQuery is unrelated to the rendered docs, so a bulk fetch here would
  // mean the toggle leaked past allowAbstracts=false.
  render(<SimpleResultList docs={makeDocs(false)} allowAbstracts={false} />, {
    initialStore: {
      showAbstracts: true,
      latestQuery: { q: 'star', fl: ['bibcode'], sort: ['date desc'], start: 0, rows: 5 },
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(searchRequestCount(onRequest)).toBe(0);
});
