import { ISimpleResultListProps, SimpleResultList } from '@components';
import { docs } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'ResultList/SimpleResultList',
  component: SimpleResultList,
};

export default meta;

const Template: Story<ISimpleResultListProps> = (args) => <SimpleResultList {...args} />;

export const Default = Template.bind({}) as Story<ISimpleResultListProps>;

Default.args = { docs, indexStart: 0, hideCheckboxes: false };
