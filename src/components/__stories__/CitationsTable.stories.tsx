import { CitationsTable, ICitationsTableProps } from '@components';
import { citationsTableData } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Metrics/CitationsTable',
  component: CitationsTable,
};

export default meta;

const Template: Story<ICitationsTableProps> = (args) => <CitationsTable {...args} />;

export const Default = Template.bind({}) as Story<ICitationsTableProps>;

Default.args = { data: citationsTableData, isAbstract: false };

export const Abstract = Template.bind({}) as Story<ICitationsTableProps>;

Abstract.args = { data: citationsTableData, isAbstract: true };
