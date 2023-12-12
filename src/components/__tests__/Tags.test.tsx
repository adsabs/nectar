import { render } from '@testing-library/react';
import * as stories from '../__stories__/Tags.stories';
import { composeStories } from '@storybook/react';
import { test } from 'vitest';

const { Default: Tags } = composeStories(stories);

test('renders without crashing', () => {
  render(<Tags />);
});
