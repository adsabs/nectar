import { Meta, StoryObj } from '@storybook/react';
import { ItemsSkeleton } from '@/components';

const meta: Meta = {
  title: 'ResultList/ItemsSkeleton',
  component: ItemsSkeleton,
};

type Story = StoryObj<typeof ItemsSkeleton>;

export default meta;

export const Default: Story = {
  args: {
    count: 5,
  },
};
