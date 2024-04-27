import { Meta, StoryObj } from '@storybook/react';
import { SimpleCopyButton } from '@/components';

const meta: Meta = {
  title: 'SimpleCopyButton',
  component: SimpleCopyButton,
};

type Story = StoryObj<typeof SimpleCopyButton>;

export default meta;

export const Default: Story = {
  args: {
    text: 'copy text',
  },
};
