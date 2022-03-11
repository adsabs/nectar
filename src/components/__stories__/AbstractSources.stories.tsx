import { AbstractSources, IAbstractSourcesProps } from '@components';
import { doc } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'AbstractSources',
  component: AbstractSources,
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

const Template: Story<IAbstractSourcesProps> = (args) => <AbstractSources {...args} />;

export const Default = Template.bind({}) ;

Default.args = { doc };
