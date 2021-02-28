import React from 'react';
import { Meta, Story } from '@storybook/react';
import { SearchExamples, ISearchExamplesProps } from '../src/SearchExamples';

const meta: Meta = {
  title: 'Component SearchExamples',
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

const Template: Story<ISearchExamplesProps> = args => <SearchExamples {...args} />;

export const Default = Template.bind({});

Default.args = {};
