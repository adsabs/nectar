import { render } from '@test-utils';
import { test } from 'vitest';
import { composeStories } from '@storybook/testing-react';
import * as stories from '../__stories__/LibraryListTable.stories';
import { ChakraProvider } from '@chakra-ui/react';

const { Default: LibraryListTable } = composeStories(stories);

test('renders without crashing', () => {
  render(
    <ChakraProvider>
      <LibraryListTable />
    </ChakraProvider>,
  );
});
