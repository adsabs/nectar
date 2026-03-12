import { render } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SearchBar } from '../index';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: { q: '' },
    events: { on: vi.fn(), off: vi.fn() },
    back: vi.fn(),
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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

const createUser = () =>
  userEvent.setup({
    advanceTimers: vi.advanceTimersByTime.bind(vi),
  });

test('SearchBar renders without crashing', () => render(<SearchBar />));

test('Quick field appends to input', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.click(getAllByTestId('quickfield')[0]);
  await user.click(getAllByTestId('quickfield')[1]);
  expect(input.value).toBe('author:"" first_author:""');
});

test('Cursor moves inside appended field', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
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
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'f');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).toBeVisible();
});

test('Arrow down navigates typeahead options', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
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
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  const items = getAllByTestId('search-autocomplete-item');
  await user.keyboard('{ArrowDown}');
  expect(items[0]).toHaveAttribute('data-focused', 'true');
  await user.keyboard('{Enter}');
  expect(input).toHaveValue('similar()');
});

test('Escape key closes typeahead', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).toBeVisible();
  await user.keyboard('{Escape}');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Clearing input closes typeahead menu', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).toBeVisible();
  await user.click(getByTestId('search-clearbtn'));
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Wraps and restores cursor position', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
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
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'abc def');
  await user.click(getAllByTestId('quickfield')[0]);
  expect(input.value).toBe('abc def author:""');
  expect(input.selectionStart).toBe(16); // After 'author:"'
});

test('Updates via changes to the search URL', async () => {
  const urlRouter = { query: { q: 'URL_QUERY' }, events: { on: vi.fn(), off: vi.fn() }, back: vi.fn() };
  mocks.useRouter.mockImplementationOnce(() => urlRouter).mockImplementationOnce(() => urlRouter);
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

test('Typing a non-matching term does not open typeahead', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'zzzz');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Typing an exact match for a typeahead option closes the menu', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'similar()');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Tab inserts selected suggestion', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{Tab}');
  expect(input).toHaveValue('similar()');
});

test('Clicking a typeahead item inserts it', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  const items = getAllByTestId('search-autocomplete-item');
  await user.click(items[0]);
  expect(input).toHaveValue('similar()');
});

test('Arrow up from first item cycles to input (unfocused)', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await user.keyboard('{ArrowDown}'); // focus item 0
  await user.keyboard('{ArrowUp}'); // back to -1
  const items = getAllByTestId('search-autocomplete-item');
  expect(items[0]).toHaveAttribute('data-focused', 'false');
  expect(input).toHaveValue('sim');
});

test('Arrow up from input wraps to last item', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await user.keyboard('{ArrowUp}');
  const items = getAllByTestId('search-autocomplete-item');
  expect(items[items.length - 1]).toHaveAttribute('data-focused', 'true');
});

test('Arrow down cycles past last item back to input', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  const items = getAllByTestId('search-autocomplete-item');
  // "sim" matches only "similar()" — cycling depends on exactly 1 item
  expect(items).toHaveLength(1);
  await user.keyboard('{ArrowDown}'); // focus item 0
  expect(items[0]).toHaveAttribute('data-focused', 'true');
  await user.keyboard('{ArrowDown}'); // cycle back to -1
  expect(items[0]).toHaveAttribute('data-focused', 'false');
  expect(input).toHaveValue('sim');
});

test('Arrow down does nothing when cursor is not at end of input', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'test query');
  input.setSelectionRange(4, 4);
  await user.keyboard('{ArrowDown}');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
});

test('Modified keys do not trigger typeahead navigation', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await user.keyboard('{Control>}{ArrowDown}{/Control}');
  const items = getAllByTestId('search-autocomplete-item');
  expect(items[0]).toHaveAttribute('data-focused', 'false');
});

test('Escape when menu is already closed is a no-op', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'zzzz');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
  await user.keyboard('{Escape}');
  expect(input).toHaveValue('zzzz');
});

test('Enter with menu open but no focused item closes menu without inserting', async () => {
  const user = createUser();
  const { getByTestId, queryByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).toBeVisible();
  await user.keyboard('{Enter}');
  await vi.advanceTimersByTimeAsync(500);
  expect(queryByTestId('search-autocomplete-menu')).not.toBeVisible();
  expect(input).toHaveValue('sim');
});

test('Typeahead operates on the final term in a multi-word query', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'author:"smith" sim');
  expect(getAllByTestId('search-autocomplete-item').length).toBeGreaterThan(0);
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{Enter}');
  expect(input).toHaveValue('author:"smith" similar()');
});

test('Navigating to an item shows a preview in the input', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'sim');
  // "sim" matches only "similar()" — cycling depends on exactly 1 item
  expect(input).toHaveValue('sim');
  await user.keyboard('{ArrowDown}');
  expect(input).toHaveValue('similar()');
  await user.keyboard('{ArrowDown}');
  expect(input).toHaveValue('sim');
});

test('AllSearchTermsDropdown inserts selected term into search input', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const astInput = getByTestId('allSearchTermsInput');
  const searchInput = getByTestId('search-input');
  await user.click(astInput);
  await user.type(astInput, 'title');
  const menuItems = getAllByTestId('allSearchTermsMenuItem');
  await user.click(menuItems[0]);
  expect(searchInput).toHaveValue('title:""');
});
