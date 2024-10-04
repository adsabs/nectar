import { doc } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { AbstractSources } from '@/components/AbstractSources';

const meta: Meta = {
  title: 'AbstractSources',
  component: AbstractSources,
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

type Story = StoryObj<typeof AbstractSources>;

export default meta;

export const Default: Story = {
  args: { doc },
};
