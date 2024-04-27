import { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '@/components';

const meta: Meta = {
  title: 'TextInput',
  component: TextInput,
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

type Story = StoryObj<typeof meta.component>;

export default meta;

export const Default: Story = {
  args: {},
};
