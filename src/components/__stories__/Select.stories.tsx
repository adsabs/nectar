import { Meta, Story } from '@storybook/react';
import { Select, ISelectProps, ThemeSelectorStyle, SortSelectorStyle, DefaultSelectorStyle } from '@components';
import { states } from './Data';

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

const Template: Story<ISelectProps<string>> = (args) => <Select {...args} />;

export const Default = Template.bind({}) as Story<ISelectProps<string>>;

Default.args = {
  formLabel: 'States',
  options: options,
  value: options[0],
  styles: DefaultSelectorStyle,
};

export const ThemeSelector = Template.bind({}) as Story<ISelectProps<string>>;

ThemeSelector.args = {
  formLabel: 'Themes',
  options: options,
  value: options[0],
  styles: ThemeSelectorStyle,
};

export const SortSelector = Template.bind({}) as Story<ISelectProps<string>>;

SortSelector.args = {
  formLabel: 'Sort by',
  options: options,
  value: options[0],
  styles: SortSelectorStyle,
};
