import { Meta, StoryObj } from '@storybook/react';
import { SimpleResultList } from '@/components/ResultList';

const meta: Meta = {
  title: 'ResultList/SimpleResultList',
  component: SimpleResultList,
};

type Story = StoryObj<typeof SimpleResultList>;

export default meta;

export const Default: Story = {
  args: { indexStart: 0, hideCheckboxes: false },
};
