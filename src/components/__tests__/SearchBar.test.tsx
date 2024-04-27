import { composeStories } from '@storybook/react';
import { render } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import * as stories from '../__stories__/SearchBar.stories';

const { Basic: SearchBar } = composeStories(stories);

const setup = () => {
  const utils = render(<SearchBar />);
  return {
    user: userEvent.setup(),
    ...utils,
  };
};

const wait = (delay: number) => new Promise((res) => setTimeout(res, delay));

test('SearchBar renders without crashing', () => {
  render(<SearchBar />);
});

test.skip('SearchBar clear button works', async () => {
  const { getByTestId, user } = setup();

  const input = getByTestId('searchbar-input');

  // we should not find the clear button, until there is text
  expect(() => getByTestId('searchbar-clear')).toThrowError();

  await user.type(input, 'star');

  const clearBtn = getByTestId('searchbar-clear');
  expect(clearBtn).toBeVisible();

  await user.click(clearBtn);
  await wait(1);
  expect(input.getAttribute('value')).toEqual('');
});

test.skip('SearchBar should not suggest while cursor is inside field', async () => {
  const { getByTestId, user } = setup();
  const input = getByTestId('searchbar-input');

  const menu = getByTestId('searchbar-menu');

  await user.type(input, 'trend{arrowdown}{enter}');
  await wait(1);
  await user.type(input, 'a bib');
  expect(menu).toBeEmptyDOMElement();
});

test.skip('Searchbar suggests properly', async () => {
  const { getByTestId, getAllByRole, user } = setup();
  const input = getByTestId('searchbar-input');

  await user.type(input, 'trend');
  const options = getAllByRole('option');
  expect(options[0].textContent).toContain('Trending');
});

test.skip('SearchBar autosuggest replaces text and moves cursor properly', async () => {
  const { getByTestId, user } = setup();
  const input = getByTestId('searchbar-input');

  // type a letter, pick first suggestion, check that cursor moved inside quotes
  await user.type(input, 'a{arrowdown}{enter}');
  await wait(1);
  expect(input.getAttribute('value')).toEqual('abs:""');
  await user.type(input, 'test');
  expect(input.getAttribute('value')).toEqual('abs:"test"');

  // test the same for parenthesis
  await user.type(input, '{arrowright} citat{arrowdown}{enter}');
  await wait(1);
  expect(input.getAttribute('value')).toEqual('abs:"test" citations()');
  await user.type(input, 'inside');
  expect(input.getAttribute('value')).toEqual('abs:"test" citations(inside)');
});

test.skip('Searchbar tabbing works', async () => {
  const { getByTestId, user } = setup();
  const input = getByTestId('searchbar-input');

  const submitBtn = getByTestId('searchbar-submit');

  input.focus();
  await user.tab();
  expect(submitBtn).toHaveFocus();

  input.focus();
  await user.type(input, 'test');
  const clearBtn = getByTestId('searchbar-clear');

  await user.tab();
  expect(clearBtn).toHaveFocus();
  await user.tab();
  expect(submitBtn).toHaveFocus();
});
