import { render } from '@test-utils';
import { test } from 'vitest';
import { composeStories } from '@storybook/testing-react';
import * as stories from '../__stories__/LibraryListTable.stories';

const { Default: LibraryListTable } = composeStories(stories);

test('renders without crashing', () => {
  render(<LibraryListTable />);
});
