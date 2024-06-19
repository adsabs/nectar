import { Meta, StoryObj } from '@storybook/react';
import { AuthorAffiliations } from '../AuthorAffiliations';

const meta: Meta = {
  title: 'AuthorAffiliations',
  component: AuthorAffiliations,
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
};

type Story = StoryObj<typeof AuthorAffiliations>;

export default meta;

export const WithInitialQuery: Story = {
  args: {
    query: { q: 'star', rows: 10 },
  },
};

export const WithIntitialParams: Story = {
  args: {
    params: {
      bibcode: ['foo', 'bar', 'baz', 'bim', 'boo', 'bip', 'bop', 'bee', 'biz', 'bot'],
    },
  },
};

export const WithNoIntitialArgs: Story = {
  args: {},
};
