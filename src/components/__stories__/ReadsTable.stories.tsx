import { Meta, Story } from '@storybook/react';
import { ReadsTable, IReadsTableProps } from '@components';
import { readsTableData } from './Data';

const meta: Meta = {
  title: 'Metrics/ReadsTable',
  component: ReadsTable,
};

export default meta;

const Template: Story<IReadsTableProps> = (args) => <ReadsTable {...args} />;

export const Default = Template.bind({}) as Story<IReadsTableProps>;

Default.args = { data: readsTableData, isAbstract: false };

export const Abstract = Template.bind({}) as Story<IReadsTableProps>;

Abstract.args = { data: readsTableData, isAbstract: true };
