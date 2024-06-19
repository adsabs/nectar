import { SimpleResultList } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/SimpleResultList',
  component: SimpleResultList,
};

type Story = StoryObj<typeof SimpleResultList>;

export default meta;

export const Default: Story = {
  args: { indexStart: 0, hideCheckboxes: false },
};
