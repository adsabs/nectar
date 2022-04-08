import { ISimpleLinkListProps, SimpleLinkList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { states } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Dropdown/SimpleLinkList',
  component: SimpleLinkList,
};

export default meta;

const items: ItemType[] = states.map((state) => ({
  id: state,
  label: state,
  linkProps: { href: `http://50states.com/${state}` },
  newTab: true,
  disabled: false,
}));

const Template: Story<ISimpleLinkListProps> = (args) => <SimpleLinkList {...args} />;

export const Horizontal = Template.bind({});

Horizontal.args = {
  items,
  selected: 'California',
  label: '50 States',
  showLabel: true,
  asRow: true,
};

export const Vertical = Template.bind({});

Vertical.args = {
  items,
  selected: 'California',
  label: '50 States',
  showLabel: true,
  asRow: false,
};
