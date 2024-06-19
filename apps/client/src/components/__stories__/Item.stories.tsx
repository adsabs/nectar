import { Item } from '@/components/ResultList/Item';
import { doc } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/Item',
  component: Item,
};

type Story = StoryObj<typeof Item>;
export default meta;

export const Default: Story = {
  args: { doc, index: 0, hideCheckbox: false, hideActions: false },
};
