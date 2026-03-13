import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoreProvider, createStore } from '@/store';
import { theme } from '@/theme';
import { SearchResultsList } from './SearchResultsList';
import type { IDocsEntity } from '@/api/search/types';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/search',
    query: { q: 'stars' },
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  }),
}));

vi.mock('next/dynamic', () => ({
  // Return a valid no-op component so dynamic()-created elements don't throw
  default: () => () => null,
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return { ...actual, useBreakpointValue: () => false };
});

vi.mock('@/lib/useScrollRestoration', () => ({
  useScrollRestoration: vi.fn().mockReturnValue({ saveScrollPosition: vi.fn() }),
}));

vi.mock('@/lib/useAuthorsPerResult', () => ({
  useAuthorsPerResult: () => 3,
}));

vi.mock('@/components/AllAuthorsModal', () => ({
  AuthorList: () => null,
}));

vi.mock('@/components/ResultList/Item/ItemResourceDropdowns', () => ({
  ItemResourceDropdowns: () => null,
}));

vi.mock('@/lib/useIsClient', () => ({
  useIsClient: () => true,
}));

vi.mock('better-react-mathjax', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MathJax: ({ children }: { children?: any }) => <span>{children}</span>,
}));

const MOCK_DOC: IDocsEntity = {
  bibcode: '2024test....1A',
  title: ['A result'],
  author: ['Smith, J.'],
  author_count: 1,
  pubdate: '2024-01-01',
  pub: 'Test Journal',
  citation_count: 25,
  citation_count_norm: 3.5,
} as IDocsEntity;

const renderList = (props: Partial<React.ComponentProps<typeof SearchResultsList>> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 } },
  });
  const store = createStore({} as never);

  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider createStore={() => store}>
          <SearchResultsList docs={[MOCK_DOC]} isLoading={false} indexStart={0} {...props} />
        </StoreProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
};

// --- Group D: Sort and row-rendering behavior ---

describe('SearchResultsList citation rendering', () => {
  test('D1: normalized citation sort renders cited(n) value', () => {
    renderList({ useNormCite: true });

    expect(screen.getByText(/cited\(n\):\s*3\.50/)).toBeInTheDocument();
    expect(screen.queryByText(/^cited:\s*25$/)).not.toBeInTheDocument();
  });

  test('D2: non-normalized sort renders raw citation count', () => {
    renderList({ useNormCite: false });

    expect(screen.getByText(/^cited:\s*25$/)).toBeInTheDocument();
    expect(screen.queryByText(/cited\(n\)/)).not.toBeInTheDocument();
  });
});
