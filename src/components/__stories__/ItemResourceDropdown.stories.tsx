import { ItemResourceDropdowns } from '@/components/ResultList/Item';
import { doc } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/Item/ItemResourceDropdowns',
  component: ItemResourceDropdowns,
};

type Story = StoryObj<typeof ItemResourceDropdowns>;
export default meta;

export const Default: Story = {
  args: { doc },
};
