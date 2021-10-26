import { fireEvent, render } from '@testing-library/react';
import { Default as SearchBar } from '../__stories__/SearchBar.stories';

test('SearchBar renders without crashing', () => {
  render(<SearchBar />);
});

test('SearchBar suggestions are correct', async () => {
  const EXPECTED_ITEMS = ['Author(author:"")', 'First Author(author:"^")'];

  const { findByTestId, findAllByTestId } = render(<SearchBar />);
  const inputEl = await findByTestId('searchbar-input');

  fireEvent.change(inputEl, { target: { value: 'auth' } });
  const items = (await findAllByTestId('searchbar-suggestion-item')).map((el) => el.textContent);
  expect(EXPECTED_ITEMS).toEqual(items);
});

test('SearchBar suggestion selection with quotes moves cursor inside', async () => {
  const expectedValueAfterSelection = 'author:""';
  const expectedCursorPosition = 8;

  const { findByTestId, findAllByTestId } = render(<SearchBar />);
  const inputEl = (await findByTestId('searchbar-input')) as HTMLInputElement;

  fireEvent.change(inputEl, { target: { value: 'author' } });
  const [firstItem] = await findAllByTestId('searchbar-suggestion-item');
  fireEvent.click(firstItem);

  expect(expectedValueAfterSelection).toEqual(inputEl.value);
  expect(expectedCursorPosition).toEqual(inputEl.selectionStart);
});

test('SearchBar suggestion selection with parenthesis moves cursor inside', async () => {
  const expectedValueAfterSelection = 'similar()';
  const expectedCursorPosition = 8;

  const { findByTestId, findAllByTestId } = render(<SearchBar />);
  const inputEl = (await findByTestId('searchbar-input')) as HTMLInputElement;

  fireEvent.change(inputEl, { target: { value: 'similar' } });
  const [firstItem] = await findAllByTestId('searchbar-suggestion-item');
  fireEvent.click(firstItem);

  expect(expectedValueAfterSelection).toEqual(inputEl.value);
  expect(expectedCursorPosition).toEqual(inputEl.selectionStart);
});

test('SearchBar menu should stay closed until proper input', async () => {
  const { findByTestId } = render(<SearchBar />);
  const inputEl = (await findByTestId('searchbar-input')) as HTMLInputElement;
  const menuEl = (await findByTestId('searchbar-suggestion-menu')) as HTMLUListElement;

  const confirmMenuClosed = () => {
    expect(menuEl.childNodes.length).toEqual(0);
  };

  confirmMenuClosed();

  const stringsToTest = [
    'author:""a',
    'author:"" ',
    'author:"a"a',
    'author:"a" ',
    'similar()a',
    'similar() ',
    'similar(a)a',
    'similar(a) ',
  ];

  stringsToTest.forEach((value) => {
    fireEvent.change(inputEl, { target: { value } });
    confirmMenuClosed();
  });

  // should show menu this time, with valid input
  fireEvent.change(inputEl, { target: { value: 'author:"" bib' } });
  expect(menuEl.childNodes.length).toEqual(1);
});
