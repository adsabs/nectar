import { Meta, StoryObj } from '@storybook/react';
import { Footer } from '@/components/Footer';

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
