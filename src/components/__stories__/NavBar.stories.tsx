import { NavBar } from '@components';
import { Meta, Story } from '@storybook/react';

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

export default meta;

const Template: Story = (args) => <NavBar {...args} />;

export const Default = Template.bind({}) as Story;

Default.args = {};
