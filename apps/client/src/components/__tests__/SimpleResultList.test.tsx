import { composeStories } from '@storybook/react';
import { render } from '@/test-utils';
import { test } from 'vitest';
import * as stories from '../__stories__/SimpleResultList.stories';

const { Default: ResultList } = composeStories(stories);

test('renders without crashing', () => {
  render(<ResultList />);
});

test.todo('synchronizes correctly with URL');
