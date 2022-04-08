import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wait } from '@testing-library/user-event/dist/utils';
import * as stories from '../__stories__/SearchBar.stories';

const { Primary: SearchBar } = composeStories(stories);

const setup = () => {
  const utils = render(<SearchBar />);
  return {
    input: utils.getByTestId('searchbar-input'),
    ...utils,
  };
};

test('SearchBar renders without crashing', () => {
  render(<SearchBar />);
});

test('SearchBar clear button works', async () => {
  const { input, getByTestId } = setup();

  // we should not find the clear button, until there is text
  expect(() => getByTestId('searchbar-clear')).toThrowError();

  userEvent.type(input, 'star');

  const clearBtn = getByTestId('searchbar-clear');
  expect(clearBtn).toBeVisible();

  userEvent.click(clearBtn);
  await wait(1);
  expect(input.getAttribute('value')).toEqual('');
});

test('SearchBar should not suggest while cursor is inside field', async () => {
  const { input, getByTestId } = setup();
  const menu = getByTestId('searchbar-menu');

  userEvent.type(input, 'trend{arrowdown}{enter}');
  await wait(1);
  userEvent.type(input, 'a bib');
  expect(menu).toBeEmptyDOMElement();
});

test('Searchbar suggests properly', () => {
  const { input, getAllByRole } = setup();

  userEvent.type(input, 'trend');
  const options = getAllByRole('option');
  expect(options[0].textContent).toContain('Trending');
});

test('SearchBar autosuggest replaces text and moves cursor properly', async () => {
  const { input } = setup();

  // type a letter, pick first suggestion, check that cursor moved inside quotes
  userEvent.type(input, 'a{arrowdown}{enter}');
  await wait(1);
  expect(input.getAttribute('value')).toEqual('abs:""');
  userEvent.type(input, 'test');
  expect(input.getAttribute('value')).toEqual('abs:"test"');

  // test the same for parenthesis
  userEvent.type(input, '{arrowright} citat{arrowdown}{enter}');
  await wait(1);
  expect(input.getAttribute('value')).toEqual('abs:"test" citations()');
  userEvent.type(input, 'inside');
  expect(input.getAttribute('value')).toEqual('abs:"test" citations(inside)');
});

test('Searchbar tabbing works', () => {
  const { input, getByTestId } = setup();
  const submitBtn = getByTestId('searchbar-submit');

  input.focus();
  userEvent.tab();
  expect(submitBtn).toHaveFocus();

  input.focus();
  userEvent.type(input, 'test');
  const clearBtn = getByTestId('searchbar-clear');

  userEvent.tab();
  expect(clearBtn).toHaveFocus();
  userEvent.tab();
  expect(submitBtn).toHaveFocus();
});
