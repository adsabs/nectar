import { ISimpleLinkDropdownProps, SimpleLinkDropdown } from '@components/Dropdown';
import { ItemType } from '@components/Dropdown/types';
import { states } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Dropdown/SimpleLinkDropdown',
  component: SimpleLinkDropdown,
};

export default meta;

const items: ItemType[] = states.map((state) => ({
  id: state,
  label: state,
  linkProps: { href: `http://50states.com/${state}` },
  newTab: true,
  disabled: false,
}));

const Template: Story<ISimpleLinkDropdownProps> = (args) => <SimpleLinkDropdown {...args} />;

export const Default = Template.bind({});

Default.args = {
  items,
  label: '50 States',
};
