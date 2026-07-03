import { beforeEach, describe, expect, it, TestContext, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { FormEvent, ReactNode } from 'react';
import { rest } from 'msw';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { DefaultProviders } from '@/test-utils';
import { useStore } from '@/store';
import { ApiTargets } from '@/api/models';
import { IADSApiSearchResponse } from '@/api/search/types';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { useSearchPage } from './useSearchPage';

const mocks = vi.hoisted(() => ({
  sendGTMEvent: vi.fn(),
}));

vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: mocks.sendGTMEvent,
  GoogleTagManager: (): null => null,
}));

const router = {
  isReady: true,
  pathname: '/search',
  asPath: '/search',
  query: {} as Record<string, string | string[]>,
  push: vi.fn(() => Promise.resolve(true)),
  replace: vi.fn(() => Promise.resolve(true)),
  events: { on: vi.fn(), off: vi.fn() },
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const makeWrapper = (searchParams: string) => {
  router.query = {};
  router.asPath = `/search${searchParams}`;
  // hasMemory: URL updates persist like a real browser (the hook writes on mount)
  const NuqsWrapper = withNuqsTestingAdapter({ searchParams, hasMemory: true });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsWrapper>
      <DefaultProviders options={{}}>{children}</DefaultProviders>
    </NuqsWrapper>
  );
  Wrapper.displayName = 'SearchPageTestWrapper';
  return Wrapper;
};

// exercise the page hook and observe store writes through the same provider tree
const useCompound = () => ({
  page: useSearchPage(),
  currentDocs: useStore((state) => state.docs.current),
  numPerPage: useStore((state) => state.numPerPage),
});

const makeSubmitEvent = (q: string): FormEvent<HTMLFormElement> => {
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.name = 'q';
  input.value = q;
  form.appendChild(input);
  return { preventDefault: vi.fn(), currentTarget: form } as unknown as FormEvent<HTMLFormElement>;
};

const deterministicResponse = (numFound: number, bibcodes: string[]): IADSApiSearchResponse =>
  ({
    response: { numFound, docs: bibcodes.map((bibcode) => ({ bibcode })) },
  } as IADSApiSearchResponse);

const overrideSearch = (server: TestContext['server'], body: IADSApiSearchResponse) => {
  server.use(rest.get(apiHandlerRoute(ApiTargets.SEARCH), (_req, res, ctx) => res(ctx.status(200), ctx.json(body))));
};

