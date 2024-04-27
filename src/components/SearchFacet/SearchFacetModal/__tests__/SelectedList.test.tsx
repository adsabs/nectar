import { SearchFacetID } from '@/components/SearchFacet/types';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { FacetStoreProvider } from '@/components/SearchFacet/store/FacetStore';
import { expect, test } from 'vitest';
import { SelectedList } from '@/components/SearchFacet/SearchFacetModal/SelectedList';

const setup = (id?: SearchFacetID) => {
  const user = userEvent.setup();
  const result = render(<SelectedList />, {
    wrapper: ({ children }) => <FacetStoreProvider facetId={id ?? 'author'}>{children}</FacetStoreProvider>,
  });
  return { ...result, user };
};

test('renders nothing when selected list is empty', () => {
  const { queryByRole } = setup();
  expect(queryByRole('list')).not.toBeInTheDocument();
});
