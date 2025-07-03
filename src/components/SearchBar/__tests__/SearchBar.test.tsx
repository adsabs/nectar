import { render } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { SearchBar } from '../index';
import { within } from '@testing-library/dom';

const setup = () => {
  const utils = render(<SearchBar />);
  return {
    user: userEvent.setup(),
    ...utils,
  };
};

test('SearchBar renders without crashing', () => render(<SearchBar />));

test('Quick field appends to input', async () => {
  const { user, getByTestId, getAllByTestId } = setup();
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.click(getAllByTestId('quickfield')[0]);
  await user.click(getAllByTestId('quickfield')[1]);
  expect(input.value).toBe('author:"" first_author:""');
});

test('Quick fields non-menu buttons work to wrap selection', async () => {
  const { user, getByTestId, getAllByTestId } = setup();
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.type(input, 'test selection');
  input.setSelectionRange(5, 15); // Select "selection"
  await user.click(getAllByTestId('quickfield')[0]);
  expect(input.value).toBe('test author:"selection"');
});

test('Quick field menu works to wrap selection', async () => {
  const { user, getByTestId, getAllByTestId, findByRole } = setup();
  const input = getByTestId('search-input') as HTMLInputElement;

  // Type text and select the "selection" part
  await user.type(input, 'test selection');
  input.setSelectionRange(5, 15); // Select "selection"

  // Open dropdown menu
  const toggle = getByTestId('allSearchTermsMenuToggle');
  await user.click(toggle);

  // Wait for the menu options to render
  const listbox = await findByRole('listbox');
  const options = within(listbox).getAllByRole('option');

  // Select the first option (e.g., author:"")
  await user.click(options[0]);

  // Expect: dispatch was called with selectedRange: [5, 15], and appropriate query addition
});

test('Cursor moves inside appended field', async () => {
  const { user, getByTestId, getAllByTestId } = setup();
  const input = getByTestId('search-input') as HTMLInputElement;
  await user.click(getAllByTestId('quickfield')[0]);
  expect(input.value).toBe('author:""');
  expect(input.selectionStart).toBe(8); // After 'author:"'
  await user.click(getAllByTestId('quickfield')[1]);
  expect(input.value).toBe('author:"" first_author:""');
  expect(input.selectionStart).toBe(24); // After 'first_author:"'
});

test('On mount the input gets focus', async () => {
  const { getByTestId } = setup();
  const input = getByTestId('search-input') as HTMLInputElement;
  expect(document.activeElement).toBe(input);
});
