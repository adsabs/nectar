import { Pagination } from '@/components/ResultList/Pagination';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Pagination',
  component: Pagination,
  parameters: {
    controls: { expanded: true },
  },
};

type Story = StoryObj<typeof Pagination>;
export default meta;

export const Default: Story = {
  args: {},
};
