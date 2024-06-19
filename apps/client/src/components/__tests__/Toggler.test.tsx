import { render } from '@testing-library/react';
import { test } from 'vitest';
import { composeStories } from '@storybook/react';
import * as stories from '../__stories__/Toggler.stories';

const { Default: Toggler } = composeStories(stories);

test('renders without crashing', () => {
  render(<Toggler />);
});
