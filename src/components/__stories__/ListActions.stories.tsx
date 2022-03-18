import { IListActionsProps, ListActions } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/ListActions',
  component: ListActions,
};

export default meta;

const Template: Story<IListActionsProps> = (args) => <ListActions {...args} />;

export const Default = Template.bind({});

Default.args = {};
