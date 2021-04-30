import { IResultListProps, ResultList } from '@components/ResultList';
import { Meta, Story } from '@storybook/react';
import React from 'react';

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

const Template: Story<IResultListProps> = (args) => <ResultList {...args} />;

export const Default = Template.bind({});

export const DefaultArgs = (Default.args = {
  docs: [{ id: '1', bibcode: 'bibcode' }],
  selected: [],
  onSelectedChange: () => {},
  loading: false,
});
