import { Meta, StoryObj } from '@storybook/react';
import { SearchExamples } from '@/components/SearchExamples';

const meta: Meta = {
  title: 'SearchExamples',
  component: SearchExamples,
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

type Story = StoryObj<typeof SearchExamples>;

export default meta;

export const Default: Story = {
  args: {},
};
