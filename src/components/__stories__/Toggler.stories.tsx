import { Meta, StoryObj } from '@storybook/react';
import { Toggler } from '../Toggler';

const meta: Meta = {
  title: 'Toggler',
  component: Toggler,
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

type Story = StoryObj<typeof Toggler>;
export default meta;

export const Default: Story = {
  args: {},
};
