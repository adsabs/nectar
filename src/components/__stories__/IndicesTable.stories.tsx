import { indicesTableData } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { IndicesTable } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/tables/IndicesTable',
  component: IndicesTable,
};

type Story = StoryObj<typeof IndicesTable>;

export default meta;

export const Default: Story = {
  args: { data: indicesTableData },
};
