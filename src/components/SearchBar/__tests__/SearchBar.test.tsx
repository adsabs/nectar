import { render } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { FormEvent } from 'react';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
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

const GlobalQueryProbe = () => {
  const { query } = useIntermediateQuery();
  return <span data-testid="global-query">{query}</span>;
};

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

// Types the longest query in this file one keystroke at a time; uses ~4.8s of
// the default 5s budget on an idle machine, so it fails under full-suite load.
test('Typeahead operates on the final term in a multi-word query', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input');
  await user.type(input, 'author:"smith" sim');
  expect(getAllByTestId('search-autocomplete-item').length).toBeGreaterThan(0);
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{Enter}');
  expect(input).toHaveValue('author:"smith" similar()');
}, 15000);

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

test('Highlighting a suggestion places the caret inside the quotes', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('author:""');
  expect(input.selectionStart).toBe(8);
});

test('Arrow down still cycles suggestions with the caret inside the quotes', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'auth');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('author:""');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('first_author:""');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('auth');
});

test('A mid-query caret cannot open the typeahead menu', async () => {
  const user = createUser();
  const { getByTestId, queryAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'year:2020');
  input.setSelectionRange(0, 0);
  await user.keyboard('sim');
  expect(queryAllByTestId('search-autocomplete-item')).toHaveLength(0);
  await user.keyboard('{ArrowDown}');
  expect(queryAllByTestId('search-autocomplete-item')).toHaveLength(0);
});

test('Cycling with a mid-query caret does not destroy an earlier token', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'year:2020 sim');
  input.setSelectionRange(3, 3);
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('year:2020 similar()');
  await user.keyboard('{Enter}');
  expect(input.value).toBe('year:2020 similar()');
});

test('Typing while a suggestion is highlighted inserts inside the quotes', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('smith');
  expect(input.value).toBe('author:"smith"');
});

test('Typing while a paren-shaped suggestion is highlighted inserts inside the parens', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'sim');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('similar()');
  await user.keyboard('x');
  expect(input.value).toBe('similar(x)');
});

test('Clicking a quickfield while a preview shows appends to the committed value', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('author:""');
  await user.click(getAllByTestId('quickfield')[1]);
  expect(input.value).toBe('author:"" first_author:""');
});

test('Submitting while a preview shows searches the text the user sees', async () => {
  const user = createUser();
  const submitted: string[] = [];
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitted.push(new FormData(e.currentTarget).get('q') as string);
  };
  const { getByTestId } = render(
    <form onSubmit={handleSubmit}>
      <SearchBar />
      <GlobalQueryProbe />
    </form>,
  );
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('author:""');
  await user.click(getByTestId('search-submit'));
  expect(submitted).toEqual(['author:""']);
  await vi.advanceTimersByTimeAsync(1000);
  expect(getByTestId('global-query').textContent).toBe('author:""');
});

test('Clicking away while a preview shows keeps the text the user sees', async () => {
  const user = createUser();
  const { getByTestId } = render(
    <>
      <SearchBar />
      <GlobalQueryProbe />
      <button data-testid="outside">outside</button>
    </>,
  );
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  expect(input.value).toBe('author:""');
  await user.click(getByTestId('outside'));
  expect(input.value).toBe('author:""');
  expect(document.activeElement).toBe(getByTestId('outside'));
  await vi.advanceTimersByTimeAsync(1000);
  expect(getByTestId('global-query').textContent).toBe('author:""');
  expect(document.activeElement).toBe(getByTestId('outside'));
});

test('Clicking away with no preview showing moves focus away', async () => {
  const user = createUser();
  const { getByTestId } = render(
    <>
      <SearchBar />
      <button data-testid="outside">outside</button>
    </>,
  );
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'zzzz');
  await user.click(getByTestId('outside'));
  expect(document.activeElement).toBe(getByTestId('outside'));
});

