import { IPaginationProps, Pagination } from '@components/ResultList/Pagination';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Pagination',
  component: Pagination,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<IPaginationProps> = (args) => <Pagination {...args} />;

export const Default = Template.bind({}) ;

Default.args = {};
