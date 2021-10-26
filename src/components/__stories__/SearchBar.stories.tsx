import { ISearchBarProps, SearchBar } from '@components/SearchBar';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'SearchBar',
  component: SearchBar,
  argTypes: {},
  parameters: {},
  decorators: [],
};

export default meta;

const Template: Story<ISearchBarProps> = (args) => <SearchBar {...args} />;

export const Default = Template.bind({}) as Story<ISearchBarProps>;
export const WithInitialQuery = Template.bind({}) as Story<ISearchBarProps>;

Default.args = {};
WithInitialQuery.args = {
  initialQuery: 'author:"^accomazzi"',
};
