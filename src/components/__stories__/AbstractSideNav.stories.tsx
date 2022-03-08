import { AbstractSideNav, IAbstractSideNavProps } from '@components';
import { doc } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'AbstractSideNav',
  component: AbstractSideNav,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<IAbstractSideNavProps> = (args) => <AbstractSideNav {...args} />;

export const Default = Template.bind({}) as Story<IAbstractSideNavProps>;

Default.args = {
  doc: doc,
};
