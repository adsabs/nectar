import { Meta, Story } from '@storybook/react';
import { Panel, IPanelProps } from '../Panel';

const meta: Meta = {
  title: 'Panel',
  component: Panel,
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

const Template: Story<IPanelProps> = (args) => <Panel {...args} />;

export const Default = Template.bind({}) as Story<IPanelProps>;

Default.args = {};