describe('useSearchPage', () => {
  beforeEach(() => {
    router.push.mockClear();
    mocks.sendGTMEvent.mockClear();
  });

  describe('handlers', () => {
    it('onSubmit updates q, resets p, and preserves the current sort for plain queries', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&sort=citation_count+desc&p=3'),
      });
      await act(async () => {
        result.current.handlers.onSubmit(makeSubmitEvent('galaxies'));
      });
      expect(result.current.params.q).toBe('galaxies');
      expect(result.current.params.p).toBe(1);
      expect(result.current.params.sort[0]).toBe('citation_count desc');
    });

    it('onSubmit forces score desc for second-order operator queries (SCIX-889)', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&sort=date+desc'),
      });
      await act(async () => {
        result.current.handlers.onSubmit(makeSubmitEvent('trending(star formation)'));
      });
      expect(result.current.params.sort[0]).toBe('score desc');
    });

    it('onSubmit is a no-op for an empty query', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&p=2'),
      });
      await act(async () => {
        result.current.handlers.onSubmit(makeSubmitEvent(''));
      });
      expect(result.current.params.q).toBe('stars');
      expect(result.current.params.p).toBe(2);
    });

    it('onSortChange keeps the requested direction for the same field', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&sort=date+desc&p=4'),
      });
      await act(async () => {
        result.current.handlers.onSortChange('date asc');
      });
      expect(result.current.params.sort).toEqual(['date asc', 'date desc']);
      expect(result.current.params.p).toBe(1);
    });

    it('onSortChange applies the default direction when the field changes', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&sort=date+asc'),
      });
      await act(async () => {
        // first_author defaults to asc even though the current direction is asc-on-date
        result.current.handlers.onSortChange('first_author desc');
      });
      // field changed — the requested direction is replaced by the field default
      expect(result.current.params.sort[0]).toBe('first_author asc');
    });

    it('onSortChange is a no-op when the URL has no q', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?sort=date+desc'),
      });
      await act(async () => {
        result.current.handlers.onSortChange('score desc');
      });
      expect(result.current.params.sort).toEqual(['date desc']);
    });

    it('onPerPageChange writes the URL and the persisted preference, resetting p', async () => {
      const { result } = renderHook(() => useCompound(), {
        wrapper: makeWrapper('?q=stars&p=5'),
      });
      await act(async () => {
        result.current.page.handlers.onPerPageChange(25);
      });
      expect(result.current.page.params.rows).toBe(25);
      expect(result.current.page.params.p).toBe(1);
      expect(result.current.numPerPage).toBe(25);
    });

    it('onFacetSubmission navigates through the router with merged params and p reset', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&p=3'),
      });
      await act(async () => {
        result.current.handlers.onFacetSubmission({ fq: ['{!type=aqp v=$fq_author}'], fq_author: 'author:"Smith, J"' });
      });
      expect(router.push).toHaveBeenCalledTimes(1);
      const [dest, , opts] = router.push.mock.calls[0] as unknown as [
        { pathname: string; search: string },
        unknown,
        { scroll: boolean; shallow: boolean },
      ];
      expect(dest.pathname).toBe('/search');
      expect(dest.search).toContain('fq_author=author');
      expect(dest.search).toContain('p=1');
      expect(opts).toEqual({ scroll: false, shallow: true });
    });

    it('onToggleHighlights flips the showHighlights param', async () => {
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars'),
      });
      expect(result.current.showHighlights).toBe(false);
      await act(async () => {
        result.current.handlers.onToggleHighlights();
      });
      expect(result.current.showHighlights).toBe(true);
    });
  });

  describe('result-driven effects', () => {
    it('publishes result bibcodes to the docs slice on success', async ({ server }: TestContext) => {
      overrideSearch(server, deterministicResponse(2, ['bibA', 'bibB']));
      const { result } = renderHook(() => useCompound(), {
        wrapper: makeWrapper('?q=stars'),
      });
      await waitFor(() => expect(result.current.page.results.searchStatus).toBe('success'));
      await waitFor(() => expect(result.current.currentDocs).toEqual(['bibA', 'bibB']));
    });

    it('corrects an out-of-range page to the last valid page after the response', async ({ server }: TestContext) => {
      overrideSearch(server, deterministicResponse(35, ['bib1']));
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&p=99'),
      });
      // rows defaults to 10 -> last valid page is 4
      await waitFor(() => expect(result.current.params.p).toBe(4));
    });

    it('leaves in-range deep links alone (no clamping by a previous query)', async ({ server }: TestContext) => {
      overrideSearch(server, deterministicResponse(1000, ['bib1']));
      const { result } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=stars&p=50'),
      });
      await waitFor(() => expect(result.current.results.searchStatus).toBe('success'));
      expect(result.current.params.p).toBe(50);
      expect(result.current.start).toBe(490);
    });

    it('fires search_no_results once per empty query', async ({ server }: TestContext) => {
      overrideSearch(server, deterministicResponse(0, []));
      const { result, rerender } = renderHook(() => useSearchPage(), {
        wrapper: makeWrapper('?q=nothinghere'),
      });
      await waitFor(() => expect(result.current.results.searchStatus).toBe('empty'));
      rerender();
      rerender();
      expect(mocks.sendGTMEvent).toHaveBeenCalledTimes(1);
      expect(mocks.sendGTMEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'search_no_results', query: 'nothinghere' }),
      );
    });
  });
});
