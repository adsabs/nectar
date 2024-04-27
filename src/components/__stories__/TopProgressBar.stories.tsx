import { TopProgressBar } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'TopProgressBar',
  component: TopProgressBar,
};

type Story = StoryObj<typeof TopProgressBar>;
export default meta;

export const Default: Story = {
  args: {},
};
