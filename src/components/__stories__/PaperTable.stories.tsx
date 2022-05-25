import { PapersTable, IPapersTableProps } from '@components';
import { papersTableData } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/tables/PapersTable',
  component: PapersTable,
};

export default meta;

const Template: Story<IPapersTableProps> = (args) => <PapersTable {...args} />;

export const Default = Template.bind({});

Default.args = { data: papersTableData };
