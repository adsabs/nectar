import { NavBar } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'NavBar',
  component: NavBar,
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

type Story = StoryObj<typeof NavBar>;

export default meta;

export const Default: Story = {
  args: {},
};
