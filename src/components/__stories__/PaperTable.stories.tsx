import { papersTableData } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { PapersTable } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/tables/PapersTable',
  component: PapersTable,
};

type Story = StoryObj<typeof PapersTable>;

export default meta;

export const Default: Story = {
  args: { data: papersTableData },
};
