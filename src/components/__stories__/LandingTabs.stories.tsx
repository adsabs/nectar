import { Meta, StoryObj } from '@storybook/react';
import { LandingTabs } from '@/components';

const meta: Meta = {
  title: 'LandingTabs',
  component: LandingTabs,
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

type Story = StoryObj<typeof LandingTabs>;

export default meta;

export const Default: Story = {
  args: {},
};
