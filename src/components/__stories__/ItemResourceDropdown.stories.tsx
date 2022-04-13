import { IItemResourceDropdownsProps, ItemResourceDropdowns } from '@components/ResultList/Item';
import { doc } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/Item/ItemResourceDropdowns',
  component: ItemResourceDropdowns,
};

export default meta;

const Template: Story<IItemResourceDropdownsProps> = (args) => <ItemResourceDropdowns {...args} />;

export const Default = Template.bind({});

Default.args = { doc };
