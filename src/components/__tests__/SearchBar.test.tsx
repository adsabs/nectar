import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wait } from '@testing-library/user-event/dist/utils';
import * as stories from '../__stories__/SearchBar.stories';

const { Primary: SearchBar } = composeStories(stories);

const setup = () => {
  const utils = render(<SearchBar />);
  return {
    input: utils.getByTestId('primary-search-input'),
    ...utils,
  };
};

test('SearchBar renders without crashing', () => {
  render(<SearchBar />);
});
test('SearchBar clear button works', () => {
  const { input, getByTestId } = setup();

  // we should not find the clear button, until there is text
  expect(() => getByTestId('primary-search-clear')).toThrowError();

  userEvent.type(input, 'star');

  const clearBtn = getByTestId('primary-search-clear');
  expect(clearBtn).toBeVisible();
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
