import { render } from '@/test-utils';
import { test } from 'vitest';
import * as stories from '../__stories__/TextInput.stories';
import { composeStories } from '@storybook/react';

const { Default: TextInput } = composeStories(stories);

test('renders without crashing', () => {
  render(<TextInput />);
});
