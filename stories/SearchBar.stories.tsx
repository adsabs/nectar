import { ISearchBarProps, SearchBar } from '@components/SearchBar';
import { Meta, Story } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'SearchBar',
  component: SearchBar,
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

const Template: Story<ISearchBarProps> = (args) => <SearchBar {...args} />;

export const Default = Template.bind({});

export const DefaultArgs = (Default.args = {});
