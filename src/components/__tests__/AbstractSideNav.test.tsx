import { render } from '@test-utils';
import Meta, { Default } from '@components/__stories__/AbstractSideNav.stories';
import { composeStory } from '@storybook/react';

const AbstractSideNav = composeStory(Default, Meta);

test.skip('renders without crashing', () => {
  render(<AbstractSideNav />);
});
