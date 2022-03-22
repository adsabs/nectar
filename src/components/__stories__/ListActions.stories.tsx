import { ListActions } from '@components';
import { Meta, Story } from '@storybook/react';
import { noop } from '@utils';

const meta: Meta = {
  title: 'ResultList/ListActions',
  component: ListActions,
};

export default meta;

const Template: Story = (args) => <ListActions {...args} />;

export const Default = Template.bind({});

Default.args = {
  onSortChange: noop,
};
