import { render } from '@/test-utils';
import Meta, { Default } from '../__stories__/AbstractSources.stories';
import { composeStory } from '@storybook/react';
import { test, vi } from 'vitest';

const AbstractSources = composeStory(Default, Meta);

vi.mock('next/router', () => ({
  useRouter: () => ({
    reload: vi.fn(),
  }),
}));

test('renders without crashing', () => {
  render(<AbstractSources />);
});
