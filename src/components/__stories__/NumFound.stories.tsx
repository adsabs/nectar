import { INumFoundProps, NumFound } from '@components/NumFound';
import { Meta, Story } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'NumFound',
  component: NumFound,
  argTypes: {
    count: {
      name: 'count',
      defaultValue: 0,
      description: 'The count of results found',
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<INumFoundProps> = (args) => <NumFound {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const WithResults = Template.bind({});
WithResults.args = {
  count: 500,
};

export const TotalCitations = Template.bind({});
TotalCitations.args = {
  ...WithResults.args,
  citationsCount: 100,
};

export const TotalNormalizedCitations = Template.bind({});
TotalNormalizedCitations.args = {
  ...WithResults.args,
  normalizedCitationsCount: 100,
};
