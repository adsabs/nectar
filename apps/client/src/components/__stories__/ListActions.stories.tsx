import { ListActions } from '@/components';
import { Meta, StoryObj } from '@storybook/react';
import { noop } from '@/utils';

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
