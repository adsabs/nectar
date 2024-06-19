import { NumFound } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'NumFound',
  component: NumFound,
  argTypes: {
    count: {
      name: 'count',
      defaultValue: 0,
      description: 'The count of results found',
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

type Story = StoryObj<typeof NumFound>;

export default meta;

export const Default: Story = {
  args: {},
};

export const WithResults: Story = {
  args: {
    count: 500,
  },
};

export const TotalCitations: Story = {
  args: {
    ...WithResults.args,
  },
};

export const TotalNormalizedCitations: Story = {
  args: {
    ...WithResults.args,
  },
};
