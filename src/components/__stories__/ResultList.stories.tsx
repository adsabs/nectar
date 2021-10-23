import { Meta, Story } from '@storybook/react';
import { ResultList, IResultListProps } from '../ResultList';

const meta: Meta = {
  title: 'ResultList',
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

const Template: Story<IResultListProps> = args => <ResultList {...args} />;

export const Default = Template.bind({}) as Story<IResultListProps>;

Default.args = {};
