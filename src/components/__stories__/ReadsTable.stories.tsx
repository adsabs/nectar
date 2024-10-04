import { readsTableData } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { ReadsTable } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/tables/ReadsTable',
  component: ReadsTable,
};

type Story = StoryObj<typeof ReadsTable>;

export default meta;

export const Default: Story = {
  args: { data: readsTableData, isAbstract: false },
};

export const Abstract: Story = {
  args: { data: readsTableData, isAbstract: true },
};
