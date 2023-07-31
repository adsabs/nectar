import { render } from '@test-utils';
import * as stories from '../__stories__/LandingTabs.stories';
import { composeStories } from '@storybook/testing-react';

const { Default: LandingTabs } = composeStories(stories);

test.skip('renders without crashing', () => {
  render(<LandingTabs />);
});
