import { SimpleLinkList } from '@/components';
import { states } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Dropdown/SimpleLinkList',
  component: SimpleLinkList,
};

type Story = StoryObj<typeof SimpleLinkList>;

export default meta;

const items = states.map((state) => ({
  id: state,
  label: state,
  path: `http://50states.com/${state}`,
  newTab: true,
  disabled: false,
}));

export const Horizontal: Story = {
  args: {
    items,
    selected: 'California',
    label: '50 States',
    showLabel: true,
    asRow: true,
  },
};

export const Vertical: Story = {
  args: {
    items,
    selected: 'California',
    label: '50 States',
    showLabel: true,
    asRow: false,
  },
};
