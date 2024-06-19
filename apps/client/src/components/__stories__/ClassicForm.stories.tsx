import { Meta, StoryObj } from '@storybook/react';
import { ClassicForm } from '../ClassicForm';

const meta: Meta = {
  title: 'ClassicForm',
  component: ClassicForm,
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

type Story = StoryObj<typeof ClassicForm>;

export default meta;

export const Default: Story = {
  args: {},
};
