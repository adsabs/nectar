import { INumFoundProps, NumFound } from '@components';
import { Meta, Story } from '@storybook/react';

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

export const Default = Template.bind({}) as Story<INumFoundProps>;
Default.args = {};

export const WithResults = Template.bind({}) as Story<INumFoundProps>;
WithResults.args = {
  count: 500,
};

export const TotalCitations = Template.bind({}) as Story<INumFoundProps>;
TotalCitations.args = {
  ...WithResults.args,
};

export const TotalNormalizedCitations = Template.bind({}) as Story<INumFoundProps>;
TotalNormalizedCitations.args = {
  ...WithResults.args,
};
