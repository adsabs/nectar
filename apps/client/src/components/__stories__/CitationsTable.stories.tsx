import { CitationsTable } from '@/components';
import { citationsTableData } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/tables/CitationsTable',
  component: CitationsTable,
};

type Story = StoryObj<typeof CitationsTable>;

export default meta;

export const Default: Story = {
  args: { data: citationsTableData, isAbstract: false },
};

export const Abstract: Story = {
  args: { data: citationsTableData, isAbstract: true },
};
