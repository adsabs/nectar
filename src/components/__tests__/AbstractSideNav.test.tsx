import { render } from '@/test-utils';
import Meta, { Default } from '@/components/__stories__/AbstractSideNav.stories';
import { composeStory } from '@storybook/react';
import { test } from 'vitest';

const AbstractSideNav = composeStory(Default, Meta);

test.skip('renders without crashing', () => {
  render(<AbstractSideNav />);
});
