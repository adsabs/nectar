import { ISearchInputProps, SearchInput } from '@/components/SearchFacet/SearchFacetModal/SearchInput';
import { render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { FacetStoreProvider } from '@/components/SearchFacet/store/FacetStore';
import { SearchFacetID } from '@/components/SearchFacet/types';
import { noop } from '@/utils/common/noop';

const setup = (id?: SearchFacetID, props?: ISearchInputProps) => {
  const user = userEvent.setup();
  const result = render(<SearchInput search="" onSearchChange={noop} {...props} />, {
    wrapper: ({ children }) => <FacetStoreProvider facetId={id ?? 'author'}>{children}</FacetStoreProvider>,
  });
  return { ...result, user };
};
test('renders the label and input with the correct placeholder', () => {
  const { getByLabelText, getByPlaceholderText } = setup('collections');

  expect(getByLabelText('Search (case-sensitive)')).toBeInTheDocument();
  expect(getByPlaceholderText('Search (case-sensitive)')).toBeInTheDocument();
});

test('calls onSearchChange with the correct value when the input changes', async () => {
  const mockOnChange = vi.fn();
  const { getByPlaceholderText, user } = setup('collections', { search: '', onSearchChange: mockOnChange });
  const input = getByPlaceholderText('Search (case-sensitive)') as HTMLInputElement;
  await user.type(input, 'a');

  expect(mockOnChange).toHaveBeenCalledWith('a');
});

test('does call onSearchChange with empty string when the clear button is clicked', async () => {
  const mockOnChange = vi.fn();
  const { getByLabelText, user } = setup('author', { search: '', onSearchChange: mockOnChange });

  const clearButton = getByLabelText('clear search') as HTMLButtonElement;
  await user.click(clearButton);

  expect(mockOnChange).toHaveBeenCalled();
});

test('disables the input and clear button when isDisabled prop is true', () => {
  const mockOnChange = vi.fn();
  const { getByLabelText, getByPlaceholderText } = setup('collections', {
    search: '',
    onSearchChange: mockOnChange,
    isDisabled: true,
  });

  const input = getByPlaceholderText('Search (case-sensitive)') as HTMLInputElement;
  const clearButton = getByLabelText('clear search') as HTMLButtonElement;

  expect(input).toBeDisabled();
  expect(clearButton).toBeDisabled();
});
