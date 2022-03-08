import { Meta, Story } from '@storybook/react';
import { ResultList } from '@components';

const meta: Meta = {
  title: 'ResultList/ResultList',
  component: ResultList,
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

const Template: Story = (args) => <ResultList {...args} />;

export const Default = Template.bind({}) as Story;

Default.args = {};
