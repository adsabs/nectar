import { Meta, Story } from '@storybook/react';
import { ListActions } from '@components';

const meta: Meta = {
  title: 'ResultList/ListActions',
  component: ListActions,
};

export default meta;

const Template: Story = (args) => <ListActions {...args} />;

export const Default = Template.bind({}) ;

Default.args = {};
