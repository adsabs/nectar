import { render } from '@/test-utils';
import { expect, test, vi } from 'vitest';
import { SearchBar } from '../index';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: { q: '' },
    events: { on: vi.fn(), off: vi.fn() },
  })),
  useLandingFormPreference: vi.fn(() => ({
    landingFormUrl: '/',
    persistCurrentForm: vi.fn(),
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useLandingFormPreference', () => ({
  useLandingFormPreference: mocks.useLandingFormPreference,
}));

test('SearchBar renders without crashing', () => render(<SearchBar />));

test('Quick field appends to input', async () => {
  const { user, getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.click(getAllByTestId('quickfield')[0]);
  await user.click(getAllByTestId('quickfield')[1]);
  expect(input.value).toBe('author:"" first_author:""');
});

test('Cursor moves inside appended field', async () => {
  const { user, getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.click(getAllByTestId('quickfield')[0]);
  expect(input.value).toBe('author:""');
  expect(input.selectionStart).toBe(8); // After 'author:"'
  await user.click(getAllByTestId('quickfield')[1]);
  expect(input.value).toBe('author:"" first_author:""');
  expect(input.selectionStart).toBe(24); // After 'first_author:"'
});

test('On mount the input gets focus', async () => {
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  expect(document.activeElement).toBe(input);
});

test('Typing opens typeahead menu', async () => {
  const { user, getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  expect(queryByTestId('search-autocomplete-menu')).toBeInTheDocument();
});

test('Arrow down navigates typeahead options', async () => {
  const { user, getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'f');
  await user.keyboard('{ArrowDown}');
  const items = getAllByTestId('search-autocomplete-item');
  expect(items[0]).toHaveAttribute('data-focused', 'true');
  await user.keyboard('{ArrowDown}');
  expect(items[0]).toHaveAttribute('data-focused', 'false');
  expect(items[1]).toHaveAttribute('data-focused', 'true');
});

test('Enter inserts selected suggestion', async () => {
  const { user, getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  const items = getAllByTestId('search-autocomplete-item');
  await user.keyboard('{ArrowDown}');
  expect(items[0]).toHaveAttribute('data-focused', 'true');
  await user.keyboard('{Enter}');
  expect(input).toHaveValue('similar()');
});

test('Escape key closes typeahead', async () => {
  const { user, getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  expect(queryByTestId('search-autocomplete-menu')).toBeVisible();
  await user.keyboard('{Escape}');
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Clearing input closes typeahead menu', async () => {
  const { user, getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  expect(queryByTestId('search-autocomplete-menu')).toBeVisible();
  await user.click(getByTestId('search-clearbtn'));
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Wraps and restores cursor position', async () => {
  const { user, getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'abc def');
  await user.pointer([
    { target: input, offset: 0, keys: '[MouseLeft>]' }, // Click and hold at the beginning
    { offset: 3 }, // Drag the mouse 3 characters to the right
    { keys: '[/MouseLeft]' }, // Release the mouse button
  ]);
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(3);
  await user.click(getAllByTestId('quickfield')[0]);
  expect(input.value).toBe('author:"abc" def');
  expect(input.selectionStart).toBe(16);
});

test('selecting quickfield appends to existing query', async () => {
  const { user, getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'abc def');
  await user.click(getAllByTestId('quickfield')[0]);
  expect(input.value).toBe('abc def author:""');
  expect(input.selectionStart).toBe(16); // After 'author:"'
});

test('Updates via changes to the search URL', async () => {
  mocks.useRouter.mockImplementationOnce(() => ({ query: { q: 'URL_QUERY' }, events: { on: vi.fn(), off: vi.fn() } }));
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  expect(input.value).toBe('URL_QUERY');
});

test('Search term gets update via props', async () => {
  const { getByTestId, rerender } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  expect(input.value).toBe('');
  rerender(<SearchBar query="test" />);
  expect(input.value).toBe('test');
});

test('Query additions are added via props', async () => {
  const { getByTestId, rerender } = render(<SearchBar query="a b c" />);
  const input = getByTestId('search-input') as HTMLInputElement;
  expect(input.value).toBe('a b c');
  rerender(<SearchBar query="a b c" queryAddition={`test:""`} />);
  expect(input.value).toBe('a b c test:""');
  // Check cursor position after addition, should be inside the quotes
  expect(input.selectionStart).toBe(12);
});
