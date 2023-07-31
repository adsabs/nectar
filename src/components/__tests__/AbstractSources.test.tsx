import { render } from '@test-utils';
import Meta, { Default } from '../__stories__/AbstractSources.stories';
import { composeStory } from '@storybook/react';
import { test } from 'vitest';

const AbstractSources = composeStory(Default, Meta);
test('renders without crashing', () => {
  render(<AbstractSources />);
});
