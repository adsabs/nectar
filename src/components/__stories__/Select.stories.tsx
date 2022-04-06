import { ISelectProps, Select } from '@components';
import { states } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Select',
  component: Select,
};

export default meta;

const options = states.map((state, index) => ({
  id: `${state}-${index}`,
  value: state,
  label: state,
}));

const Template: Story<ISelectProps> = (args) => <Select {...args} />;

export const Default = Template.bind({});

Default.args = {
  label: 'States',
  options: options,
  value: options[0],
  stylesTheme: 'default',
};

export const ThemeSelector = Template.bind({});

ThemeSelector.args = {
  label: 'Themes',
  options: options,
  value: options[0],
  stylesTheme: 'theme',
};

export const SortSelector = Template.bind({});

SortSelector.args = {
  label: 'Sort by',
  options: options,
  value: options[0],
  stylesTheme: 'sort',
};
