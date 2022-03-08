import { Meta, Story } from '@storybook/react';
import { ItemResourceDropdowns, IItemResourceDropdownsProps } from '@components/ResultList/Item';
import { doc } from './Data';

const meta: Meta = {
  title: 'ResultList/Item/ItemResourceDropdowns',
  component: ItemResourceDropdowns,
};

export default meta;

const Template: Story<IItemResourceDropdownsProps> = (args) => <ItemResourceDropdowns {...args} />;

export const Default = Template.bind({}) as Story<IItemResourceDropdownsProps>;

Default.args = { doc };
