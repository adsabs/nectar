import { render } from '@/test-utils';
import { test, vi } from 'vitest';
import { composeStories } from '@storybook/react';
import * as stories from '../__stories__/LibraryListTable.stories';
import { theme, ThemeProvider } from '@chakra-ui/react';

const { Default: LibraryListTable } = composeStories(stories);

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: () => Promise.resolve(true),
  }),
}));

test('renders without crashing', () => {
  render(
    <ThemeProvider theme={theme}>
      <LibraryListTable />
    </ThemeProvider>,
  );
});
