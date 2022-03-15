import { Meta, Story } from '@storybook/react';
import { LandingTabs } from '@components';

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

export default meta;

const Template: Story = (args) => <LandingTabs {...args} />;

export const Default = Template.bind({}) ;

Default.args = {};
