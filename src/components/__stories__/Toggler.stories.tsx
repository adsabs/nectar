import { Meta, Story } from '@storybook/react';
import { ITogglerProps, Toggler } from '../Toggler';

const meta: Meta = {
  title: 'Toggler',
  component: Toggler,
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

const Template: Story<ITogglerProps> = args => <Toggler {...args} />;

export const Default = Template.bind({});

Default.args = {};
