import * as stories from '@components/__stories__/Pagination.stories';
import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';

const { Default: Pagination } = composeStories(stories);

test.skip('renders without crashing', () => {
  render(<Pagination />);
});
