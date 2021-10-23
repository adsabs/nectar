import { Meta, Story } from '@storybook/react';
import { AbstractSources, IAbstractSourcesProps } from '../AbstractSources';

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

export const Default = Template.bind({}) as Story<IAbstractSourcesProps>;

Default.args = {};
