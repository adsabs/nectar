import { SimpleLinkDropdown } from '@/components/Dropdown';
import { states } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Dropdown/SimpleLinkDropdown',
  component: SimpleLinkDropdown,
};

type Story = StoryObj<typeof SimpleLinkDropdown>;

export default meta;

const items = states.map((state) => ({
  id: state,
  label: state,
  path: `http://50states.com/${state}`,
  newTab: true,
  disabled: false,
}));

export const Default: Story = {
  args: {
    items,
    label: '50 States',
  },
};
