import { IPaginationProps, Pagination } from '@components/Pagination';
import { withQuery } from '@storybook/addon-queryparams';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Pagination',
  component: Pagination,
  decorators: [withQuery],
  argTypes: {
    totalResults: {
      name: 'totalResults',
      defaultValue: 100,
    },
    numPerPage: {
      name: 'numPerPage',
      defaultValue: 10,
    },
  },
  parameters: {
    controls: { expanded: true },
    query: {
      p: '1',
    },
  },
};

export default meta;

const Template: Story<IPaginationProps> = (args) => <Pagination {...args} />;

export const Default = Template.bind({}) as Story<IPaginationProps>;
Default.args = { totalResults: 100, numPerPage: 10 };
