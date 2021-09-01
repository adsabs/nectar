import { ISearchExamplesProps, SearchExamples } from '@components/SearchExamples';
import { Meta, Story } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'SearchExamples',
  component: SearchExamples,
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

const Template: Story<ISearchExamplesProps> = (args) => <SearchExamples {...args} />;

export const Default = Template.bind({}) as Story<ISearchExamplesProps>;

Default.args = {};
