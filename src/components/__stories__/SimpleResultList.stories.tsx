import { Meta, Story } from '@storybook/react';
import { SimpleResultList, ISimpleResultListProps } from '@components';
import { docs } from './Data';

const meta: Meta = {
  title: 'ResultList/SimpleResultList',
  component: SimpleResultList,
};

export default meta;

const Template: Story<ISimpleResultListProps> = (args) => <SimpleResultList {...args} />;

export const Default = Template.bind({}) as Story<ISimpleResultListProps>;

Default.args = { docs, indexStart: 0, hideCheckboxes: false };
