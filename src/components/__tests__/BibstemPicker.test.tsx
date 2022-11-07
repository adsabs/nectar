import * as stories from '@components/__stories__/BibstemPicker.stories';
import { composeStories } from '@storybook/testing-react';
import { render } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

const { Default: BibstemPickerSingle, Multi: BibstemPickerMultiple } = composeStories(stories);

const setup = (which: 'single' | 'multiple') => {
  const utils = render(which === 'single' ? <BibstemPickerSingle /> : <BibstemPickerMultiple />);
  return {
    user: userEvent.setup(),
    ...utils,
  };
};

test('Renders Single-version without error', () => {
  expect(() => render(<BibstemPickerSingle />)).not.toThrow();
});

test('Renders Multi-version without error', () => {
  expect(() => render(<BibstemPickerMultiple />)).to.not.throw();
});

