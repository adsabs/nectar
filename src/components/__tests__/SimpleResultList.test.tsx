import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import * as stories from '../__stories__/SimpleResultList.stories';

const { Default: ResultList } = composeStories(stories);

describe('ResultList Component', () => {
  test('renders without crashing', () => {
    render(<ResultList docs={[]} />);
  });

  test.todo('synchronizes correctly with URL');
});
