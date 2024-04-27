import { Select } from '@/components';
import { states } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Select',
  component: Select,
};

type Story = StoryObj<typeof Select>;

export default meta;

const options = states.map((state, index) => ({
  id: `${state}-${index}`,
  value: state,
  label: state,
}));

export const Default: Story = {
  args: {
    label: 'States',
    options: options,
    value: options[0],
    stylesTheme: 'default',
  },
};

export const ThemeSelector: Story = {
  args: {
    label: 'Themes',
    options: options,
    value: options[0],
    stylesTheme: 'theme',
  },
};

export const SortSelector: Story = {
  args: {
    label: 'Sort by',
    options: options,
    value: options[0],
    stylesTheme: 'sort',
  },
};