test('Backspace on a preview deletes inside the quotes', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  expect(input.selectionStart).toBe(8);
  await user.keyboard('{Backspace}');
  expect(input.value).toBe('author:"');
  expect(input.selectionStart).toBe(7);
});

test('ArrowLeft on a preview then typing inserts at the visible caret', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'author:"');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{ArrowLeft}');
  expect(input.selectionStart).toBe(7);
  await user.keyboard('s');
  expect(input.value).toBe('author:s""');
  expect(input.selectionStart).toBe(8);
});

test('title quickfield renders and appends to input', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const input = getByTestId('search-input') as HTMLInputElement;
  const quickfields = getAllByTestId('quickfield');
  // default mode order: author, first-author, abstract, year, fulltext, title
  const title = quickfields.find((el) => el.textContent === 'title');
  expect(title).toBeDefined();
  await user.click(title as HTMLElement);
  expect(input.value).toBe('title:""');
  expect(input.selectionStart).toBe(7); // caret inside the quotes
});

test('AllSearchTermsModal opens from trigger and filters, selects, inserts', async () => {
  const user = createUser();
  const { getByTestId, getAllByTestId } = render(<SearchBar />);
  const searchInput = getByTestId('search-input');
  await user.click(getByTestId('allSearchTermsTrigger'));
  const filter = getByTestId('allSearchTermsInput');
  await user.type(filter, 'title');
  const menuItems = getAllByTestId('allSearchTermsMenuItem');
  await user.click(menuItems[0]);
  expect(searchInput).toHaveValue('title:""');
});

test('AllSearchTermsModal detail pane shows full syntax and examples', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  await user.click(getByTestId('allSearchTermsTrigger'));
  await user.type(getByTestId('allSearchTermsInput'), 'year');
  // "year" has two syntax entries and two examples — both must render.
  const syntax = getByTestId('allSearchTermsDetailSyntax');
  expect(syntax).toHaveTextContent('year:YYYY');
  expect(syntax).toHaveTextContent('year:YYYY-YYYY');
  const example = getByTestId('allSearchTermsDetailExample');
  expect(example).toHaveTextContent('year:2000');
  expect(example).toHaveTextContent('year:2000-2005');
});

test('AllSearchTermsModal supports arrow + Enter keyboard selection', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  const searchInput = getByTestId('search-input');
  await user.click(getByTestId('allSearchTermsTrigger'));
  const filter = getByTestId('allSearchTermsInput');
  await user.type(filter, 'last');
  // "last" matches "last author" (pos(author:"", -1), cursorPos -6)
  await user.keyboard('{Enter}');
  expect(searchInput).toHaveValue('pos(author:"", -1)');
  expect((searchInput as HTMLInputElement).selectionStart).toBe(12); // inside author quotes
});

test('AllSearchTermsModal exposes listbox/option semantics and active-descendant', async () => {
  const user = createUser();
  const { getByTestId, getByRole, getAllByRole } = render(<SearchBar />);
  await user.click(getByTestId('allSearchTermsTrigger'));
  const filter = getByTestId('allSearchTermsInput');
  await user.type(filter, 'title');
  const listbox = getByRole('listbox');
  expect(filter).toHaveAttribute('aria-controls', listbox.id);
  const options = getAllByRole('option');
  // first filtered row is active and the input's active-descendant points at it
  expect(options[0]).toHaveAttribute('aria-selected', 'true');
  expect(filter).toHaveAttribute('aria-activedescendant', options[0].id);
});

test('AllSearchTermsModal renders description links as safe new-tab anchors', async () => {
  const user = createUser();
  const { getByTestId } = render(<SearchBar />);
  await user.click(getByTestId('allSearchTermsTrigger'));
  // "bib abbrev" (bibstem) description contains a journalsdb link
  await user.type(getByTestId('allSearchTermsInput'), 'bib abbrev');
  const link = getByTestId('allSearchTermsDetail').querySelector('a');
  expect(link).not.toBeNull();
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});
