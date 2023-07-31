import { render } from '@test-utils';
import { expect, test } from 'vitest';
import { composeStories } from '@storybook/testing-react';
import * as stories from '../__stories__/SearchInput.stories';

const { Default: SearchInput, Loading: LoadingSearchInput } = composeStories(stories);

test('renders without crashing', () => {
  render(<SearchInput />);
});

test('input is updated when text is typed', async () => {
  const { getByRole, user } = render(<SearchInput />);

  const input = getByRole('textbox');
  await user.type(input, 'test');
  expect(input).toHaveValue('test');
});

test('input is cleared when clear button is clicked', async () => {
  const { getByRole, findByLabelText, user } = render(<SearchInput />);

  const input = getByRole('textbox');
  await user.type(input, 'test');
  expect(input).toHaveValue('test');
  const clearButton = await findByLabelText('Clear search', { selector: 'button' });
  await user.click(clearButton);
  expect(input).toHaveValue('');
});

test('input is focused on mount', async () => {
  const { getByRole } = render(<SearchInput />);

  const input = getByRole('textbox');
  expect(input).toHaveFocus();
});

test('input is disabled when in loading state', () => {
  const { getByRole, getAllByRole } = render(<LoadingSearchInput />);

  const input = getByRole('textbox');
  expect(input).toBeDisabled();

  const buttons = getAllByRole('button');
  buttons.forEach((button) => expect(button).toBeDisabled());
});

test.todo('menu is opened when match is typed in');
test.todo('selecting an option appends to the input');
test.todo('selecting an option closes the menu');
test.todo('menu only opens when cursor is at the end of the input');
