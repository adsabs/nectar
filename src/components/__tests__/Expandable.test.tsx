import { render } from '@/test-utils';
import * as stories from '../__stories__/Expandable.stories';
import { composeStories } from '@storybook/react';
import { test } from 'vitest';

const { Default: Expandable } = composeStories(stories);

test('renders without crashing', () => {
  render(<Expandable title="Test" description="Test" />);
});
