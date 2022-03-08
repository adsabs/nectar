import { Footer } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Footer',
  component: Footer,
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

const Template: Story = (args) => <Footer {...args} />;

export const Default = Template.bind({}) as Story;

Default.args = {};
