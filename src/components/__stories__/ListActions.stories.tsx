import { Meta, StoryObj } from '@storybook/react';
import { noop } from '@/utils';
import { ListActions } from '@/components/ResultList';

const meta: Meta = {
  title: 'ResultList/ListActions',
  component: ListActions,
};

type Story = StoryObj<typeof ListActions>;
export default meta;

export const Default: Story = {
  args: {
    onSortChange: noop,
  },
};
