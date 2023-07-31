import { Meta, StoryObj } from '@storybook/react';
import { Expandable } from '../Expandable';

const meta: Meta = {
  title: 'Expandable',
  component: Expandable,
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

type Story = StoryObj<typeof Expandable>;

export default meta;

export const Default: Story = {
  args: {
    title: 'Click me for description',
    description:
      'Sweet are the uses of adversity which, like the toad, ugly and venomous, wears yet a precious jewel in his head',
  },
};
