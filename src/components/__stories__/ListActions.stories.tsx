import { Meta, StoryObj } from '@storybook/react';
import { ListActions } from '@/components/ResultList';
import { noop } from '@/utils/common/noop';

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
