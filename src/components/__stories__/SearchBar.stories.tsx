import { ISearchBarProps, SearchBar } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'SearchBar',
  component: SearchBar,
};

export default meta;

const Template: Story<ISearchBarProps> = (args) => <SearchBar {...args} />;

export const Primary = Template.bind({});

Primary.args = {};
