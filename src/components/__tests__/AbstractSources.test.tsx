import { render } from '@test-utils';
import Meta, { Default } from '../__stories__/AbstractSources.stories';
import { composeStory } from '@storybook/react';

const AbstractSources = composeStory(Default, Meta);
test('renders without crashing', () => {
  render(<AbstractSources />);
});
