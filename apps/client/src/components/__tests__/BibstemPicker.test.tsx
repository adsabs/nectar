import * as stories from '@/components/__stories__/BibstemPicker.stories';
import { composeStories } from '@storybook/react';
import { render } from '@/test-utils';
import { expect, test } from 'vitest';

const { Default: BibstemPickerSingle, Multi: BibstemPickerMultiple } = composeStories(stories);

test('Renders Single-version without error', () => {
  expect(() => render(<BibstemPickerSingle />)).not.toThrow();
});

test('Renders Multi-version without error', () => {
  expect(() => render(<BibstemPickerMultiple />)).to.not.throw();
});
