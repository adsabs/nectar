import { Footer } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Footer',
  component: Footer,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

type Story = StoryObj<typeof Footer>;

export default meta;

export const Default: Story = {
  args: {},
};
