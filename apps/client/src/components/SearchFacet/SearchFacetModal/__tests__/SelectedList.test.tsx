import { SearchFacetID } from '@/components/SearchFacet/types';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { FacetStoreProvider } from '@/components/SearchFacet/store/FacetStore';
import { expect, test } from 'vitest';
import { SelectedList } from '@/components/SearchFacet/SearchFacetModal/SelectedList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const setup = (id?: SearchFacetID) => {
  const user = userEvent.setup();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 } } });

  const result = render(<SelectedList />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <FacetStoreProvider facetId={id ?? 'author'}>{children}</FacetStoreProvider>
      </QueryClientProvider>
    ),
  });
  return { ...result, user };
};

test('renders nothing when selected list is empty', () => {
  const { queryByRole } = setup();
  expect(queryByRole('list')).not.toBeInTheDocument();
});
