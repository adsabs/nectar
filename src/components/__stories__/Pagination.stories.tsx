import { Pagination, PaginationProps } from '@components/ResultList/Pagination';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Pagination',
  component: Pagination,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<PaginationProps> = (args) => <Pagination {...args} />;

export const Default = Template.bind({});

Default.args = {};
