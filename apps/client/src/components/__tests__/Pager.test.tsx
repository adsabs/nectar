import { render } from '@/test-utils';
import { test } from 'vitest';
import { composeStories } from '@storybook/react';
import * as stories from '../__stories__/Pager.stories';

const { Default: Pager } = composeStories(stories);

test('renders without crashing', () => {
  render(<Pager />);
});
