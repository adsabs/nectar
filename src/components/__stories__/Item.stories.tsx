import { IItemProps, Item } from '@components/ResultList/Item';
import { doc } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/Item',
  component: Item,
};

export default meta;

const Template: Story<IItemProps> = (args) => <Item {...args} />;

export const Default = Template.bind({}) ;

Default.args = { doc, index: 0, hideCheckbox: false, hideActions: false };
