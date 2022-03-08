import { Meta, Story } from '@storybook/react';
import { AbstractRefList, IAbstractRefListProps } from '@components';
import { docs } from './Data';

const meta: Meta = {
  title: 'AbstractRefList',
  component: AbstractRefList,
  argTypes: {
    onPageChange: { action: 'onPageChange' },
  },
};

export default meta;

const Template: Story<IAbstractRefListProps> = (args) => <AbstractRefList {...args} />;

export const Default = Template.bind({}) as Story<IAbstractRefListProps>;

Default.args = { docs, indexStart: 0, href: '', totalResults: docs.length };
