import { Meta, StoryObj } from '@storybook/react';
import { Sort } from '@/components/Sort';

const meta: Meta = {
  title: 'Sort',
  component: Sort,
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

type Story = StoryObj<typeof Sort>;
export default meta;

export const Default: Story = {
  args: {},
};
