import { Pagination, IPaginationProps } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/Pagination',
  component: Pagination,
  argTypes: {
    onPageChange: { action: 'onPageChange' },
  },
};

export default meta;

const Template: Story<IPaginationProps> = (args) => <Pagination {...args} />;

export const Default = Template.bind({}) as Story<IPaginationProps>;

Default.args = { totalResults: 150, numPerPage: 25 };
