import { IListBoxProps, ListBox } from '@components/ListBox';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'ListBox',
  component: ListBox,
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

const Template: Story<IListBoxProps> = (args) => <ListBox {...args} />;

export const Default = Template.bind({}) as Story<IListBoxProps>;

Default.args = {
  label: 'ListBox Demo',
};
