import { Meta, Story } from '@storybook/react';
import { SimpleLinkDropdown, ISimpleLinkDropdownProps } from '@components/Dropdown';
import { states } from './Data';

const meta: Meta = {
  title: 'Dropdown/SimpleLinkDropdown',
  component: SimpleLinkDropdown,
};

export default meta;

const items = states.map((state) => ({
  id: state,
  label: state,
  path: `http://50states.com/${state}`,
  newTab: true,
  disabled: false,
}));

const Template: Story<ISimpleLinkDropdownProps> = (args) => <SimpleLinkDropdown {...args} />;

export const Default = Template.bind({}) as Story<ISimpleLinkDropdownProps>;

Default.args = {
  items,
  label: '50 States',
};
