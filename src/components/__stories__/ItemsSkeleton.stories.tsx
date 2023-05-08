import { Meta, Story } from '@storybook/react';
import { ISkeletonProps, ItemsSkeleton } from '@components';

const meta: Meta = {
  title: 'ResultList/ItemsSkeleton',
  component: ItemsSkeleton,
};

export default meta;

const Template: Story<ISkeletonProps> = (args) => <ItemsSkeleton {...args} />;

export const Default = Template.bind({}) ;

Default.args = {
  count: 5,
};
