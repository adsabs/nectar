import { AbstractRefList, IAbstractRefListProps } from '@components';
import { docs } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'AbstractRefList',
  component: AbstractRefList,
  argTypes: {
    onPageChange: { action: 'onPageChange' },
  },
};

export default meta;

const Template: Story<IAbstractRefListProps> = (args) => <AbstractRefList {...args} />;

export const Default = Template.bind({}) ;

Default.args = { docs, indexStart: 0, href: '', totalResults: docs.length };
