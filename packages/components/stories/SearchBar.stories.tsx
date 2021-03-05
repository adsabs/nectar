import { Meta, Story } from '@storybook/react';
import React from 'react';
import { ISearchBarProps, SearchBar } from '../src/SearchBar';

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

Default.args = {};
