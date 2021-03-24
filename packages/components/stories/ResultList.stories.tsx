import { Meta, Story } from '@storybook/react';
import React from 'react';
import { IResultListProps, ResultList } from '../src/ResultList';

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

export const Default = Template.bind({});

Default.args = {
  docs: [{ id: 1, bibcode: 'bibcode' }],
  selected: [],
  onSelectedChange: () => { },
  loading: false
};
