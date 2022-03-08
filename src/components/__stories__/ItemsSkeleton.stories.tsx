import { Meta, Story } from '@storybook/react';
import { ItemsSkeleton, ISkeletonProps } from '@components';

const meta: Meta = {
  title: 'ResultList/ItemsSkeleton',
  component: ItemsSkeleton,
};

export default meta;

const Template: Story<ISkeletonProps> = (args) => <ItemsSkeleton {...args} />;

export const Default = Template.bind({}) as Story<ISkeletonProps>;

Default.args = {
  count: 5,
};
