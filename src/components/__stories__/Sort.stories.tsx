import { ISortProps, Sort } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Sort',
  component: Sort,
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

const Template: Story<ISortProps> = (args) => <Sort {...args} />;

export const Default = Template.bind({}) as Story<ISortProps>;

Default.args = {};
