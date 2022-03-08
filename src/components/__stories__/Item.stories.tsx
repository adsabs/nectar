import { Meta, Story } from '@storybook/react';
import { Item, IItemProps } from '@components/ResultList/Item';
import { doc } from './Data';

const meta: Meta = {
  title: 'ResultList/Item',
  component: Item,
};

export default meta;

const Template: Story<IItemProps> = (args) => <Item {...args} />;

export const Default = Template.bind({}) as Story<IItemProps>;

Default.args = { doc, index: 0, hideCheckbox: false, hideActions: false };
